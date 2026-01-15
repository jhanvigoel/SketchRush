import e from "express";
import { createRoom, joinRoom } from "../services/roomService.js";
import { Allgroups, createGroup, joinGroup } from "../services/groupService.js";

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
        socket.to(roomCode).emit(userName, "Joined");
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
        }

        socket.join(result.groupId);
        socket.to(roomCode).emit("Group Created");
        socket.emit("groupCreated",{success: true,groupId : result.groupId});

    })

    socket.on("joinGroup",(roomCode,userName,groupName) => {

        const result = joinGroup({roomCode,userName,groupName,userId:socket.id});
        
        if (!result.success){
            socket.emit("GroupJoinerror",result.error);
        }

        socket.join(result.groupId);
        socket.to(result.groupId).emit("User Joined Group",{message : "New user Joined"});
        socket.emit("groupJoined",{success: true,groupId : result.groupId});
    })
}