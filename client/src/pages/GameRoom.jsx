import React, { useEffect } from 'react';
import Canvas from '../components/Canvas';
import TeamPlayers from '../components/TeamPlayers';
import { useSocket } from '../context/SocketContext';
import { useLocation } from 'react-router-dom';
import RoomNavbar from '../components/RoomNavbar';
import WordBox from '../components/WordBox';
import GuessPanel from '../components/GuessPanel';
import { useGroupContext } from '../context/GroupContext';
import { emitGameRematch, emitRoomSnapshotRequest } from '../services/Socket';
import { Users, Lightbulb } from 'lucide-react';

const GameRoom = () => {
  const { state, dispatch } = useSocket();
  const { socket, groups, userName, roomCode, groupIndex } = state;
  const location = useLocation();
  const roomName = location.state?.roomName;
  const groupsRoomCode = groups?.[0]?.roomCode || groups?.[1]?.roomCode || '';
  const effectiveRoomCode = roomCode || roomName || groupsRoomCode || '';
  const { state: groupState, startTurn } = useGroupContext();

  const handleStartGame = () => {
    if (!effectiveRoomCode) {
      alert('Room is not ready yet. Please wait a second and try again.');
      return;
    }

    const result = startTurn(effectiveRoomCode);
    if (!result?.ok) {
      alert(result?.reason || 'Could not start game');
    }
  };

  const handleRematch = () => {
    if (!effectiveRoomCode) return;
    emitGameRematch({ roomCode: effectiveRoomCode });
  };

  useEffect(() => {
    if (!roomCode && roomName) {
      dispatch({ type: 'SET_ROOM', payload: roomName });
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
      dispatch({ type: 'SET_GROUP_INDEX', payload: String(idx) });
    }
  }, [groups, userName, state.sessionId, groupIndex, dispatch]);

  useEffect(() => {
    const handleSnapshot = (data) => {
      if (!data.ok) return;

      const nextTeams = Array.isArray(data.teams) ? data.teams : [];
      dispatch({ type: 'SET_GROUPS', payload: nextTeams });
      dispatch({ type: 'SET_ROOM', payload: data.roomCode });

      if (data.yourTeamIndex !== undefined && data.yourTeamIndex !== null && Number(data.yourTeamIndex) >= 0) {
        dispatch({ type: 'SET_GROUP_INDEX', payload: String(data.yourTeamIndex) });
      }

      if (data.yourGroupName) {
        dispatch({ type: 'SET_GROUP_NAME', payload: data.yourGroupName });
      }
    };

    socket.on('room:snapshot', handleSnapshot);
    return () => socket.off('room:snapshot', handleSnapshot);
  }, [socket, dispatch]);

  const team1 = groups[0] || { name: 'Team 1', users: [], score: 0 };
  const team2 = groups[1] || { name: 'Team 2', users: [], score: 0 };

  const currentRound = groupState.currentRound || Math.min(groupState.roundLimit || 1, (groupState.roundsPlayed || 0) + 1);
  const totalRounds = groupState.roundLimit || 5;

  return (
    <div className="min-h-screen bg-[#F6F8FC] px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Navbar */}
        <RoomNavbar RoomName={effectiveRoomCode} />

        {/* 3-Column Game Arena Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_280px]">
          {/* Left Column: Team 1 + Round Card */}
          <div className="space-y-4">
            <TeamPlayers team={team1} index="0" />

            {/* Round Status Card */}
            <div className="rounded-[28px] border border-purple-100/80 bg-purple-50/60 p-4.5 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-black text-[#7C3AED]">
                <Users className="h-4 w-4" />
                <span>Round {currentRound} of {totalRounds}</span>
              </div>
              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                Your team draws first. Communicate quickly and beat the clock.
              </p>
            </div>
          </div>

          {/* Center Column: Word Box + Canvas */}
          <div className="space-y-4">
            <WordBox />
            <Canvas onStartGame={handleStartGame} onRematch={handleRematch} />
          </div>

          {/* Right Column: Guess Panel + Team 2 + Tip Card */}
          <div className="space-y-4">
            <GuessPanel />
            <TeamPlayers team={team2} index="1" />

            {/* Tip Card */}
            <div className="rounded-[28px] border border-amber-200/60 bg-amber-50/70 p-4.5 space-y-1 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                <span>Tip</span>
              </div>
              <p className="text-xs font-medium text-amber-800/90 leading-relaxed">
                Use simple shapes first, then add details for bonus points.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;