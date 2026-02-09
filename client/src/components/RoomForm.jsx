import React, { useEffect, useRef, useState } from 'react'
import { callAllGroup, createGroup, createRoom, getAllgroup, joinGroup, JoinRoom, onGroupCreated, onGroupCreateError, onGroupJoined, onGroupJoinError, onRoomCreated, onRoomCreationError, onRoomJoined, onRoomJoinError } from '../services/Socket';
import { useLocation, useNavigate } from 'react-router-dom';
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

      callAllGroup({roomCode : data.roomCode});

       getAllgroup((groupData) => {
        
        dispatch({type: "SET_GROUPS", payload: groupData.groups || []});
       
      });
      
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
      
      dispatch({type: "SET_GROUP_NAME", payload: groupName});
      
      socket.off("groupCreated",handleGroupCreate);
      socket.off("GroupCreateerror",handleGroupCreateError);
      
      hasNavigatedToGameRef.current = true;
      navigate('/GameRoom', { replace: true, state: { roomName: currRoom } });
    }

    onGroupCreated(handleGroupCreate);

    const handleGroupJoined = (data) => {
      
      if (hasNavigatedToGameRef.current) return;
      
      console.log("Group joined, navigating to GameRoom");

      dispatch({type: "SET_GROUP_NAME", payload: data.groupName || groupName});

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

  },[socket,userName,groupName,currRoom,allGroup])

  if (hasNavigatedToGameRef.current) {
    return null;
  }

  return (
    <div>

      <div className = "mt-28 flex flex-col justify-center items-center">

        <div className = "px-5 py-5 rounded-lg border border-black">

          <form className="flex flex-col gap-4">

              {status && (
                <div className={`font-bold text-lg ${(typeof status === "string" && (status.includes("error") || status.includes("already") || status.includes("doesn't"))) ? "text-red-600" : "text-green-600"}`}>
                  {status}
                </div>
              )}

              <input type = "text" value = {userName} placeholder='Enter UserName' onChange = {(e) => dispatch({type: "SET_USER", payload: e.target.value})}/>

              <button className = "text-3xl" type = "button" onClick = {() => {setExistingRoom(true) ; setRoom(false)}}>Join Existing Room</button>

              <button className = "text-3xl" type = "button" onClick={() => {setRoom(true) ; setExistingRoom(false)}}>Create New Room</button>

              {room && 
                <div>
                  <input type = "text" value = {roomName} placeholder = "Enter roomName" onChange = {(e) => setRoomName(e.target.value)} />

                  <button type = "button" onClick = {createNewRoom}>Create Room</button> 

                </div>
              }

              {existingRoom && 
                <div>
                  <input type = "text" value = {code} placeholder='Enter Room Code' onChange = {(e) => setCode(e.target.value)}/>

                  <button type = "button" onClick = {JoinExistingRoom}>Join Room</button>

                </div>
              }

              {group && 
                <div>
 
                  <input type = "text" value = {groupName} placeholder = "Enter GroupName" onChange = {(e) => dispatch({type: "SET_GROUP_NAME", payload: e.target.value})} />

                  <button type = "button" onClick = {createNewGroup}>Create Group</button>

                  <div className = "text-3xl">All the groups currently in the room</div>

                  {allGroup.length == 0 && <div className = "text-2xl"> No group in the room </div>}

                  {allGroup.length != 0 && 
                    <div>
                      {allGroup.map((group) => (

                        <div key = {`${group.roomCode}-${group.name}`} className = "border p-2 mb-2"> 
                          <p className = "font-bold">{group.name}</p>
                          <p>Users : {group.users.length}</p>

                          {group.users && group.users.length > 0 && (
                            <ul className="list-disc ml-4">
                              {group.users.map((user, idx) => (
                                <li key={user.id || idx}>{user.name}</li>   
                              ))}
                            </ul>
                          )}

                          <button type = "button" onClick = {() => handleGroupJoin(group.name)}>Join this Group</button>

                        </div>
                      ))}
                     </div>
                  }
                  
                </div>
              }
          </form>
        </div>
        
        </div>
    </div>
  )
}

export default RoomForm