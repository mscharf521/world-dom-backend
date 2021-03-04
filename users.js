const users = []

function userJoin(id, username, room, num_caps)
{
    let caps = [];
    var i;
    for (i = 0; i < num_caps; i++) {
      caps.push({})
    }
    const user = {id, username, room, caps, has_sel_cap:false};
    users.push(user);
    return user;
}

function getCurrentUser(id) {
  return users.find(user => user.id === id);
}

function userLeave(id) {
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

function getUsersInRoom(room) {
  return users.filter(user => user.room === room);
}

function setUserCaps(id, caps) {
  //console.log("users caps: " + users)
  //console.log("user.id " + id)
  const index = users.findIndex(user => user.id === id);
  //console.log("index: " + index)
  if( index !== -1 )
    {
      //console.log("caps: " + caps)
      users[index].caps = [...caps]
      users[index].has_sel_cap = true;
      //console.log("user caps: ")
      //console.log(users[index].caps[0])
    }
}

function dicoverUserCap(id, lat, lng)
{
  const index = users.findIndex(user => user.id === id);
  console.log("index: " + index)
  if( index !== -1 )
  {
    const cap_index = users[index].caps.findIndex(cap => (cap.capinfo.lat === lat && cap.capinfo.lng === lng))
    console.log("cap_index: " + cap_index)
    if(cap_index !== -1)
    {
      users[index].caps[cap_index].discovered = true;
      console.log("cap: " + users[index].caps[cap_index].discovered)
    }
  }
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getUsersInRoom,
  setUserCaps,
  dicoverUserCap
};