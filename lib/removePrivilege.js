var comply = require('../');

module.exports = function deletePrivilege(obj){
  return function *deletePrivilege(){
    if(Object.prototype.toString.call(obj) !== '[object Object]' || (!obj.name && !obj._id))
      throw new Error('bad request');
    var criteria = {};
    if(obj.name) criteria.name = obj.name;
    if(obj._id) criteria._id = obj._id;
    return yield comply.Privilege.findOneAndRemove(criteria).exec().then(function(privilege){
      if(!privilege) throw new Error('privilege does not exist')
      return privilege;
    });
  };
};