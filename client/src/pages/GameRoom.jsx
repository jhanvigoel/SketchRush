import React, { useEffect, useState } from 'react'
import Canvas from '../components/Canvas'
import TeamPlayers from '../components/TeamPlayers'
import { callAllGroup, getAllgroup, groupCreateMessage, groupJoinMessage } from '../services/Socket'
import { useSocket } from '../context/SocketContext'
import { useLocation } from 'react-router-dom'
import RoomNavbar from '../components/RoomNavbar'
import WordBox from '../components/WordBox'
import GuessPanel from '../components/GuessPanel'

const GameRoom = () => {

  const { state, dispatch } = useSocket();
  const { socket, groups, groupName, userName , roomCode } = state;
  const location = useLocation();
  const roomName = location.state?.roomName;

  useEffect(() => {

    const handleJoinMessage = (data) => {
      
      alert(`User ${data.userName} joined Group ${data.groupName}`);

      callAllGroup({roomCode});

      getAllgroup((data) => {

        dispatch({type : "SET_GROUPS",payload : data.groups});

      })
      
    };

    const handleCreateMessage = (data) => {

      alert(`User ${data.userName} created Group ${data.groupName}`);

    };

    groupJoinMessage(handleJoinMessage);
    groupCreateMessage(handleCreateMessage);

    callAllGroup({roomCode});

    getAllgroup((data) => {

      dispatch({type : "SET_GROUPS",payload : data.groups});
        
    })

    return () => {
     
      socket.off("User Joined Group", handleJoinMessage);
      socket.off("Group Created", handleCreateMessage);

    };

  }, [socket, dispatch]); 

  const team1 = groups[0] || { name: "Team1", users: [] };
  const team2 = groups[1] || { name: "Team2", users: [] };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6">

      <div className = "mx-auto max-w-10xl">

        <RoomNavbar RoomName={roomCode}/>
        

          <div className = "mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_260px]">
            <TeamPlayers teamName={team1.name} players={team1.users} index = "0"/>

            <div className = "space-y-6">
              <WordBox />

              <div className="rounded-2xl bg-white p-5 shadow-lg">
              <div className="h-[360px] w-full rounded-xl border border-slate-200">
                <Canvas />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold">Clear</button>
                <button className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold">Undo</button>
              </div>
            </div>
            
            </div>

            <div className = "space-y-6">

              <GuessPanel />
              <TeamPlayers teamName = {team2.name} players = {team2.users} index = "1" />
            </div>

          </div>

        
        

      </div>

    </div>
  );
};


export default GameRoom