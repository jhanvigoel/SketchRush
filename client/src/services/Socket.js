import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

let isConnected = false;

socket.on("connect", () => {
  console.log("✅ Socket Connected - ID:", socket.id);
  isConnected = true;
});

socket.on("disconnect", () => {
  console.log("❌ Socket Disconnected - ID was:", socket.id);
  isConnected = false;
});

socket.on("connect_error", (error) => {
  console.log("⚠️ Connection Error:", error);
});

const ensureConnected = () => {
  return new Promise((resolve) => {
    if (isConnected) {
      resolve();
    } else {
      socket.once("connect", resolve);
    }
  });
};

export const createRoom = async ({roomCode,userName}) => {
  await ensureConnected();
  console.log("📤 Creating room with socket ID:", socket.id);
  socket.emit("Create Room", roomCode,userName);
}

export const JoinRoom = async ({roomCode,userName}) => {
  await ensureConnected();
  console.log("📤 Joining room with socket ID:", socket.id);
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

export const callAllGroup = async ({roomCode}) => {
  await ensureConnected();
  socket.emit("callAllGroup",roomCode);
}

export const getAllgroup = (callback) => {
  socket.on("getAllGroup",callback);
}

export const createGroup = async ({roomCode,userName,groupName}) => {
  await ensureConnected();
  console.log("📤 Creating group with socket ID:", socket.id);
  socket.emit("createGroup",roomCode,userName,groupName);
}

export const joinGroup = async ({roomCode,userName,groupName}) => {
  await ensureConnected();
  console.log("📤 Joining group with socket ID:", socket.id);
  console.log("📍 Details:", {roomCode, userName, groupName, socketId: socket.id});
  socket.emit("joinGroup",roomCode,userName,groupName);
}

export const onGroupCreated = (callback) => {
  console.log("📤 Getting create group with socket ID:", socket.id);
  socket.on("groupCreated",callback);
}

export const onGroupJoined = (callback) => {
  console.log("📤 Getting join group with socket ID:", socket.id);
  socket.on("groupJoined",callback);
}

export const onGroupCreateError = (callback) => {
  console.log("📤 Getting create group error with socket ID:", socket.id);
  
  socket.on("GroupCreateerror",callback);
}

export const onGroupJoinError = (callback) => {
  console.log("📤 Getting join group error with socket ID:", socket.id);
  socket.on("GroupJoinerror",callback);
}

export const groupCreateMessage = (callback) => {
  console.log("📤 Creating group mesage with socket ID:", socket.id);
  socket.on("Group Created",callback);
}

export const groupJoinMessage = (callback) => {
  console.log("📤 Getting group join message with socket ID:", socket.id);
  socket.on("User Joined Group",callback);
}

export default socket;
