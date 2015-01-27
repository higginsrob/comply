var comply = require('../');

module.exports = function registerUser(obj){
  return function *registerUser(){
    if(Object.prototype.toString.call(obj) !== '[object Object]' ||
    !obj.username || !obj.email || !obj.password || !obj.passwordconfirmation)
      throw new Error('bad request');
    if(obj.password !== obj.passwordconfirmation)
      throw new Error('password does not match confirmation');
    return yield comply.User.create({
      username: obj.username,
      email: obj.email,
      password: obj.password
    }).then(
      function(user) {
        if(!user) throw new Error('failed to register user: ' + obj.username);
        return user;
      },
      function(err) {
        if (err.code === 11000 || err.code === 11001) {
          throw new Error('username and email must be unique');
        } else {
          throw err;
        }
      }
    );
  };
};