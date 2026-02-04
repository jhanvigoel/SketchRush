import React from 'react'
import Home from './pages/Home'
import { Route,Routes } from 'react-router-dom'
import GameRoom from './pages/GameRoom'
import RoomSettingContext from './context/RoomSettingContext'

const App = () => {

  return (
    <div>
      <Routes>
        <Route path = "/"  element = {<Home />} />
        <Route path = "/GameRoom" element = {<RoomSettingContext><GameRoom /></RoomSettingContext>} />
      </Routes>
    </div>
  )
}

export default App