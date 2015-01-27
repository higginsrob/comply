var comply = require('../');
var debug = require('debug')('comply:deleteUser');

module.exports = function deleteUser(obj){
  return function *deleteUser(){
    if(Object.prototype.toString.call(obj) !== '[object Object]' || (!obj.user && !obj.username && !obj.email && !obj._id))
      throw new Error('bad request');
    var criteria = {};
    if(obj.user){
      if(obj.user.indexOf('@') === -1){ obj.username = obj.user; }
      else { obj.email = obj.user; }
    }
    if(obj.username) criteria.username = obj.username;
    if(obj.email) criteria.email = obj.email;
    if(obj._id) criteria._id = obj._id;
    return yield comply.User.findOneAndRemove(criteria).exec().then(function(user){
      if(!user) throw new Error('user does not exist')
      return user;
    });
  };
};