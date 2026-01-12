import React, { useState } from 'react'

const RoomForm = () => {

  const [userName,setUserName] = useState();
  const [code,setCode] = useState();

  return (
    <div>

        <form>
            <input type = "text" value = {userName} placeholder='Enter UserName' onChange = {(e) => setUserName(e.target.value)}/>

            <input type = "text" value = {code} placeholder='Enter Room Code' onChange = {(e) => setCode(e.target.value)}/>

            <button className = "text-5xl" type = "submit">Join</button>
        </form>
    </div>
  )
}

export default RoomForm