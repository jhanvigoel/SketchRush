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

    if (room.users.some(user => user.id === userId)){
        return {success : false, error : "User already in the room"};
    }

    room.users.push({id : userId, name : userName});

    return {success : true}

}
