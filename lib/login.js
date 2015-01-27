var comply = require('../');

module.exports = function login(ctx, obj){
  return function *login(){
    if(Object.prototype.toString.call(obj) !== '[object Object]' || (!obj.user && !obj.username && !obj.email && !obj._id) || !obj.password)
      throw new Error('bad request');
    var criteria = {};
    if(obj.user){
      if(obj.user.indexOf('@') === -1){ obj.username = obj.user; }
      else { obj.email = obj.user; }
    }
    if(obj.username) criteria.username = obj.username;
    if(obj.email) criteria.email = obj.email;
    if(obj._id) criteria._id = obj._id;
    return yield comply.User.findOne(criteria).exec().then(
      function(user){
        if(!user) throw new Error('user does not exist')
        if(!user.validatePassword(obj.password)) throw new Error('invalid password');
        ctx.session.uid = user._id;
        ctx.state.user = user;
        return user;
      },
      function(err){
        delete ctx.session.uid;
        delete ctx.state.user;
        throw err
      }
    );
  };
};