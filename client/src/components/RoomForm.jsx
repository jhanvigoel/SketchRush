import React, { useEffect, useRef, useState } from 'react';
import {
  callAllGroup,
  createGroup,
  createRoom,
  getAllgroup,
  joinGroup,
  JoinRoom,
  offAllgroup,
  onGroupCreated,
  onGroupCreateError,
  onGroupJoined,
  onGroupJoinError,
  onRoomCreated,
  onRoomCreationError,
  onRoomJoined,
  onRoomJoinError
} from '../services/Socket';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import {
  Sparkles,
  Zap,
  Users,
  Pencil,
  ArrowRight,
  Palette,
  Clock,
  Trophy,
  Copy,
  Check,
  Plus,
  ArrowLeft
} from 'lucide-react';

const RoomForm = () => {
  const { state, dispatch } = useSocket();
  const { socket, sessionId, userName, roomCode: currRoom, groups: allGroup } = state;

  // Step state: false = Step 1 (Room creation/joining), true = Step 2 (Group selection/creation)
  const [inRoom, setInRoom] = useState(false);
  const [mode, setMode] = useState('join'); // 'join' or 'create'
  const [code, setCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasNavigatedToGameRef = useRef(false);

  const navigate = useNavigate();

  const fetchGroupsAndResolveIndex = (roomCode, targetGroupName, fallbackIndex = 0) => {
    if (!roomCode) {
      dispatch({ type: 'SET_GROUP_INDEX', payload: String(fallbackIndex) });
      return;
    }

    const handleGroups = (groupData) => {
      offAllgroup(handleGroups);

      const groups = groupData?.groups || [];
      dispatch({ type: 'SET_GROUPS', payload: groups });

      let idx = groups.findIndex((g) => (g.users || []).some((u) => u.id === sessionId));
      if (idx < 0) {
        idx = groups.findIndex((g) => g.name === targetGroupName);
      }
      if (idx < 0) {
        idx = groups.findIndex((g) => (g.users || []).some((u) => u.name === userName));
      }
      if (idx < 0) idx = fallbackIndex;

      dispatch({ type: 'SET_GROUP_INDEX', payload: String(idx) });
    };

    getAllgroup(handleGroups);
    callAllGroup({ roomCode });
  };

  // Step 1 Submission: Create or Join Room
  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    setStatus('');

    const trimmedUser = (userName || '').trim();
    if (!trimmedUser) {
      setStatus('Please enter your username');
      return;
    }

    dispatch({ type: 'SET_USER', payload: trimmedUser });
    setIsLoading(true);

    if (mode === 'create') {
      const trimmedRoom = (roomName || '').trim();
      if (!trimmedRoom) {
        setStatus('Please enter a room name');
        setIsLoading(false);
        return;
      }
      await createRoom({ roomCode: trimmedRoom, userName: trimmedUser, sessionId });
    } else {
      const trimmedCode = (code || '').trim();
      if (!trimmedCode) {
        setStatus('Please enter a room code');
        setIsLoading(false);
        return;
      }
      await JoinRoom({ roomCode: trimmedCode, userName: trimmedUser, sessionId });
    }
  };

  // Step 2 Action: Create New Group
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setStatus('');

    const trimmedGroupName = newGroupName.trim();
    if (!trimmedGroupName) {
      setStatus('Please enter a team name');
      return;
    }

    const activeRoom = currRoom || roomName || code;
    setIsLoading(true);
    await createGroup({
      roomCode: activeRoom,
      groupName: trimmedGroupName,
      userName: (userName || '').trim(),
      sessionId
    });
  };

  // Step 2 Action: Join Existing Group
  const handleJoinExistingGroup = async (targetGroupName) => {
    setStatus('');
    const activeRoom = currRoom || roomName || code;
    setIsLoading(true);
    await joinGroup({
      roomCode: activeRoom,
      groupName: targetGroupName,
      userName: (userName || '').trim(),
      sessionId
    });
  };

  const handleCopyCode = () => {
    const activeRoom = currRoom || roomName || code;
    if (activeRoom) {
      navigator.clipboard.writeText(activeRoom);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (hasNavigatedToGameRef.current) return;

    // Real-time listener for group list in room
    const handleGroupsUpdate = (data) => {
      if (data?.success && Array.isArray(data.groups)) {
        dispatch({ type: 'SET_GROUPS', payload: data.groups });
      }
    };
    getAllgroup(handleGroupsUpdate);

    const handleRoomCreated = (data) => {
      if (hasNavigatedToGameRef.current) return;

      setStatus('Room created! Now create or choose your team.');
      setIsLoading(false);
      setInRoom(true);

      dispatch({ type: 'SET_USER', payload: userName });
      dispatch({ type: 'SET_ROOM', payload: data.roomCode });

      callAllGroup({ roomCode: data.roomCode });
    };

    const handleRoomJoin = (data) => {
      if (hasNavigatedToGameRef.current) return;

      setStatus('Room joined! Now choose your team.');
      setIsLoading(false);
      setInRoom(true);

      dispatch({ type: 'SET_USER', payload: userName });
      dispatch({ type: 'SET_ROOM', payload: data.roomCode });

      callAllGroup({ roomCode: data.roomCode });
    };

    const handleRoomCreateError = (data) => {
      setIsLoading(false);
      setStatus(typeof data === 'string' ? data : 'Error creating room');
    };

    const handleRoomJoinError = (data) => {
      setIsLoading(false);
      setStatus(typeof data === 'string' ? data : 'Error joining room');
    };

    const handleGroupCreate = (data) => {
      if (hasNavigatedToGameRef.current) return;

      setStatus('Team created! Entering game arena...');
      const resolvedGroupName = data.groupName || newGroupName;
      dispatch({ type: 'SET_GROUP_NAME', payload: resolvedGroupName });

      const targetRoom = currRoom || data.roomCode || roomName || code;
      fetchGroupsAndResolveIndex(targetRoom, resolvedGroupName, 0);

      hasNavigatedToGameRef.current = true;
      setIsLoading(false);
      navigate('/GameRoom', { replace: true, state: { roomName: targetRoom } });
    };

    const handleGroupJoined = (data) => {
      if (hasNavigatedToGameRef.current) return;

      setStatus('Joined team! Entering game arena...');
      const resolvedGroupName = data.groupName || newGroupName;
      dispatch({ type: 'SET_GROUP_NAME', payload: resolvedGroupName });

      const targetRoom = currRoom || data.roomCode || roomName || code;
      fetchGroupsAndResolveIndex(targetRoom, resolvedGroupName, 1);

      hasNavigatedToGameRef.current = true;
      setIsLoading(false);
      navigate('/GameRoom', { replace: true, state: { roomName: targetRoom } });
    };

    const handleGroupCreateError = (data) => {
      setIsLoading(false);
      setStatus(typeof data === 'string' ? data : 'Group creation error');
    };

    const handleGroupJoinError = (errorMessage) => {
      setIsLoading(false);
      setStatus(typeof errorMessage === 'string' ? errorMessage : 'Group join error');
    };

    onRoomCreated(handleRoomCreated);
    onRoomJoined(handleRoomJoin);
    onRoomCreationError(handleRoomCreateError);
    onRoomJoinError(handleRoomJoinError);
    onGroupCreated(handleGroupCreate);
    onGroupJoined(handleGroupJoined);
    onGroupCreateError(handleGroupCreateError);
    onGroupJoinError(handleGroupJoinError);

    return () => {
      socket.off('getAllGroup', handleGroupsUpdate);
      socket.off('roomCreated', handleRoomCreated);
      socket.off('RoomJoined', handleRoomJoin);
      socket.off('Room error', handleRoomCreateError);
      socket.off('Join error', handleRoomJoinError);
      socket.off('groupCreated', handleGroupCreate);
      socket.off('groupJoined', handleGroupJoined);
      socket.off('GroupCreateerror', handleGroupCreateError);
      socket.off('GroupJoinerror', handleGroupJoinError);
    };
  }, [socket, userName, newGroupName, currRoom, roomName, code, sessionId, dispatch, navigate]);

  if (hasNavigatedToGameRef.current) {
    return null;
  }

  const isError =
    typeof status === 'string' &&
    (status.toLowerCase().includes('error') ||
      status.toLowerCase().includes('already') ||
      status.toLowerCase().includes("doesn't") ||
      status.toLowerCase().includes('please'));

  const activeRoomCode = currRoom || roomName || code;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#ECE7FE] via-[#F4F2FF] to-[#E5F3FE] px-4 py-8 sm:px-8 sm:py-12 flex items-center justify-center">
      {/* Ambient Floating Doodle Icons */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Palette className="absolute left-[44%] top-[12%] h-9 w-9 text-sky-300/80 -rotate-12" />
        <Pencil className="absolute left-[8%] top-[20%] h-8 w-8 text-purple-300/70 -rotate-45" />
        <Clock className="absolute bottom-[18%] left-[5%] h-9 w-9 text-amber-300/80" />
        <Trophy className="absolute right-[8%] top-[18%] h-9 w-9 text-pink-300/80 rotate-12" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Column: Hero & Steps */}
          <div className="space-y-8">
            {/* Brand Logo Pill */}
            <div className="inline-flex items-center gap-2.5 rounded-2xl bg-white/80 px-4 py-2 shadow-sm border border-purple-100/80 backdrop-blur-md">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#7C3AED] text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-800 tracking-tight text-sm">SketchRush</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-5xl sm:text-6xl font-black text-slate-950 tracking-tight leading-[1.08]">
                Draw. Guess. <br />
                <span className="text-[#7C3AED]">Outsmart</span> <br />
                your friends.
              </h1>
              <p className="text-base sm:text-lg text-slate-500 font-medium max-w-md pt-1">
                A fast, chaotic drawing game for teams who think they can beat the clock.
              </p>
            </div>

            {/* Step Cards (01, 02, 03) */}
            <div className="space-y-3 max-w-lg pt-2">
              <div
                className={`flex items-center justify-between rounded-2xl px-5 py-4 shadow-sm border backdrop-blur-md transition-all ${
                  !inRoom
                    ? 'bg-white border-[#7C3AED]/30 ring-2 ring-purple-100'
                    : 'bg-white/80 border-purple-100/60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100/80 text-[#7C3AED]">
                    <Zap className="h-5 w-5 fill-[#7C3AED]/20" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">
                    Create or join a room
                  </span>
                </div>
                <span className="font-extrabold text-[#7C3AED] text-xs sm:text-sm tracking-wider">
                  01
                </span>
              </div>

              <div
                className={`flex items-center justify-between rounded-2xl px-5 py-4 shadow-sm border backdrop-blur-md transition-all ${
                  inRoom
                    ? 'bg-white border-[#7C3AED]/30 ring-2 ring-purple-100'
                    : 'bg-white/80 border-purple-100/60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100/80 text-[#7C3AED]">
                    <Users className="h-5 w-5 fill-[#7C3AED]/20" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">
                    Pick or create your team
                  </span>
                </div>
                <span className="font-extrabold text-slate-400 text-xs sm:text-sm tracking-wider">
                  02
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/80 px-5 py-4 shadow-sm border border-purple-100/60 backdrop-blur-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100/80 text-[#7C3AED]">
                    <Pencil className="h-5 w-5 fill-[#7C3AED]/20" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">
                    Draw before time runs out
                  </span>
                </div>
                <span className="font-extrabold text-slate-300 text-xs sm:text-sm tracking-wider">
                  03
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Game Lobby Interactive Card */}
          <div className="w-full max-w-md mx-auto">
            <div className="rounded-[32px] bg-white p-7 sm:p-9 shadow-2xl shadow-purple-500/10 border border-slate-100/80">
              {/* Header inside Card */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#7C3AED]">
                  Game Lobby
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7C3AED] text-white shadow-lg shadow-purple-400/30">
                  <Pencil className="h-4 w-4" />
                </div>
              </div>

              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {inRoom ? 'Pick Your Team' : 'Ready to play?'}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                {inRoom
                  ? `You're in room "${activeRoomCode}". Join a team to enter.`
                  : 'Enter your username and choose how to join.'}
              </p>

              {/* Status Alert */}
              {status && (
                <div
                  className={`mt-4 rounded-xl border px-3.5 py-2 text-xs font-bold ${
                    isError
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {status}
                </div>
              )}

              {/* ================= STEP 1: ROOM SETUP ================= */}
              {!inRoom ? (
                <form onSubmit={handleRoomSubmit} className="mt-5 space-y-4">
                  {/* Username Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Your username</label>
                    <input
                      type="text"
                      value={userName}
                      placeholder="e.g. doodle-master"
                      onChange={(e) => dispatch({ type: 'SET_USER', payload: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#7C3AED] focus:bg-white focus:ring-4 focus:ring-purple-100"
                    />
                  </div>

                  {/* Segmented Switcher: Join a room vs Create a room */}
                  <div className="flex rounded-2xl bg-slate-100/90 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('join');
                        setStatus('');
                      }}
                      className={`flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all ${
                        mode === 'join'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Join a room
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('create');
                        setStatus('');
                      }}
                      className={`flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all ${
                        mode === 'create'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Create a room
                    </button>
                  </div>

                  {/* Room Code or Room Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      {mode === 'join' ? 'Room code' : 'Room name'}
                    </label>
                    <input
                      type="text"
                      value={mode === 'join' ? code : roomName}
                      placeholder={mode === 'join' ? 'ENTER 6-DIGIT CODE' : 'ENTER ROOM NAME'}
                      onChange={(e) =>
                        mode === 'join' ? setCode(e.target.value) : setRoomName(e.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold tracking-wide text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#7C3AED] focus:bg-white focus:ring-4 focus:ring-purple-100"
                    />
                  </div>

                  {/* Step 1 Action Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] py-3.5 sm:py-4 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-purple-500/30 transition-all hover:bg-[#6D28D9] active:scale-[0.99] disabled:opacity-50"
                  >
                    <span>
                      {isLoading
                        ? 'Connecting...'
                        : mode === 'join'
                        ? 'Join the room'
                        : 'Create room'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                /* ================= STEP 2: GROUP SETUP (YOUR ORIGINAL FLOW) ================= */
                <div className="mt-5 space-y-5">
                  {/* Room Code Info Pill with Copy & Back Button */}
                  <div className="flex items-center justify-between rounded-2xl border border-purple-100 bg-purple-50/50 p-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setInRoom(false);
                          setStatus('');
                        }}
                        className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700 transition-all"
                        title="Change Room"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                          Room Code
                        </div>
                        <div className="text-sm font-extrabold text-slate-900">{activeRoomCode}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#7C3AED] shadow-sm transition hover:bg-purple-50 active:scale-95"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>

                  {/* Create New Group Section */}
                  <form onSubmit={handleCreateGroup} className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Create a new team</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newGroupName}
                        placeholder="e.g. Team 1 / Purple Crew"
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#7C3AED] focus:bg-white focus:ring-4 focus:ring-purple-100"
                      />
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-[#7C3AED] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-purple-500/20 transition hover:bg-[#6D28D9] active:scale-95 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create</span>
                      </button>
                    </div>
                  </form>

                  {/* Existing Teams in Room */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Teams in this room ({allGroup.length})
                    </div>

                    {allGroup.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-5 text-center text-xs font-semibold text-slate-400">
                        No teams created yet. Type a team name above to create one!
                      </div>
                    ) : (
                      <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
                        {allGroup.map((group, idx) => (
                          <div
                            key={`${group.roomCode}-${group.name}-${idx}`}
                            className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-[#7C3AED]/40"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h3 className="text-sm font-extrabold text-slate-900">{group.name}</h3>
                                <p className="text-[11px] font-semibold text-slate-400">
                                  {group.users?.length || 0} player
                                  {(group.users?.length || 0) === 1 ? '' : 's'}
                                </p>
                              </div>

                              <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => handleJoinExistingGroup(group.name)}
                                className="flex items-center gap-1 rounded-xl bg-purple-50 px-3.5 py-1.5 text-xs font-extrabold text-[#7C3AED] transition hover:bg-[#7C3AED] hover:text-white active:scale-95 disabled:opacity-50"
                              >
                                <span>Join</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Player Chips */}
                            {group.users && group.users.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {group.users.map((u, uIdx) => (
                                  <span
                                    key={u.id || uIdx}
                                    className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600"
                                  >
                                    {u.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card Footer Note */}
              <p className="mt-4 text-center text-xs font-medium text-slate-400">
                No account needed. Just bring your best doodles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomForm;