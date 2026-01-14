import e from "express";
import { createRoom, joinRoom } from "../services/roomService.js";

export const handleConnection = (io,socket) => {

    console.log("user Connected");

    socket.on("Create Room", (roomCode,userName) => {

        const result = createRoom({roomCode,userName,userId:socket.id});

        if (!result.success){
            socket.emit("Room error",result.error);
        }

        socket.join(roomCode);
        socket.emit("roomCreated", {success: true, roomCode, message: "Room created successfully"});

    })

    socket.on("Join Room",(roomCode,userName) => {

        const result = joinRoom({roomCode,userName,userId:socket.id});

        if (!result.success){
            socket.emit("Join error",result.error);
        }

        socket.join(roomCode);
        socket.to(roomCode).emit(userName, "Joined");
        socket.emit("RoomJoined", {success: true, roomCode, message: "Joined room successfully"});

    })

}