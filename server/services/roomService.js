const rooms = new Map();

export const createRoom = ({roomCode,userName,userId}) => {

    if (rooms.has(roomCode)){
        return {success : false,error : "Room already exists"};
    }

    rooms.set(roomCode,{
        creater : userId,
        users: [{id : userId,name : userName}],
        createdAt : Date.now()
    });

    return {success: true}

}

export const joinRoom = ({roomCode,userName,userId}) => {

    if (!rooms.has(roomCode)){
        return {success : false,error : "Room doesn't exist"};
    }

    const room = rooms.get(roomCode);

    const existingUser = room.users.find(user => user.name === userName);
    
    if (existingUser) {
        console.log(`[roomService] User ${userName} reconnecting, updating socket ID from ${existingUser.id} to ${userId}`);
        existingUser.id = userId;
        return {success : true}
    }

    room.users.push({id : userId, name : userName});

    return {success : true}

}
