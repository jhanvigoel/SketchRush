import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

export const createRoom = ({roomCode,userName}) => {

  socket.emit("Create Room", roomCode,userName);

}

export const JoinRoom = ({roomCode,userName}) => {

  socket.emit("Join Room",roomCode,userName);

}

export const onRoomCreated = (callback) => {
  socket.on("roomCreated",callback);
}

export const onRoomJoined = (callback) => {
  socket.on("RoomJoined",callback);
}

export const onRoomCreationError = (callback) => {
  socket.on("Room error",callback);
}

export const onRoomJoinError = (callback) => {
  socket.on("Join error",callback);
}

export default socket;
