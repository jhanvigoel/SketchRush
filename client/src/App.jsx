import React from 'react'
import Home from './pages/Home'
import { Route,Routes } from 'react-router-dom'
import GameRoom from './pages/GameRoom'
import RoomSettingContext from './context/RoomSettingContext'
import GroupContext from './context/GroupContext'

const App = () => {

  return (
    <div>
      <Routes>
        <Route path = "/"  element = {<Home />} />
        <Route path = "/GameRoom" element = {<RoomSettingContext><GroupContext><GameRoom /></GroupContext></RoomSettingContext>} />
      </Routes>
    </div>
  )
}

export default App