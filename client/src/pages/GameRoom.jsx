import React, { useEffect } from 'react'
import Canvas from '../components/Canvas'
import TeamPlayers from '../components/TeamPlayers'
import { useSocket } from '../context/SocketContext'
import { useLocation } from 'react-router-dom'
import RoomNavbar from '../components/RoomNavbar'
import WordBox from '../components/WordBox'
import GuessPanel from '../components/GuessPanel'
import GameResultModal from '../components/GameResultModal'
import { useGroupContext } from '../context/GroupContext'
import { emitGameRematch, emitRoomSnapshotRequest } from '../services/Socket'

const GameRoom = () => {

  const { state, dispatch } = useSocket();
  const { socket, groups, groupName, userName, roomCode, groupIndex } = state;
  const location = useLocation();
  const roomName = location.state?.roomName;
  const groupsRoomCode = groups?.[0]?.roomCode || groups?.[1]?.roomCode || "";
  const effectiveRoomCode = roomCode || roomName || groupsRoomCode || "";
  const { state: groupState, startTurn } = useGroupContext();
  const gameStarted = groupState.turnsEndAt > Date.now();
  const gameFinished = groupState.phase === 'finished' || Boolean(groupState.winner);

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

  const handleRematch = () => {
    if (!effectiveRoomCode) return;
    emitGameRematch({ roomCode: effectiveRoomCode });
  };

  useEffect(() => {
    if (!roomCode && roomName) {
      dispatch({ type: "SET_ROOM", payload: roomName });
    }
  }, [roomCode, roomName, dispatch]);

  useEffect(() => {
    if (effectiveRoomCode) {
      emitRoomSnapshotRequest({ roomCode: effectiveRoomCode });
    }
  }, [effectiveRoomCode]);

  useEffect(() => {
    if (!userName || !Array.isArray(groups) || groups.length === 0) return;

    const idx = groups.findIndex((g) =>
      (g.users || g.players || []).some((u) => u.id === state.sessionId || u.name === userName)
    );
    if (idx >= 0 && String(idx) !== String(groupIndex)) {
      dispatch({ type: "SET_GROUP_INDEX", payload: String(idx) });
    }
  }, [groups, userName, state.sessionId, groupIndex, dispatch]);

  useEffect(() => {
    const handleSnapshot = (data) => {
      if (!data.ok) return;

      const nextTeams = Array.isArray(data.teams) ? data.teams : [];
      dispatch({ type: "SET_GROUPS", payload: nextTeams });
      dispatch({ type: "SET_ROOM", payload: data.roomCode });

      if (data.yourTeamIndex !== undefined && data.yourTeamIndex !== null && Number(data.yourTeamIndex) >= 0) {
        dispatch({ type: "SET_GROUP_INDEX", payload: String(data.yourTeamIndex) });
      }

      if (data.yourGroupName) {
        dispatch({ type: "SET_GROUP_NAME", payload: data.yourGroupName });
      }
    };

    socket.on("room:snapshot", handleSnapshot);
    return () => socket.off("room:snapshot", handleSnapshot);
  }, [socket, dispatch]);

  const team1 = groups[0] || { name: "Team1", users: [], score: 0 };
  const team2 = groups[1] || { name: "Team2", users: [], score: 0 };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6">

      <div className = "mx-auto max-w-10xl">

        <RoomNavbar RoomName={effectiveRoomCode}/>
        

          <div className = "mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_260px]">
            <TeamPlayers team={team1} index = "0"/>

            <div className = "space-y-6">
              <WordBox />

              <div className="rounded-2xl bg-white p-5 shadow-lg">
              <div className="relative w-full rounded-xl">
                <Canvas />
                {gameFinished && (
                  <GameResultModal winner={groupState.winner} onRematch={handleRematch} />
                )}
                {!gameStarted && !gameFinished && (
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
            </div>
            
            </div>

            <div className = "space-y-6">

              <GuessPanel />
              <TeamPlayers team = {team2} index = "1" />
            </div>

          </div>

        
        

      </div>

    </div>
  );
};


export default GameRoom