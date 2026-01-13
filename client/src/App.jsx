import React from 'react'
import Home from './pages/Home'
import { Route,Routes } from 'react-router-dom'

import { io } from 'socket.io-client'

const App = () => {

  const socket = io.connect("http://localhost:3000");

  return (
    <div>
      <Routes>
        <Route path = '/'  element = {<Home />} />
      </Routes>
    </div>
  )
}

export default App