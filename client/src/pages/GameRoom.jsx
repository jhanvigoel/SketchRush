import React, { useEffect, useState } from 'react'
import Canvas from '../components/Canvas'
import TeamPlayers from '../components/TeamPlayers'
import { groupCreateMessage, groupJoinMessage } from '../services/Socket'
import { useSocket } from '../context/SocketContext'
import { useLocation } from 'react-router-dom'
import { Clock, Settings } from 'lucide-react'
import RoomSettings from '../components/RoomSettings'

const GameRoom = () => {
  const { state, dispatch } = useSocket();
  const { socket, groups, groupName, userName } = state;
  const location = useLocation();
  const roomName = location.state?.roomName;
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const handleJoinMessage = (data) => {
      
      alert(`User ${data.userName} joined Group ${data.groupName}`);
      
      
      if (data.allGroups) {
        dispatch({ type: "SET_GROUPS", payload: data.allGroups });
      }
    };

    const handleCreateMessage = (data) => {
      alert(`User ${data.userName} created Group ${data.groupName}`);
      if (data.allGroups) {
        dispatch({ type: "SET_GROUPS", payload: data.allGroups });
      }
    };

    groupJoinMessage(handleJoinMessage);
    groupCreateMessage(handleCreateMessage);

    return () => {
     
      socket.off("User Joined Group", handleJoinMessage);
      socket.off("Group Created", handleCreateMessage);
    };
  }, [socket, dispatch, groups]); 

  const team1 = groups[0] || { name: "Team1", users: [] };
  const team2 = groups[1] || { name: "Team2", users: [] };

  return (
    <div className="px-10 py-10">

      <div className = "flex flex-row justify-between">

        <Clock />

        <div className = "text-left ml-20 text-5xl font-bold ">Room Name : {roomName}</div>

        <div className="relative">
          <button type="button" onClick={() => setShowSettings((prev) => !prev)}>
            <Settings />
          </button>

          {showSettings && (
            <div className="absolute right-0 top-full mt-2 z-50 max-h-[70vh] overflow-y-auto">
              <RoomSettings />
            </div>
          )}
        </div>

      </div>

      <div className="flex flex-row justify-between">
        <TeamPlayers teamName={team1.name} players={team1.users} />
        <Canvas />
        <TeamPlayers teamName={team2.name} players={team2.users} />
      </div>

    </div>
  );
};


export default GameRoom