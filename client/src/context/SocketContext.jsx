import React, { useEffect } from 'react'
import { createContext } from 'react';
import socket from '../services/Socket';
import { useReducer } from 'react';
import { useMemo } from 'react';
import { useContext } from 'react';

const socketStateContext = createContext();

//if already player in the game room and got disconnected and reconnect so will
//as a same person, not as a stranger returning
const getSessionId = () => {

  const saved = localStorage.getItem("sessionId");

  if (saved) return saved;

  const next = crypto.randomUUID();

  localStorage.setItem("sessionId",next);

  return next;

}

const initialState = {

    socket,
    sessionId : getSessionId(),
    userName: "",
    roomCode: "",
    groupName: "",
    groups: [],
    groupIndex: ""
};

function reducer(state,action) {

  switch(action.type){

    case "SET_USER":
      return { ...state, userName: action.payload};
    case "SET_ROOM":
      return { ...state, roomCode: action.payload};
    case "SET_GROUP_NAME":
      return { ...state, groupName: action.payload};
    case "SET_GROUPS":
      return { ...state, groups: action.payload};
    case "SET_GROUP_INDEX":
      return {...state,groupIndex: action.payload};
    default:
      return state;
  }

}

const SocketContext = ({children}) => {

  const [state,dispatch] = useReducer(reducer,initialState);

  useEffect(() => {

    if (!state.socket || !state.sessionId) return;

    const resume = () => {

      state.socket.emit("session:resume",{
        sessionId : state.sessionId,
        userName: state.userName,
        roomCode : state.roomCode
      });

    }

    if (state.socket.connected) {
      resume();
    }

    state.socket.on("connect",resume);

    return () => {

      state.socket.off("connect",resume);

    }

  },[state.socket,state.sessionId,state.userName,state.roomCode]);


  const value = useMemo(() => ({state,dispatch}),[state]);

  return (
    <socketStateContext.Provider value = {value}>
      {children}
    </socketStateContext.Provider>
  )
}

export const useSocket = () => {

  const curr = useContext(socketStateContext);

  if (!curr){
    throw new Error("UseSocket Error");
  }

  return curr;


}

export default SocketContext;