import React, { useEffect, useRef, useState } from 'react'
import { callAllGroup, createGroup, createRoom, getAllgroup, joinGroup, JoinRoom, offAllgroup, onGroupCreated, onGroupCreateError, onGroupJoined, onGroupJoinError, onRoomCreated, onRoomCreationError, onRoomJoined, onRoomJoinError } from '../services/Socket';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const RoomForm = () => {

  const {state, dispatch} = useSocket();
  const {socket, userName, roomCode: currRoom, groupName, groups: allGroup} = state;

  const [code,setCode] = useState("");
  const [room,setRoom] = useState(false);
  const [roomName,setRoomName] = useState("");
  const [existingRoom,setExistingRoom] = useState(false);
  const [status,setStatus] = useState("");
  const [group,setGroup] = useState(false);
  const hasNavigatedToGameRef = useRef(false);

  const navigate = useNavigate();

  const fetchGroupsAndResolveIndex = (roomCode, targetGroupName, fallbackIndex = 0) => {
    if (!roomCode) {
      dispatch({ type: "SET_GROUP_INDEX", payload: String(fallbackIndex) });
      return;
    }

    const handleGroups = (groupData) => {
      offAllgroup(handleGroups);

      const groups = groupData?.groups || [];
      dispatch({ type: "SET_GROUPS", payload: groups });

      let idx = groups.findIndex((g) => (g.users || []).some((u) => u.id === socket.id));
      if (idx < 0) {
        idx = groups.findIndex((g) => g.name === targetGroupName);
      }
      if (idx < 0) {
        idx = groups.findIndex((g) => (g.users || []).some((u) => u.name === userName));
      }
      if (idx < 0) idx = fallbackIndex;

      dispatch({ type: "SET_GROUP_INDEX", payload: String(idx) });
    };

    getAllgroup(handleGroups);
    callAllGroup({ roomCode });
  };

  const createNewRoom = async (e) => {

    e.preventDefault();
    await createRoom({roomCode: roomName, userName});
    setRoom(false);

  };

  const JoinExistingRoom = async (e) => {

    e.preventDefault();
    await JoinRoom({roomCode: code, userName});
    setExistingRoom(false);

  }

  const createNewGroup = async (e) => {

    e.preventDefault();
  
    await createGroup({roomCode: currRoom,groupName,userName});

  }

  const handleGroupJoin = async (name) => {

    console.log("Joining group:", name, "in room:", currRoom, "as user:", userName);
    await joinGroup({roomCode : currRoom,groupName: name,userName});

  }


  useEffect(() => {

    if (hasNavigatedToGameRef.current) return; 

    const handleRoomCreated = (data) => {

      if (hasNavigatedToGameRef.current) return;
      
      setStatus("Room created successfully!");
      setGroup(true);

      dispatch({type: "SET_USER", payload: userName});
      dispatch({type: "SET_ROOM", payload: data.roomCode});

      socket.off("roomCreated",handleRoomCreated);
      socket.off("Room error",handleRoomCreateError);
    }

    onRoomCreated(handleRoomCreated);

    const handleRoomJoin = (data) => {

      if (hasNavigatedToGameRef.current) return;
      
      setStatus("Room joined successfully!");
      setGroup(true);

      dispatch({type: "SET_USER", payload: userName});
      dispatch({type: "SET_ROOM", payload: data.roomCode});

      socket.off("RoomJoined",handleRoomJoin);

      socket.off("Join error", handleRoomJoinError);

      fetchGroupsAndResolveIndex(data.roomCode, groupName, 0);
      
    }

    onRoomJoined(handleRoomJoin);
    
    const handleRoomCreateError = (data) => {

      setStatus(data);
      console.log("Room creation error",data);

    }

    onRoomCreationError(handleRoomCreateError);

    const handleRoomJoinError = (data) => {
      setStatus(data);
      console.log("Room join error", data);
    }

    onRoomJoinError(handleRoomJoinError);

    const handleGroupCreate = (data) => {

      if (hasNavigatedToGameRef.current) return;
      
      console.log("Group created, navigating to GameRoom");
      setStatus("Group Created Successfully");
      
      const resolvedGroupName = data.groupName || groupName;
      dispatch({type: "SET_GROUP_NAME", payload: resolvedGroupName});
      fetchGroupsAndResolveIndex(currRoom, resolvedGroupName, 0);
      
      socket.off("groupCreated",handleGroupCreate);
      socket.off("GroupCreateerror",handleGroupCreateError);
      
      hasNavigatedToGameRef.current = true;
      navigate('/GameRoom', { replace: true, state: { roomName: currRoom } });
    }

    onGroupCreated(handleGroupCreate);

    const handleGroupJoined = (data) => {
      
      if (hasNavigatedToGameRef.current) return;
      
      console.log("Group joined, navigating to GameRoom");

      const resolvedGroupName = data.groupName || groupName;
      dispatch({type: "SET_GROUP_NAME", payload: resolvedGroupName});
      fetchGroupsAndResolveIndex(currRoom, resolvedGroupName, 1);

      socket.off("groupJoined",handleGroupJoined);
      socket.off("GroupJoinerror",handleGroupJoinError);
      
      hasNavigatedToGameRef.current = true;
      navigate('/GameRoom', { replace: true, state: { roomName: currRoom } });
    }

    onGroupJoined(handleGroupJoined);

    const handleGroupCreateError = (data) => {
      setStatus(data);
      console.log("Group create error", data);
    }

    onGroupCreateError(handleGroupCreateError);

    const handleGroupJoinError = (errorMessage) => {
      console.log("Group join error received:", errorMessage);
      setStatus(errorMessage);
    }

    onGroupJoinError(handleGroupJoinError);

    return () => {

      socket.off("roomCreated", handleRoomCreated);
      socket.off("RoomJoined", handleRoomJoin);
      socket.off("Room error", handleRoomCreateError);
      socket.off("Join error", handleRoomJoinError);
      socket.off("groupCreated", handleGroupCreate);
      socket.off("groupJoined", handleGroupJoined);
      socket.off("GroupCreateerror", handleGroupCreateError);
      socket.off("GroupJoinerror", handleGroupJoinError);
    }

  },[socket,userName,groupName,currRoom,dispatch,navigate])

  if (hasNavigatedToGameRef.current) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Join Sketch Rush</h2>
          <p className="mt-1 text-sm text-slate-600">Create a room, join one, and pick your team.</p>
        </div>

        <form className="space-y-4">
          {status && (
            <div className={`rounded-lg border px-3 py-2 text-sm font-semibold ${(typeof status === "string" && (status.includes("error") || status.includes("already") || status.includes("doesn't"))) ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {status}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Username</label>
            <input
              type="text"
              value={userName}
              placeholder="Enter username"
              onChange={(e) => dispatch({type: "SET_USER", payload: e.target.value})}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              type="button"
              onClick={() => {setExistingRoom(true); setRoom(false)}}
            >
              Join Existing Room
            </button>

            <button
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              type="button"
              onClick={() => {setRoom(true); setExistingRoom(false)}}
            >
              Create New Room
            </button>
          </div>

          {room && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={roomName}
                  placeholder="Enter room name"
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={createNewRoom}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Create Room
                </button>
              </div>
            </div>
          )}

          {existingRoom && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={code}
                  placeholder="Enter room code"
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={JoinExistingRoom}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Join Room
                </button>
              </div>
            </div>
          )}

          {group && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="text"
                  value={groupName}
                  placeholder="Enter group name"
                  onChange={(e) => dispatch({type: "SET_GROUP_NAME", payload: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={createNewGroup}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Create Group
                </button>
              </div>

              <div>
                <div className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-600">Groups in Room</div>

                {allGroup.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-sm text-slate-500">
                    No groups in this room yet.
                  </div>
                )}

                {allGroup.length !== 0 && (
                  <div className="space-y-2">
                    {allGroup.map((group) => (
                      <div key={`${group.roomCode}-${group.name}`} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-base font-bold text-slate-800">{group.name}</p>
                            <p className="text-xs text-slate-500">Users: {group.users.length}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleGroupJoin(group.name)}
                            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                          >
                            Join Group
                          </button>
                        </div>

                        {group.users && group.users.length > 0 && (
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {group.users.map((user, idx) => (
                              <li key={user.id || idx} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                {user.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default RoomForm