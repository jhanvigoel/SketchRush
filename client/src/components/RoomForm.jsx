import React, { useEffect, useState } from 'react'
import { createRoom, JoinRoom, onRoomCreated, onRoomJoined } from '../services/Socket';

const RoomForm = () => {

  const [userName,setUserName] = useState("");
  const [code,setCode] = useState("");
  const [room,setRoom] = useState(false);
  const [roomName,setRoomName] = useState("");
  const [existingRoom,setExistingRoom] = useState(false);
  const [status,setStatus] = useState("");

  const createNewRoom = (e) => {

    e.preventDefault();
    createRoom({roomCode: roomName, userName});

  };

  const JoinExistingRoom = (e) => {

    e.preventDefault();
    JoinRoom({roomCode: code, userName});

  }

  useEffect(() => {

    onRoomCreated((data) => {
      setStatus("✅ Room created successfully!");
      console.log("Room created",data);
    });

    onRoomJoined((data) => {
      setStatus("✅ Room joined successfully!");
      console.log("Room Joined",data);
    });
  },[])

  return (
    <div>

      <div className = "mt-28 flex flex-col justify-center items-center">

        <div className = "px-5 py-5 rounded-lg border border-black">

          <form className="flex flex-col gap-4">

              {status && <div className="text-green-600 font-bold text-lg">{status}</div>}

              <input type = "text" value = {userName} placeholder='Enter UserName' onChange = {(e) => setUserName(e.target.value)}/>

              <button className = "text-3xl" type = "button" onClick = {() => setExistingRoom(true)}>Join Existing Room</button>

              <button className = "text-3xl" type = "button" onClick={() => setRoom(true)}>Create New Room</button>

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

          </form>
        </div>
        
        </div>
    </div>
  )
}

export default RoomForm