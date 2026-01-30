import React, { useEffect, useState } from 'react'
import Canvas from '../components/Canvas'
import TeamPlayers from '../components/TeamPlayers'
import { groupCreateMessage, groupJoinMessage } from '../services/Socket'

const GameRoom = () => {

  console.log("GameRoom mounted!");

  const [message,setMessage] = useState("");

  useEffect(() => {

    groupJoinMessage((data) => {

      alert(` user ${data.userName} joined Group ${data.groupName}`);

    })

    groupCreateMessage((data) => {

      alert(`user ${data.userName} created Group ${data.groupName}`);

    })

  }, [])
  
  return (
    <div className = "px-10 py-10">

      <div className = "flex flex-cols-3">

        <TeamPlayers  teamName = {"xyz"} />
        <Canvas />
        <TeamPlayers teamName = {"yz"} />
      </div>
    </div>
  )
}

export default GameRoom