const groups = new Map();

export const createGroup = ({groupName,userName,roomCode,userId}) => {

    const groupId = `${roomCode}-${groupName}`;

    if (groups.has(groupId)){
        return {success : false,error : "Group already exists"};
    }

    groups.set(groupId,{
        name : groupName,
        roomCode: roomCode,
        creater : userId,
        users : [{name : userName,id : userId}],
        createdAt: Date.now(),
    })

    return {success : true, groupId};

}

export const joinGroup = ({groupName,roomCode,userName,userId}) => {

    const groupId = `${roomCode}-${groupName}`;

    if (!groups.has(groupId)){
        return {success : false, error : "Group doesn't exist"};
    }

    const curr = groups.get(groupId);

    if (curr.users.some(user => user.id === userId )){
        return {success : false,error: "User already in the group"};
    }

    curr.users.push({name : userName,id : userId});

    return {success : true,groupId};

}

export const Allgroups = ({roomCode}) => {

    const roomGroups = Array.from(groups.values()).filter(g => g.roomCode == roomCode);

    return {success : true, groups: roomGroups};
    
}
