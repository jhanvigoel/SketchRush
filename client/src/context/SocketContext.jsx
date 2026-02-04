import React from 'react'
import { createContext } from 'react';
import socket from '../services/Socket';
import { useReducer } from 'react';
import { useMemo } from 'react';
import { useContext } from 'react';

const socketStateContext = createContext();

const initialState = {

    socket,
    userName: "",
    roomCode: "",
    groupName: "",
    groups: [],
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
    default:
      return state;
  }

}

const SocketContext = ({children}) => {

  const [state,dispatch] = useReducer(reducer,initialState);

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