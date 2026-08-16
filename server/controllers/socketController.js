import { createRoom, joinRoom } from "../services/roomService.js";
import { Allgroups, createGroup, joinGroup } from "../services/groupService.js";

const roomGames = new Map();
const roomTimers = new Map();

const rooms = new Map();

const createRoomState = (roomCode) => ({

    roomCode,
    players: new Map(),
    teams : [
        {name : "Team 1", score : 0, players: []},
        {name : "Team 2", score : 0, players : []}
    ],
    game : {

        phase : "lobby",
        currentWord : "",
        turnEndsAt : 0,
        turnMs : 60000,
        currentTeamIndex : 0
    }

});

const getSessionId = (socket, sessionId) => sessionId || socket.id;

const getOrCreateRoomState = (roomCode) => {
    if (!rooms.has(roomCode)) {
        rooms.set(roomCode, createRoomState(roomCode));
    }

    return rooms.get(roomCode);
};

const findRoomBySessionId = (sessionId) => {
    for (const room of rooms.values()) {
        if (room.players.has(sessionId)) {
            return room;
        }
    }

    return null;
};

const getTeamIndexForGroup = (room, groupName) => {
    let teamIndex = room.teams.findIndex((team) => team.name === groupName);

    if (teamIndex >= 0) {
        return teamIndex;
    }

    teamIndex = room.teams.findIndex((team, idx) => team.name === `Team ${idx + 1}`);

    if (teamIndex >= 0) {
        room.teams[teamIndex].name = groupName;
        return teamIndex;
    }

    room.teams.push({ name: groupName, score: 0, players: [] });
    return room.teams.length - 1;
};

const syncTeamPlayers = (room) => {
    room.teams.forEach((team) => {
        team.players = [];
    });

    for (const player of room.players.values()) {
        if (!Number.isInteger(player.teamIndex) || player.teamIndex < 0) {
            continue;
        }

        if (!room.teams[player.teamIndex]) {
            room.teams[player.teamIndex] = {
                name: `Team ${player.teamIndex + 1}`,
                score: 0,
                players: [],
            };
        }

        room.teams[player.teamIndex].players.push({
            id: player.sessionId,
            name: player.userName,
            connected: player.connected,
        });
    }
};

const syncGameToRoom = (roomCode, game) => {
    const room = rooms.get(roomCode);

    if (!room) {
        return;
    }

    const turnsPlayed = Number.isInteger(game.turnsPlayed) ? game.turnsPlayed : 0;
    const roundsPlayed = Number.isInteger(game.roundsPlayed) ? game.roundsPlayed : 0;
    const roundLimit = Number.isInteger(game.roundLimit) ? game.roundLimit : 0;
    const currentRound = roundLimit > 0 ? Math.min(roundLimit, roundsPlayed + 1) : 1;

    room.game = {
        phase: game.phase || "playing",
        currentWord: game.currentWord || "",
        turnsEndAt: game.turnsEndAt || 0,
        turnMs: game.turnMs || 60000,
        currentTeamIndex: Number.isInteger(game.currentTeamIndex) ? game.currentTeamIndex : 0,
        groups: game.groups || defaultTeamState(),
        winner: game.winner || null,
        turnsPlayed,
        roundsPlayed,
        roundLimit,
        currentRound,
    };

    room.teams.forEach((team, idx) => {
        team.score = Array.isArray(game.groups) && Array.isArray(game.groups[idx]) ? game.groups[idx][0] : team.score || 0;
    });

    syncTeamPlayers(room);
};

const buildRoomSnapshot = (roomCode, viewerSessionId = "") => {
    const room = rooms.get(roomCode);

    if (!room) {
        return { ok: false, reason: "Room not found" };
    }

    syncTeamPlayers(room);

    const players = [...room.players.values()].map((player) => ({
        sessionId: player.sessionId,
        userName: player.userName,
        connected: player.connected,
        teamIndex: Number.isInteger(player.teamIndex) ? player.teamIndex : -1,
        groupName: player.groupName || "",
    }));

    const teams = room.teams.map((team, idx) => {
        const users = team.players.map((player) => ({
            id: player.id,
            name: player.name,
            connected: player.connected,
        }));

        const status = room.game.phase === "lobby"
            ? (users.length > 0 ? "Ready" : "Waiting")
            : (idx === room.game.currentTeamIndex ? "Drawing" : "Guessing");

        return {
            name: team.name,
            score: Array.isArray(room.game?.groups) && Array.isArray(room.game.groups[idx])
                ? room.game.groups[idx][0]
                : team.score || 0,
            status,
            users,
            players: users,
        };
    });

    const viewer = viewerSessionId ? room.players.get(viewerSessionId) : null;
    const isViewerDrawer = Boolean(
        viewer &&
        Number.isInteger(viewer.teamIndex) &&
        viewer.teamIndex === room.game.currentTeamIndex
    );

    const safeGame = {
        ...room.game,
        currentWord: isViewerDrawer ? room.game.currentWord : "",
        currentWordVisible: isViewerDrawer,
    };

    return {
        ok: true,
        roomCode,
        teams,
        players,
        game: safeGame,
        yourSessionId: viewerSessionId,
        yourTeamIndex: viewer && Number.isInteger(viewer.teamIndex) ? viewer.teamIndex : -1,
        yourGroupName: viewer?.groupName || "",
        currentWord: safeGame.currentWord,
        currentWordVisible: safeGame.currentWordVisible,
    };
};

const emitPersonalizedRoomSnapshots = (io, roomCode) => {
    const room = rooms.get(roomCode);

    if (!room) {
        return;
    }

    const currentRoomSockets = io.sockets.adapter.rooms.get(roomCode) || new Set();

    for (const socketId of currentRoomSockets) {
        const socket = io.sockets.sockets.get(socketId);
        const sessionId = socket?.data?.sessionId || socketId;

        if (!socket || !sessionId) {
            continue;
        }

        const player = room.players.get(sessionId);
        if (!player || !player.connected) {
            continue;
        }

        io.to(socketId).emit("room:snapshot", buildRoomSnapshot(roomCode, sessionId));
    }
};

const emitGroupListToRoom = (io, roomCode) => {
    const all = Allgroups({ roomCode });
    io.to(roomCode).emit("getAllGroup", { success: true, groups: all.groups });
};

const attachPlayerToRoom = (roomCode, { sessionId, socketId, userName, groupName = "", teamIndex = -1 }) => {
    const room = getOrCreateRoomState(roomCode);
    const resolvedSessionId = sessionId || socketId;

    room.players.set(resolvedSessionId, {
        sessionId: resolvedSessionId,
        socketId,
        userName,
        connected: true,
        teamIndex,
        groupName,
    });

    syncTeamPlayers(room);
    return room;
};

const updatePlayerTeam = (roomCode, { sessionId, socketId, userName, groupName }) => {
    const room = getOrCreateRoomState(roomCode);
    const resolvedSessionId = sessionId || socketId;
    const teamIndex = getTeamIndexForGroup(room, groupName);

    const current = room.players.get(resolvedSessionId) || {
        sessionId: resolvedSessionId,
        socketId,
        userName,
        connected: true,
        teamIndex,
        groupName,
    };

    current.socketId = socketId;
    current.userName = userName || current.userName;
    current.connected = true;
    current.teamIndex = teamIndex;
    current.groupName = groupName;

    room.players.set(resolvedSessionId, current);
    syncTeamPlayers(room);

    return { room, teamIndex, sessionId: resolvedSessionId };
};

const defaultTeamState = () => [[0, "Drawing"], [0, "Guessing"]];

const shuffle = (arr = []) => {
    const a = [...arr];

    for (let idx = a.length - 1; idx > 0; idx -= 1) {
        const jdx = Math.floor(Math.random() * (idx + 1));
        [a[idx], a[jdx]] = [a[jdx], a[idx]];
    }

    return a;
};

const pickWord = (game) => {
    if (!game.bag || game.bag.length === 0) {
        game.bag = shuffle(game.wordPool || []);
    }

    const next = game.bag.pop();
    return next || "";
};

const toPublicState = (game) => {
    const turnsPlayed = Number.isInteger(game.turnsPlayed) ? game.turnsPlayed : 0;
    const roundsPlayed = Number.isInteger(game.roundsPlayed) ? game.roundsPlayed : 0;
    const roundLimit = Number.isInteger(game.roundLimit) ? game.roundLimit : 0;
    const currentRound = roundLimit > 0 ? Math.min(roundLimit, roundsPlayed + 1) : 1;

    return {
        groups: game.groups,
        turnsEndAt: game.turnsEndAt,
        turnMs: game.turnMs,
        phase: game.phase || "playing",
        currentTeamIndex: Number.isInteger(game.currentTeamIndex) ? game.currentTeamIndex : 0,
        currentWordVisible: false,
        winner: game.winner || null,
        turnsPlayed,
        roundsPlayed,
        roundLimit,
        currentRound,
        gameOver: game.phase === "finished",
    };
};

const normalizeText = (text) => String(text || "").trim().toLowerCase();

const getMatchWinner = (game) => {
    const entries = Array.isArray(game.groups) ? game.groups : [];
    const prepared = entries.map(([score = 0], idx) => ({
        teamIndex: idx,
        teamName: `Team ${idx + 1}`,
        score: Number(score) || 0,
    }));

    if (prepared.length === 0) {
        return { teamIndex: -1, teamName: "It's a tie", score: 0 };
    }

    const topScore = Math.max(...prepared.map((entry) => entry.score), 0);
    const leaders = prepared.filter((entry) => entry.score === topScore);

    if (leaders.length > 1) {
        return { teamIndex: -1, teamName: "It's a tie", score: topScore };
    }

    const leader = leaders[0];
    return { teamIndex: leader.teamIndex, teamName: leader.teamName, score: topScore };
};

const finishGame = (io, roomCode) => {
    const game = roomGames.get(roomCode);
    if (!game || game.phase === "finished") {
        return;
    }

    if (roomTimers.has(roomCode)) {
        clearTimeout(roomTimers.get(roomCode));
        roomTimers.delete(roomCode);
    }

    game.phase = "finished";
    game.currentWord = "";
    game.currentWordVisible = false;
    game.turnsEndAt = 0;
    game.winner = getMatchWinner(game);

    syncGameToRoom(roomCode, game);
    io.to(roomCode).emit("game:state", toPublicState(game));
    io.to(roomCode).emit("game:result", game.winner);
    emitPersonalizedRoomSnapshots(io, roomCode);
};

const scheduleAdvance = (io, roomCode) => {
    const game = roomGames.get(roomCode);
    if (!game || game.phase === "finished") return;

    if (roomTimers.has(roomCode)) {
        clearTimeout(roomTimers.get(roomCode));
    }

    const timeoutId = setTimeout(() => {
        const curr = roomGames.get(roomCode);
        if (!curr || curr.phase === "finished") return;

        curr.turnsPlayed = (curr.turnsPlayed || 0) + 1;
        const numTeams = Array.isArray(curr.groups) && curr.groups.length > 0 ? curr.groups.length : 2;
        curr.roundsPlayed = Math.floor(curr.turnsPlayed / numTeams);

        if (curr.roundsPlayed >= curr.roundLimit) {
            finishGame(io, roomCode);
            return;
        }

        curr.currentTeamIndex = (curr.currentTeamIndex + 1) % numTeams;
        curr.groups = curr.groups.map(([score], idx) => [
            score,
            idx === curr.currentTeamIndex ? "Drawing" : "Guessing"
        ]);
        curr.currentWord = pickWord(curr);
        curr.turnsEndAt = Date.now() + curr.turnMs;
        curr.phase = "playing";

        syncGameToRoom(roomCode, curr);
        io.to(roomCode).emit("game:state", toPublicState(curr));
        emitPersonalizedRoomSnapshots(io, roomCode);
        scheduleAdvance(io, roomCode);
    }, game.turnMs);

    roomTimers.set(roomCode, timeoutId);
};

export const handleConnection = (io,socket) => {

    console.log("user Connected");

    socket.on("Create Room", (roomCode,userName,sessionId) => {

        const resolvedSessionId = getSessionId(socket, sessionId);

        const result = createRoom({roomCode,userName,userId:resolvedSessionId});

        if (!result.success){
            socket.emit("Room error",result.error);
            return;
        }

        const room = attachPlayerToRoom(roomCode, {
            sessionId: resolvedSessionId,
            socketId: socket.id,
            userName,
        });

        socket.data.sessionId = resolvedSessionId;
        socket.data.roomCode = roomCode;

        socket.join(roomCode);
        socket.emit("roomCreated", {success: true, roomCode, message: "Room created successfully"});
        emitGroupListToRoom(io, roomCode);
        emitPersonalizedRoomSnapshots(io, roomCode);

        if (room.game?.phase && room.game.phase !== "lobby") {
            socket.emit("game:state", toPublicState(room.game));
        }

    })

    socket.on("Join Room",(roomCode,userName,sessionId) => {

        const resolvedSessionId = getSessionId(socket, sessionId);

        const result = joinRoom({roomCode,userName,userId:resolvedSessionId});

        if (!result.success){
            socket.emit("Join error",result.error);
            return;
        }

        attachPlayerToRoom(roomCode, {
            sessionId: resolvedSessionId,
            socketId: socket.id,
            userName,
        });

        socket.data.sessionId = resolvedSessionId;
        socket.data.roomCode = roomCode;

        socket.join(roomCode);
        socket.emit("RoomJoined", {success: true, roomCode, message: "Joined room successfully"});
        emitGroupListToRoom(io, roomCode);
        emitPersonalizedRoomSnapshots(io, roomCode);

    })

    socket.on("callAllGroup",(roomCode) => {

        const result = Allgroups({roomCode});

        socket.emit("getAllGroup",{success: true,groups:result.groups});

    })

    socket.on("createGroup",(roomCode,userName,groupName,sessionId) => {

        const resolvedSessionId = getSessionId(socket, sessionId);

        const result = createGroup({roomCode,userName,groupName,userId:resolvedSessionId});

        if (!result.success){
            socket.emit("GroupCreateerror",result.error);
            return;
        }

        updatePlayerTeam(roomCode, {
            sessionId: resolvedSessionId,
            socketId: socket.id,
            userName,
            groupName,
        });

        socket.data.sessionId = resolvedSessionId;
        socket.data.roomCode = roomCode;

        socket.join(result.groupId);
        socket.to(roomCode).emit("Group Created",{message : "Group Created", userName : userName, groupName : groupName});
        socket.emit("groupCreated",{success: true,groupId : result.groupId, groupName});

        const all = Allgroups({ roomCode });
        io.to(roomCode).emit("getAllGroup", { success: true, groups: all.groups });
        emitPersonalizedRoomSnapshots(io, roomCode);

    })

    socket.on("joinGroup",(roomCode,userName,groupName,sessionId) => {

        const resolvedSessionId = getSessionId(socket, sessionId);

        const result = joinGroup({roomCode,userName,groupName,userId:resolvedSessionId});
        
        if (!result.success){
            socket.emit("GroupJoinerror",result.error);
            return;
        }

        updatePlayerTeam(roomCode, {
            sessionId: resolvedSessionId,
            socketId: socket.id,
            userName,
            groupName,
        });

        socket.data.sessionId = resolvedSessionId;
        socket.data.roomCode = roomCode;

        socket.join(result.groupId);
        socket.to(roomCode).emit("User Joined Group",{message : "New user Joined", userName : userName, groupName : groupName});
        socket.emit("groupJoined",{success: true,groupId : result.groupId, groupName});

        emitGroupListToRoom(io, roomCode);
        emitPersonalizedRoomSnapshots(io, roomCode);
    })

    socket.on("canvas:draw-start", ({ roomCode, x, y, color, size }) => {
        if (!roomCode) return;
        socket.to(roomCode).emit("canvas:draw-start", { x, y, color, size });
    })

    socket.on("canvas:draw-line", ({ roomCode, x1, y1, x2, y2, color, size }) => {
        if (!roomCode) return;
        socket.to(roomCode).emit("canvas:draw-line", { x1, y1, x2, y2, color, size });
    })

    socket.on("canvas:draw-end", ({ roomCode }) => {
        if (!roomCode) return;
        socket.to(roomCode).emit("canvas:draw-end");
    })

    socket.on("canvas:clear", ({ roomCode }) => {
        if (!roomCode) return;
        socket.to(roomCode).emit("canvas:clear");
    })

    socket.on("game:start", ({ roomCode, wordPool, turnMs, groups, roundLimit }) => {
        if (!roomCode || !Array.isArray(wordPool) || wordPool.length === 0) {
            return;
        }

        const room = getOrCreateRoomState(roomCode);

        // Ensure all players have correct team indices based on their groups
        for (const player of room.players.values()) {
            if (player.groupName) {
                const teamIdx = getTeamIndexForGroup(room, player.groupName);
                player.teamIndex = teamIdx;
            }
        }

        syncTeamPlayers(room);

        const normalizedTurnMs = Number(turnMs);
        const safeTurnMs = Number.isFinite(normalizedTurnMs) && normalizedTurnMs > 1000 ? normalizedTurnMs : 60000;
        const safeRoundLimit = Number(roundLimit);
        const finalRoundLimit = Number.isFinite(safeRoundLimit) && safeRoundLimit > 0 ? safeRoundLimit : 1;

        const normalizedGroups = Array.isArray(groups) && groups.length === 2
            ? groups
            : defaultTeamState();

        const game = {
            roomCode,
            wordPool,
            bag: [],
            turnMs: safeTurnMs,
            groups: normalizedGroups,
            currentWord: "",
            turnsEndAt: 0,
            turnsPlayed: 0,
            roundsPlayed: 0,
            roundLimit: finalRoundLimit,
            winner: null,
            phase: "lobby",
        };

        game.currentWord = pickWord(game);
        game.turnsEndAt = Date.now() + game.turnMs;
        game.phase = "playing";
        game.currentTeamIndex = 0;
        roomGames.set(roomCode, game);

        syncGameToRoom(roomCode, game);

        io.to(roomCode).emit("game:state", toPublicState(game));
        emitPersonalizedRoomSnapshots(io, roomCode);
        scheduleAdvance(io, roomCode);
    })

    socket.on("game:request-state", ({ roomCode }) => {
        if (!roomCode) return;

        const game = roomGames.get(roomCode);
        if (!game) return;

        syncGameToRoom(roomCode, game);
        socket.emit("game:state", toPublicState(game));
    })

    socket.on("room:request-snapshot", ({ roomCode }) => {
        if (!roomCode) return;

        const resolvedSessionId = socket.data.sessionId || socket.id;
        socket.emit("room:snapshot", buildRoomSnapshot(roomCode, resolvedSessionId));
    })

    socket.on("game:submit-guess", ({ roomCode, guess, groupIndex }) => {
        if (!roomCode) return;

        const game = roomGames.get(roomCode);
        if (!game || game.phase === "finished") return;

        const idx = Number(groupIndex);
        if (!Number.isInteger(idx) || idx < 0 || idx > 1) return;

        const isCorrect = normalizeText(guess) === normalizeText(game.currentWord);
        const canScore = game.groups?.[idx]?.[1] === "Guessing";

        if (!isCorrect || !canScore) {
            socket.emit("game:guess-result", { correct: false });
            return;
        }

        game.groups[idx][0] += 30;
        game.turnsPlayed = (game.turnsPlayed || 0) + 1;
        const numTeams = Array.isArray(game.groups) && game.groups.length > 0 ? game.groups.length : 2;
        game.roundsPlayed = Math.floor(game.turnsPlayed / numTeams);

        if (game.roundsPlayed >= game.roundLimit) {
            finishGame(io, roomCode);
            return;
        }

        game.currentTeamIndex = (game.currentTeamIndex + 1) % numTeams;
        game.groups = game.groups.map(([score], tIdx) => [
            score,
            tIdx === game.currentTeamIndex ? "Drawing" : "Guessing"
        ]);
        game.currentWord = pickWord(game);
        game.turnsEndAt = Date.now() + game.turnMs;
        game.phase = "playing";

        syncGameToRoom(roomCode, game);
        io.to(roomCode).emit("game:state", toPublicState(game));
        io.to(roomCode).emit("game:guess-result", { correct: true, teamIndex: idx });
        emitPersonalizedRoomSnapshots(io, roomCode);
        scheduleAdvance(io, roomCode);
    })

    socket.on("session:resume",({sessionId,userName,roomCode}) => {

        const resolvedSessionId = getSessionId(socket, sessionId);
        const room = roomCode ? rooms.get(roomCode) : findRoomBySessionId(resolvedSessionId);

        if (!room){

            socket.emit("room:snapshot", {ok : false, reason : "Room not found"});
            return;

        }

        const resolvedRoomCode = room.roomCode;
        const player = room.players.get(resolvedSessionId);

        if (!player){

            socket.emit("room:snapshot" , {ok : false, reason : "Session not found"});
            return;

        }

        player.socketId = socket.id;
        player.connected = true;
        player.userName = userName || player.userName;

        // Ensure player has correct team index based on their group
        if (player.groupName) {
            player.teamIndex = getTeamIndexForGroup(room, player.groupName);
        }

        syncTeamPlayers(room);

        socket.data.sessionId = resolvedSessionId;
        socket.data.roomCode = resolvedRoomCode;

        socket.join(resolvedRoomCode);

        socket.emit("room:snapshot", buildRoomSnapshot(resolvedRoomCode, resolvedSessionId));

        const game = roomGames.get(resolvedRoomCode);
        if (game) {
            socket.emit("game:state", toPublicState(game));
        }
    })

    socket.on("game:rematch", ({ roomCode }) => {
        if (!roomCode) return;

        const game = roomGames.get(roomCode);
        if (roomTimers.has(roomCode)) {
            clearTimeout(roomTimers.get(roomCode));
            roomTimers.delete(roomCode);
        }

        const room = rooms.get(roomCode);
        const freshGroups = Array.isArray(room?.teams) && room.teams.length >= 2
            ? [
                [0, "Drawing"],
                [0, "Guessing"],
            ]
            : defaultTeamState();

        const nextGame = {
            roomCode,
            wordPool: game?.wordPool || [],
            bag: [],
            turnMs: game?.turnMs || 60000,
            groups: freshGroups,
            currentWord: "",
            turnsEndAt: 0,
            turnsPlayed: 0,
            roundsPlayed: 0,
            roundLimit: Number.isInteger(game?.roundLimit) && game.roundLimit > 0 ? game.roundLimit : 1,
            winner: null,
            phase: "lobby",
        };

        if (nextGame.wordPool.length === 0) {
            const roomSettings = room?.settings || {};
            const pool = roomSettings.words || [];
            nextGame.wordPool = Array.isArray(pool) && pool.length > 0 ? pool : ["Cat", "Dog", "House", "Car"];
        }

        nextGame.currentWord = pickWord(nextGame);
        nextGame.turnsEndAt = Date.now() + nextGame.turnMs;
        nextGame.phase = "playing";
        nextGame.currentTeamIndex = 0;
        roomGames.set(roomCode, nextGame);

        if (room) {
            room.game = {
                ...nextGame,
                currentWord: nextGame.currentWord,
                currentWordVisible: false,
                winner: null,
            };
            room.teams = [
                { name: "Team 1", score: 0, players: room.teams[0]?.players || [] },
                { name: "Team 2", score: 0, players: room.teams[1]?.players || [] },
            ];
        }

        syncGameToRoom(roomCode, nextGame);
        io.to(roomCode).emit("game:state", toPublicState(nextGame));
        emitPersonalizedRoomSnapshots(io, roomCode);
        scheduleAdvance(io, roomCode);
    })

    socket.on("disconnect", () => {
        const resolvedSessionId = socket.data.sessionId;
        const resolvedRoomCode = socket.data.roomCode;

        if (!resolvedSessionId) {
            return;
        }

        const room = (resolvedRoomCode && rooms.get(resolvedRoomCode)) || findRoomBySessionId(resolvedSessionId);

        if (!room) {
            return;
        }

        const player = room.players.get(resolvedSessionId);

        if (!player) {
            return;
        }

        player.connected = false;
        player.socketId = null;
        syncTeamPlayers(room);

        emitPersonalizedRoomSnapshots(io, room.roomCode);
    });
}