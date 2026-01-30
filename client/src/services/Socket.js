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

export const callAllGroup = ({roomCode}) => {

  socket.emit("callAllGroup",roomCode);

}

export const getAllgroup = (callback) => {

  socket.on("getAllGroup",callback);

}

export const createGroup = ({roomCode,userName,groupName}) => {

  socket.emit("createGroup",roomCode,userName,groupName);

}

export const joinGroup = ({roomCode,userName,groupName}) => {
  
  console.log("Emitting joinGroup:", {roomCode,userName,groupName});
  socket.emit("joinGroup",roomCode,userName,groupName);

}

export const onGroupCreated = (callback) => {

  socket.on("groupCreated",callback);

}

export const onGroupJoined = (callback) => {

  socket.on("groupJoined",callback);

}

export const onGroupCreateError = (callback) => {

  socket.on("GroupCreateerror",callback);

}

export const onGroupJoinError = (callback) => {

  socket.on("GroupJoinerror",callback);

}

export const groupCreateMessage = (callback) => {

  socket.on("Group Created",callback);

}

export const groupJoinMessage = (callback) => {

  socket.on("User Joined Group",callback);
  
}
export default socket;
