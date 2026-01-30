import React from 'react'
import Home from './pages/Home'
import { Route, Routes } from 'react-router-dom'
import GameRoom from './pages/GameRoom'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path = '/'  element = {<Home />} />
        <Route path = '/GameRoom' element = {<GameRoom />} />
      </Routes>
    </div>
  )
}

export default App