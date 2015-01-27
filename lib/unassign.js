var comply = require('../');

module.exports = function assignRole(obj){
  return function *assignRole(){
    if(Object.prototype.toString.call(obj) !== '[object Object]' || !obj.user || !obj.role)
      throw new Error('bad request');
    var criteria = {};
    if(typeof obj.user === 'string'){
      criteria.username = obj.user;
    } else if(Object.prototype.toString.call(obj.user) === '[object Object]'){
      if(obj.user.username) criteria.username = obj.user.username;
      if(obj.user.email) criteria.email = obj.user.email;
      if(obj.user._id) criteria._id = obj.user._id;
    }
    var user = yield comply.User.findOne(criteria)
    .exec()
    .then(function(user){
      if(!user) throw new Error('user not found: '+ (obj.user.username || obj.user.email || obj.user._id || obj.user))
      return user;
    });
    criteria = {};
    if(typeof obj.role === 'string'){
      criteria.name = obj.role;
    } else if(Object.prototype.toString.call(obj.role) !== '[object Object]'){
      if(obj.role.name) criteria.name = obj.role.name;
      if(obj.role._id) criteria._id = obj.role._id;
    }
    var role = yield comply.Role.findOne(criteria)
    .exec()
    .then(function(role){
      if(!role) throw new Error('role not found: '+ (obj.role.name || obj.role._id || obj.role))
      return role;
    });
    if(user.roles.indexOf(role._id) < 0)
      throw new Error(user.username + ': does not have role: ' + role.name)
    user.roles.splice(user.roles.indexOf(role._id), 1);
    yield user.savePromise();
    return {
      user: user,
      role: role
    };
  };
};