var comply = require('../');
var debug = require('debug')('comply:registerRole');

module.exports = function registerRole(obj){
  return function *registerRole(){
    if(Object.prototype.toString.call(obj) !== '[object Object]' || !obj.name)
      throw new Error('bad request');
    return yield comply.Role.create({
      name: obj.name,
      description: obj.description
    }).then(
      function(role) {
        if(!role) throw new Error('failed to register role: ' + obj.name);
        return role;
      },
      function(err) {
        if (err.code === 11000 || err.code === 11001) {
          throw new Error('name must be unique');
        } else {
          throw err;
        }
      }
    );
  };
};