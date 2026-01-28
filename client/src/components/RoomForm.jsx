import React, { useEffect, useState } from 'react'
import { callAllGroup, createGroup, createRoom, getAllgroup, joinGroup, JoinRoom, onGroupCreated, onGroupCreateError, onGroupJoined, onGroupJoinError, onRoomCreated, onRoomCreationError, onRoomJoined, onRoomJoinError } from '../services/Socket';
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

    joinGroup({roomCode : currRoom,groupName: name,userName});

  }


  useEffect(() => {

    onRoomCreated((data) => {
      setStatus("Room created successfully!");
      setGroup(true);
      setCurrRoom(data.roomCode);
      console.log("Room created",data);
    });

    onRoomJoined((data) => {
      setStatus("Room joined successfully!");
      setGroup(true);
      setCurrRoom(data.roomCode);
      console.log("Room Joined",data);

      callAllGroup({roomCode : currRoom});

       getAllgroup((data) => {
        setAllGroup(data.groups || []);
       
      });
    });

    onRoomCreationError((data) => {
      setStatus(data);
      console.log("Room creation error",data);
    });

    onRoomJoinError((data) => {
      setStatus(data);
      console.log("Room join error",data);
    });

      onGroupCreated((data) => {
        setStatus("Group Created Successfully");
        navigate('/GameRoom');
      });

      onGroupJoined((data) => {
        setStatus("Group Joined successfully");
        navigate('/GameRoom');
      });

      onGroupCreateError((data) => {
        setStatus(data);
      })

      onGroupJoinError((data) => {
        setStatus(data);
      })

      callAllGroup({roomCode : currRoom});

       getAllgroup((data) => {
        setAllGroup(data.groups || []);
       
      });


  },[])

  return (
    <div>

      <div className = "mt-28 flex flex-col justify-center items-center">

        <div className = "px-5 py-5 rounded-lg border border-black">

          <form className="flex flex-col gap-4">

              {status && <div className="text-green-600 font-bold text-lg">{status}</div>}

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

                        <div key = {group.groupId} className = "border p-2 mb-2"> 
                          <p className = "font-bold">{group.groupName}</p>
                          <p>Users : {group.users.length}</p>

                          {group.users && group.users.length > 0 && (
                            <ul className="list-disc ml-4">
                              {group.users.map((user, idx) => (
                                <li key={user.id || idx}>{user.name}</li>   
                              ))}
                            </ul>
                          )}

                          <button onClick = {() => handleGroupJoin(group.groupName)}>Join this Group</button>

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