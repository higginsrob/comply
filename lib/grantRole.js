var comply = require('../');

module.exports = function grantRole(obj){
  return function *grantRole(){
    if(Object.prototype.toString.call(obj) !== '[object Object]' || !obj.role || !obj.privilege)
      throw new Error('bad request');
    var criteria = {};
    if(typeof obj.role === 'string'){
      criteria.name = obj.role;
    } else if(Object.prototype.toString.call(obj.role) === '[object Object]'){
      if(obj.role.name) criteria.name = obj.role.name;
      if(obj.role._id) criteria._id = obj.role._id;
    }
    var role = yield comply.Role.findOne(criteria)
    .exec()
    .then(function(role){
      if(!role) throw new Error('role not found: '+ (obj.role.name || obj.role._id || obj.role))
      return role;
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
    if(role.privileges.indexOf(privilege._id) > -1)
      throw new Error(role.name + ': already has privilege: ' + privilege.name)
    role.privileges.push(privilege._id);
    yield role.savePromise();
    return {
      role: role,
      privilege: privilege
    };
  };
};