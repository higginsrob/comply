var comply = require('../');

module.exports = function registerPrivilege(obj){
  return function *registerPrivilege(){
    if(Object.prototype.toString.call(obj) !== '[object Object]' || !obj.name)
      throw new Error('bad request');
    return yield comply.Privilege.create({
      name: obj.name,
      description: obj.description
    }).then(
      function(privilege) {
        if(!privilege) throw new Error('failed to register privilege: ' + obj.name);
        return privilege;
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