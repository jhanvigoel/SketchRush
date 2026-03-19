import React, { useEffect } from 'react'
import Canvas from '../components/Canvas'
import TeamPlayers from '../components/TeamPlayers'
import { callAllGroup, getAllgroup, groupCreateMessage, groupJoinMessage, offAllgroup } from '../services/Socket'
import { useSocket } from '../context/SocketContext'
import { useLocation } from 'react-router-dom'
import RoomNavbar from '../components/RoomNavbar'
import WordBox from '../components/WordBox'
import GuessPanel from '../components/GuessPanel'
import { useGroupContext } from '../context/GroupContext'

const GameRoom = () => {

  const { state, dispatch } = useSocket();
  const { socket, groups, groupName, userName, roomCode, groupIndex } = state;
  const location = useLocation();
  const roomName = location.state?.roomName;
  const groupsRoomCode = groups?.[0]?.roomCode || groups?.[1]?.roomCode || "";
  const effectiveRoomCode = roomCode || roomName || groupsRoomCode || "";
  const { state: groupState, startTurn } = useGroupContext();
  const gameStarted = groupState.turnsEndAt > Date.now();

  const handleStartGame = () => {
    if (!effectiveRoomCode) {
      alert("Room is not ready yet. Please wait a second and try again.");
      return;
    }

    const result = startTurn(effectiveRoomCode);
    if (!result?.ok) {
      alert(result?.reason || "Could not start game");
    }
  };

  useEffect(() => {
    if (!roomCode && roomName) {
      dispatch({ type: "SET_ROOM", payload: roomName });
    }
  }, [roomCode, roomName, dispatch]);

  useEffect(() => {
    if (!userName || !Array.isArray(groups) || groups.length === 0) return;

    const idx = groups.findIndex((g) => (g.users || []).some((u) => u.name === userName));
    if (idx >= 0 && String(idx) !== String(groupIndex)) {
      dispatch({ type: "SET_GROUP_INDEX", payload: String(idx) });
    }
  }, [groups, userName, groupIndex, dispatch]);

  useEffect(() => {
    if (!effectiveRoomCode) return;

    const handleAllGroups = (data) => {
      dispatch({type : "SET_GROUPS", payload : data.groups || []});
    };

    const handleJoinMessage = (data) => {
      
      alert(`User ${data.userName} joined Group ${data.groupName}`);

      callAllGroup({roomCode: effectiveRoomCode});
      
    };

    const handleCreateMessage = (data) => {

      alert(`User ${data.userName} created Group ${data.groupName}`);
      callAllGroup({roomCode: effectiveRoomCode});

    };

    groupJoinMessage(handleJoinMessage);
    groupCreateMessage(handleCreateMessage);
    getAllgroup(handleAllGroups);

    callAllGroup({roomCode: effectiveRoomCode});

    return () => {
     
      socket.off("User Joined Group", handleJoinMessage);
      socket.off("Group Created", handleCreateMessage);
      offAllgroup(handleAllGroups);

    };

  }, [socket, dispatch, effectiveRoomCode]); 

  const team1 = groups[0] || { name: "Team1", users: [] };
  const team2 = groups[1] || { name: "Team2", users: [] };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6">

      <div className = "mx-auto max-w-10xl">

        <RoomNavbar RoomName={effectiveRoomCode}/>
        

          <div className = "mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_260px]">
            <TeamPlayers teamName={team1.name} players={team1.users} index = "0"/>

            <div className = "space-y-6">
              <WordBox />

              <div className="rounded-2xl bg-white p-5 shadow-lg">
              <div className="relative h-[360px] w-full rounded-xl border border-slate-200">
                <Canvas />
                {!gameStarted && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-indigo-600/90 backdrop-blur-sm">
                    <div className="text-2xl font-extrabold text-white mb-2">Ready to Play?</div>
                    <p className="text-indigo-100 text-sm mb-6">Click below to kick off the first round!</p>
                    <button
                      type="button"
                      onClick={handleStartGame}
                      className="rounded-xl bg-white px-10 py-3 text-indigo-600 font-extrabold text-lg shadow-lg hover:bg-indigo-50 active:scale-95 transition-all"
                    >
                      Start Game
                    </button>
                  </div>
                )}
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