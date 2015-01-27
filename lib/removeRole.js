var comply = require('../');

module.exports = function deleteRole(obj){
  return function *deleteRole(){
    if(Object.prototype.toString.call(obj) !== '[object Object]' || (!obj.name && !obj._id))
      throw new Error('bad request');
    var criteria = {};
    if(obj.name) criteria.name = obj.name;
    if(obj._id) criteria._id = obj._id;
    return yield comply.Role.findOneAndRemove(criteria).exec().then(function(role){
      if(!role) throw new Error('role does not exist')
      return role;
    });
  };
};