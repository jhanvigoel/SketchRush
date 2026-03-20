import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { handleConnection } from './controllers/socketController.js'
import 'dotenv/config'
//Server here is a class

const App = express()

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const isAllowedOrigin = (origin) => {
    if (!origin) return true;

    if (allowedOrigins.includes(origin)) {
        return true;
    }

    // Allow Vercel deployment and preview domains.
    if (/^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)) {
        return true;
    }

    return false;
};

const corsOrigin = (origin, callback) => {
    
    if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
    }

    callback(new Error(`Not allowed by CORS: ${origin}`));
};

App.use(cors({ origin: corsOrigin, credentials: true }));


const server = http.createServer(App);

const io = new Server(server , {
    cors: {
        origin: corsOrigin,
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