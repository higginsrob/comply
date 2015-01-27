var comply = require('../');

module.exports = function grantUser(obj){
  return function *grantUser(){
    if(Object.prototype.toString.call(obj) !== '[object Object]' || !obj.user || !obj.privilege)
      throw new Error('bad request');
    var criteria = {};
    if(typeof obj.user === 'string'){
      if(obj.user.indexOf('@') === -1){ criteria.username = obj.user; }
      else { criteria.email = obj.user; }
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
    if(typeof obj.privilege === 'string'){
      criteria.name = obj.privilege;
    } else if(Object.prototype.toString.call(obj.privilege) === '[object Object]'){
      if(obj.privilege.name) criteria.name = obj.privilege.name;
      if(obj.privilege._id) criteria._id = obj.privilege._id;
    }
    var privilege = yield comply.Privilege.findOne(criteria)
    .exec()
    .then(function(privilege){
      if(!privilege) throw new Error('privilege not found: '+ (obj.privilege.name || obj.privilege._id || obj.privilege))
      return privilege;
    });
    if(user.privileges.indexOf(privilege._id) > -1)
      throw new Error(user.name + ': already has privilege: ' + privilege.name)
    user.privileges.push(privilege._id);
    yield user.savePromise();
    return {
      user: user,
      privilege: privilege
    };
  };
};