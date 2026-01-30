import React, { useEffect, useRef, useState } from 'react'
import socket, { callAllGroup, createGroup, createRoom, getAllgroup, joinGroup, JoinRoom, onGroupCreated, onGroupCreateError, onGroupJoined, onGroupJoinError, onRoomCreated, onRoomCreationError, onRoomJoined, onRoomJoinError } from '../services/Socket';
import { useNavigate } from 'react-router-dom';

const RoomForm = () => {

  const [userName,setUserName] = useState("");
  const [code,setCode] = useState("");
  const [room,setRoom] = useState(false);
  const [roomName,setRoomName] = useState("");
  const [existingRoom,setExistingRoom] = useState(false);
  const [status,setStatus] = useState("");
  const [group,setGroup] = useState(false);
  const [groupName,setGroupName] = useState("");
  const [allGroup,setAllGroup] = useState([]);
  const [currRoom,setCurrRoom] = useState("");
  const [navigatedToGame,setNavigatedToGame] = useState(false);
  const hasNavigatedToGameRef = useRef(false);

  const navigate = useNavigate();

  const createNewRoom = (e) => {

    e.preventDefault();
    createRoom({roomCode: roomName, userName});
    setRoom(false);

  };

  const JoinExistingRoom = (e) => {

    e.preventDefault();
    JoinRoom({roomCode: code, userName});
    setExistingRoom(false);

  }

  const createNewGroup = (e) => {

    e.preventDefault();
  
    createGroup({roomCode: currRoom,groupName,userName});

  }

  const handleGroupJoin = (name) => {

    console.log("Joining group:", name, "in room:", currRoom, "as user:", userName);
    joinGroup({roomCode : currRoom,groupName: name,userName});

  }


  useEffect(() => {

    const handleRoomCreated = (data) => {

      setStatus("Room created successfully!");
      setGroup(true);
      setCurrRoom(data.roomCode);
    }

    onRoomCreated(handleRoomCreated);

    const handleRoomJoin = (data) => {

      setStatus("Room joined successfully!");
      setGroup(true);
      setCurrRoom(data.roomCode);

      callAllGroup({roomCode : data.roomCode});

       getAllgroup((groupData) => {
        setAllGroup(groupData.groups || []);
       
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
      console.log("Room join error",data);
    }

    onRoomJoinError(handleRoomJoinError);

    const handleGroupCreate = (data) => {

      setStatus("Group Created Successfully");
      navigate('/GameRoom');
    }

    onGroupCreated(handleGroupCreate);

    const handleGroupJoined = (data) => {
      if (hasNavigatedToGameRef.current) return;
      hasNavigatedToGameRef.current = true;

      console.log("Group joined event received:", data);
      socket.off("roomCreated");
      socket.off("RoomJoined");
      socket.off("Room error");
      socket.off("Join error");
      socket.off("groupCreated");
      socket.off("groupJoined");
      socket.off("GroupCreateerror");
      socket.off("GroupJoinerror");
      socket.off("getAllGroup");

    
      window.location.href = '/GameRoom';
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
      
      if (typeof errorMessage === "string" && errorMessage.toLowerCase().includes("already in the group")) {
        if (hasNavigatedToGameRef.current) return;
        hasNavigatedToGameRef.current = true;
        socket.off("roomCreated");
        socket.off("RoomJoined");
        socket.off("Room error");
        socket.off("Join error");
        socket.off("groupCreated");
        socket.off("groupJoined");
        socket.off("GroupCreateerror");
        socket.off("GroupJoinerror");
        socket.off("getAllGroup");
        window.location.href = '/GameRoom';
      }
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

  },[])

  if (navigatedToGame) {
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

              <input type = "text" value = {userName} placeholder='Enter UserName' onChange = {(e) => setUserName(e.target.value)}/>

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
 
                  <input type = "text" value = {groupName} placeholder = "Enter GroupName" onChange = {(e) => setGroupName(e.target.value)} />

                  <button type = "button" onClick = {createNewGroup}>Create Group</button>

                  <div className = "text-3xl">All the groups currently in the room</div>

                  {allGroup.length == 0 && <div className = "text-2xl"> No group in the room </div>}

                  {allGroup.length != 0 && 
                    <div>
                      {allGroup.map((group) => (

                        <div key = {`${group.roomCode}-${group.name}`} className = "border p-2 mb-2"> 
                          <p className = "font-bold">Hello {group.name}</p>
                          <p>Users : {group.users.length}</p>

                          {group.users && group.users.length > 0 && (
                            <ul className="list-disc ml-4">
                              {group.users.map((user, idx) => (
                                <li key={user.id || idx}>{user.name}</li>   
                              ))}
                            </ul>
                          )}

                          <button onClick = {() => handleGroupJoin(group.name)}>Join this Group</button>

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