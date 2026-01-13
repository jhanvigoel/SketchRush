import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
//Server here is a class

const App = express()

App.use(cors());

const server = http.createServer(App);

const io = new Server(server , {
    cors: {
        origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
})

io.on("connection",(socket)=> {

    console.log("user connected")
    console.log("id",socket.id)
})

//here server is being used becuase on that we are working our socketio , id app.listen then new instance is being created
server.listen(3000, () => {
    console.log('Server Running');
})