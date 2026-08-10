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

    room.game = {
        phase: game.phase || "playing",
        currentWord: game.currentWord || "",
        turnsEndAt: game.turnsEndAt || 0,
        turnMs: game.turnMs || 60000,
        currentTeamIndex: Number.isInteger(game.currentTeamIndex) ? game.currentTeamIndex : 0,
        groups: game.groups || defaultTeamState(),
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

        return {
            name: team.name,
            score: Array.isArray(room.game?.groups) && Array.isArray(room.game.groups[idx])
                ? room.game.groups[idx][0]
                : team.score || 0,
            status: users.length > 0 ? "Ready" : "Waiting",
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

    for (const player of room.players.values()) {
        if (!player.connected || !player.socketId) {
            continue;
        }

        io.to(player.socketId).emit("room:snapshot", buildRoomSnapshot(roomCode, player.sessionId));
    }
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

const toPublicState = (game) => ({
    groups: game.groups,
    turnsEndAt: game.turnsEndAt,
    turnMs: game.turnMs,
    phase: game.phase || "playing",
    currentTeamIndex: Number.isInteger(game.currentTeamIndex) ? game.currentTeamIndex : 0,
    currentWordVisible: false,
});

const normalizeText = (text) => String(text || "").trim().toLowerCase();

const scheduleAdvance = (io, roomCode) => {
    const game = roomGames.get(roomCode);
    if (!game) return;

    if (roomTimers.has(roomCode)) {
        clearTimeout(roomTimers.get(roomCode));
    }

    const timeoutId = setTimeout(() => {
        const curr = roomGames.get(roomCode);
        if (!curr) return;

        curr.groups = curr.groups.map(([score, role]) => [score, role === "Drawing" ? "Guessing" : "Drawing"]);
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
        socket.emit("room:snapshot", buildRoomSnapshot(roomCode, resolvedSessionId));

        if (room.game?.phase && room.game.phase !== "lobby") {
            socket.emit("game:state", room.game);
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
        socket.emit("room:snapshot", buildRoomSnapshot(roomCode, resolvedSessionId));

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

        const all = Allgroups({ roomCode });
        io.to(roomCode).emit("getAllGroup", { success: true, groups: all.groups });
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

    socket.on("game:start", ({ roomCode, wordPool, turnMs, groups }) => {
        if (!roomCode || !Array.isArray(wordPool) || wordPool.length === 0) {
            return;
        }

        const normalizedTurnMs = Number(turnMs);
        const safeTurnMs = Number.isFinite(normalizedTurnMs) && normalizedTurnMs > 1000 ? normalizedTurnMs : 60000;

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
        };

        game.currentWord = pickWord(game);
        game.turnsEndAt = Date.now() + game.turnMs;
        game.phase = "playing";
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

    socket.on("game:submit-guess", ({ roomCode, guess, groupIndex }) => {
        if (!roomCode) return;

        const game = roomGames.get(roomCode);
        if (!game) return;

        const idx = Number(groupIndex);
        if (!Number.isInteger(idx) || idx < 0 || idx > 1) return;

        const isCorrect = normalizeText(guess) === normalizeText(game.currentWord);
        const canScore = game.groups?.[idx]?.[1] === "Guessing";

        if (!isCorrect || !canScore) {
            socket.emit("game:guess-result", { correct: false });
            return;
        }

        game.groups[idx][0] += 30;
        game.groups = game.groups.map(([score, role]) => [score, role === "Drawing" ? "Guessing" : "Drawing"]);
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

        socket.data.sessionId = resolvedSessionId;
        socket.data.roomCode = resolvedRoomCode;

        socket.join(resolvedRoomCode);

        socket.emit("room:snapshot", buildRoomSnapshot(resolvedRoomCode, resolvedSessionId));

        const game = roomGames.get(resolvedRoomCode);
        if (game) {
            socket.emit("game:state", toPublicState(game));
        }
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