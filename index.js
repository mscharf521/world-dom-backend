const app = require('express')()
const http = require('http').createServer(app)
const port = process.env.PORT || 4000;
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
});
//const io = require('socket.io')(http)
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getUsersInRoom,
    setUserCaps,
    dicoverUserCap
  } = require('./users');
const {
    addRoom,
    getRoomData,
    setRoomStartGame,
    destroyRoom,
    setRoomTurnOrder,
    getCurrentTurnID,
    incRoomTurnIndex,
    addBombToRoom,
    removeIDFromTurnOrder
  } = require('./rooms');
const {
    getDistanceFromLatLng
} = require('./dst')

io.on('connection', socket => {
    // Chat Message
    socket.on('client-message', ({m_room, m_name, m_message}) => {
        console.log("NEW MSG room: " + m_room + " name: " + m_name + " msg: " + m_message)
        //could make sure room exists
        io.to(m_room).emit('message', {m_name, m_message, fromID:socket.id})
    })

    // Join Room
    socket.on('join-room', ({m_room, m_name}) => {
        let room_data = getRoomData( m_room )
        let success = false;
        let leader = false;

        // room does not exist and it has not started playing
        if( room_data != null
         && !room_data.hasStarted )
        {
            success = true;
            console.log("found room which has not started")
        }
        // room does not exist
        else if (room_data == null)
        {
            // create room and join as "leader"
            room_data = addRoom(m_room, "");
            success = true;
            leader = true;
            console.log("making new room")
        }

        if(success)
        {
            const user = userJoin(socket.id, m_name, m_room, room_data.num_caps);
            socket.join(m_room);
            io.to(user.room).emit('room-users', {users: getUsersInRoom(user.room)} );
        }
        io.to(socket.id).emit('joined-room-result', {success, leader})

        console.log(getRoomData(m_room))
    })

    // Host Start Game
    socket.on('host-start-game', ({room}) => {
        const usersInRoom = getUsersInRoom(room);
        if(usersInRoom.length > 1) // make sure there is more than one player to start the game
        {
            setRoomStartGame(room)
            const room_data = getRoomData(room);
            if( room_data != null )
            {
                io.to(room).emit('start-game', {num_caps: room_data.num_caps})
            }
        }
    })

    // Client sends their capitals
    socket.on('cap-sel', ({room, caps}) => {
        console.log("rcv caps: \n" + caps);
        setUserCaps(socket.id, caps);
        io.to(room).emit('room-users', {users: getUsersInRoom(room)} );

        const room_data = getRoomData(room);
        if( room_data != null )
        {
            console.log("found user data from cap-sel")
            const usersInRoom = getUsersInRoom(room);
            let done = true;
            for(var user of usersInRoom)
            {
                //console.log("User " + user.username + " caps: \n" + user.caps);
                //console.log(room_data.num_caps);
                //console.log(user.caps.length)
                if(!user.has_sel_cap)
                {
                    console.log("User " + user.username + " is not done")
                    done = false;
                    break;
                }
            }

            if(done)
            {
                console.log("every player has selected their capitals")
                setRoomTurnOrder(room, usersInRoom)
                io.to(room).emit('next-turn', {userID: getCurrentTurnID(room)})
            }
        }
    })

    socket.on('client-turn', ({room, bomb}) => {
        // Add bomb
        addBombToRoom(room, bomb);

        // Check if any capitals were hit
        const usersInRoom = getUsersInRoom(room);
        let cap_hit = false;
        for(var user of usersInRoom)
        {
            for(var cap of user.caps)
            {
                if(!cap.discovered)
                {
                    const dst_km = getDistanceFromLatLng(bomb.center.lat, bomb.center.lng, cap.capinfo.lat, cap.capinfo.lng);
                    console.log("bomb radius km:")
                    console.log(bomb.radius / 1000.0)
                    console.log("calc dst:")
                    console.log(dst_km)
                    if(dst_km <= (bomb.radius / 1000.0) )
                    {
                        dicoverUserCap(user.id, cap.capinfo.lat, cap.capinfo.lng);
                        cap_hit = true;
                    }
                }
            }
        }

        // update user data if capital was hit and check win condition
        const room_data = getRoomData(room);
        if(room_data)
        {
            // A capital was hit
            if(cap_hit)
            {
                //update user data
                io.to(room).emit('room-users', {users: getUsersInRoom(room)} );

                checkWinCondition(room);
            }
        
            // update bombs and start next turn
            io.to(room).emit('bomb-update', {bombs: room_data.bombs})
            incRoomTurnIndex(room)
            io.to(room).emit('next-turn', {userID: getCurrentTurnID(room)})
            ///////////////////////////////////////////////////////////////////////start timer for users turn in case they are not responsive or something
        }
        
    })

    // Leave room
    socket.on('leave-room', ({room}) => {
        leave(socket);
    })

    // Disconnect
    socket.on('disconnect', () => {
        leave(socket);
    })
})

http.listen(port, function() {
    console.log('listening on port ' + port)
})

function leave(socket)
{
    const user = userLeave(socket.id);  
    if(user) {
        removeIDFromTurnOrder(user.room, socket.id)  
        socket.leave(user.room);
        const usersInRoom = getUsersInRoom(user.room);
        if(usersInRoom.length != 0)
        {
            io.to(user.room).emit('room-users', {users: usersInRoom} );

            checkWinCondition(user.room);
        }
        else // no more users
        {
            const room = destroyRoom(user.room);
        }
    }
}

function checkWinCondition(room)
{
    //const usersInRoom = getUsersInRoom(room);
    const room_data = getRoomData(room);
    if(room_data && room_data.turn_order.length > 0)
    {
        let losing_users = []
        let surv_users = [];
        for(let userID of room_data.turn_order)
        {
            let user = getCurrentUser(userID)
            //ensure they are still in the game
            if(user)
            {
                let i = room_data.turn_order.findIndex(ID => ID === user.id);
                if(i !== -1)
                {
                    let has_caps_left = false;
                    for(var cap of user.caps)
                    {
                        if(!cap.discovered)
                        {
                            has_caps_left = true;
                            break;
                        }
                    }
                    if(has_caps_left)
                    {
                        surv_users.push(user);
                    }
                    else
                    {
                        losing_users.push(user);
                    }
                }
            }
        }

        if(surv_users.length === 0) // No survivors, TIE
        {
            // Send remaining players tie message
            for(let userID of room_data.turn_order)
            {
                io.to(userID).emit('tie' );
            }
        }
        else // Not a tie
        {
            // let the losers know they lost
            for(let user of losing_users)
            {
                io.to(user.id).emit('lose' );
                removeIDFromTurnOrder(user.room, user.id);
            }
            // If we have a winner let them know
            if(surv_users.length === 1)
            {
                io.to(surv_users[0].id).emit('win' );
                removeIDFromTurnOrder(surv_users[0].room, surv_users[0].id);
            }
        }
    }
}