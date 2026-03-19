import e from "express";
import { createRoom, joinRoom } from "../services/roomService.js";
import { Allgroups, createGroup, joinGroup } from "../services/groupService.js";

const roomGames = new Map();
const roomTimers = new Map();

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
    currentWord: game.currentWord,
    turnsEndAt: game.turnsEndAt,
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

        io.to(roomCode).emit("game:state", toPublicState(curr));
        scheduleAdvance(io, roomCode);
    }, game.turnMs);

    roomTimers.set(roomCode, timeoutId);
};

export const handleConnection = (io,socket) => {

    console.log("user Connected");

    socket.on("Create Room", (roomCode,userName) => {

        const result = createRoom({roomCode,userName,userId:socket.id});

        if (!result.success){
            socket.emit("Room error",result.error);
            return;
        }

        socket.join(roomCode);
        socket.emit("roomCreated", {success: true, roomCode, message: "Room created successfully"});

    })

    socket.on("Join Room",(roomCode,userName) => {

        const result = joinRoom({roomCode,userName,userId:socket.id});

        if (!result.success){
            socket.emit("Join error",result.error);
            return;
        }

        socket.join(roomCode);
        socket.emit("RoomJoined", {success: true, roomCode, message: "Joined room successfully"});

    })

    socket.on("callAllGroup",(roomCode) => {

        const result = Allgroups({roomCode});

        socket.emit("getAllGroup",{success: true,groups:result.groups});

    })

    socket.on("createGroup",(roomCode,userName,groupName) => {

        const result = createGroup({roomCode,userName,groupName,userId:socket.id});

        if (!result.success){
            socket.emit("GroupCreateerror",result.error);
            return;
        }

        socket.join(result.groupId);
        socket.to(roomCode).emit("Group Created",{message : "Group Created", userName : userName, groupName : groupName});
        socket.emit("groupCreated",{success: true,groupId : result.groupId, groupName});

        const all = Allgroups({ roomCode });
        io.to(roomCode).emit("getAllGroup", { success: true, groups: all.groups });

    })

    socket.on("joinGroup",(roomCode,userName,groupName) => {

        const result = joinGroup({roomCode,userName,groupName,userId:socket.id});
        
        if (!result.success){
            socket.emit("GroupJoinerror",result.error);
            return;
        }

        socket.join(result.groupId);
        socket.to(roomCode).emit("User Joined Group",{message : "New user Joined", userName : userName, groupName : groupName});
        socket.emit("groupJoined",{success: true,groupId : result.groupId, groupName});

        const all = Allgroups({ roomCode });
        io.to(roomCode).emit("getAllGroup", { success: true, groups: all.groups });
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
        roomGames.set(roomCode, game);

        io.to(roomCode).emit("game:state", toPublicState(game));
        scheduleAdvance(io, roomCode);
    })

    socket.on("game:request-state", ({ roomCode }) => {
        if (!roomCode) return;

        const game = roomGames.get(roomCode);
        if (!game) return;

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

        io.to(roomCode).emit("game:state", toPublicState(game));
        io.to(roomCode).emit("game:guess-result", { correct: true, teamIndex: idx });
        scheduleAdvance(io, roomCode);
    })
}