import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { handleConnection } from './controllers/socketController.js'
import 'dotenv/config'
//Server here is a class

const App = express()

App.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));


const server = http.createServer(App);

const io = new Server(server , {
    cors: {
        origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST"], 
        credentials : true
    }
})

io.on("connection",(socket)=> {

    handleConnection(io,socket);
    
})

const PORT = process.env.PORT || 3000 ;

//here server is being used becuase on that we are working our socketio , id app.listen then new instance is being created
server.listen(PORT, () => {
    console.log('Server Running');
})