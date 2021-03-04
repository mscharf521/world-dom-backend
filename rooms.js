const rooms = []

function addRoom( room_name, password )
{
    const filter_room_arr = rooms.filter(room => room.room_name === room_name);
    if( filter_room_arr.length != 0 )
    {
        return null;
    }
    const room = { room_name, password, hasStarted:false, num_caps:1, bombs:[], turn_order: [], current_turn_index:0 };
    rooms.push(room);
    return room;
}

function getRoomData( room_name )
{
    const filter_room_arr = rooms.filter(room => room.room_name === room_name);
    if( filter_room_arr.length != 0 )
    {
        return filter_room_arr[ 0 ];
    }
    else
    {
        return null;
    }
}

function setRoomStartGame( room_name )
{
    const filter_room_arr = rooms.filter(room => room.room_name === room_name);
    if( filter_room_arr.length != 0 )
    {
        filter_room_arr[ 0 ].hasStarted = true;
    }
    else
    {
        return false;
    }
}

function destroyRoom( room_name )
{
  const index = rooms.findIndex(room => room.room_name === room_name);

  if (index !== -1) {
    return rooms.splice(index, 1)[0];
  }
  return null
}

function setRoomTurnOrder(room_name, users)
{
  const index = rooms.findIndex(room => room.room_name === room_name);

  if (index !== -1) {
    let i = 0;
    users = shuffle(users)
    for(var user of users)
    {
      rooms[index].turn_order[i] = user.id;
      i = i + 1;
    }
  }
}

function getCurrentTurnID(room_name)
{
  const index = rooms.findIndex(room => room.room_name === room_name);

  if (index !== -1) {
    return rooms[index].turn_order[rooms[index].current_turn_index];
  }
}

function incRoomTurnIndex(room_name)
{
  const index = rooms.findIndex(room => room.room_name === room_name);

  if (index !== -1) {
    rooms[index].current_turn_index += 1;
    if (rooms[index].current_turn_index >= rooms[index].turn_order.length)
    {
      rooms[index].current_turn_index = 0;
    }
  }
}

function addBombToRoom(room_name, bomb)
{
  const index = rooms.findIndex(room => room.room_name === room_name);

  if (index !== -1) {
    rooms[index].bombs.push(bomb);
  }
}

function removeIDFromTurnOrder(room_name, userID)
{
  console.log("removing userID: " + userID + " from room: " + room_name);
  const room_idx = rooms.findIndex(room => room.room_name === room_name);

  if (room_idx !== -1) {
    const id_idx = rooms[room_idx].turn_order.findIndex(user => user.id === userID)
    if(id_idx !== -1)
    {
      rooms[room_idx].turn_order.splice(id_idx, 1);
    }
  }
}


module.exports = {
    addRoom,
    getRoomData,
    setRoomStartGame,
    destroyRoom,
    setRoomTurnOrder,
    getCurrentTurnID,
    incRoomTurnIndex,
    addBombToRoom,
    removeIDFromTurnOrder
  };

  function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }