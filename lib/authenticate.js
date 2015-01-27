var comply = require('../');

module.exports = function(ctx){
  return function *authenticate(){
    try{
      if(!ctx.session) throw new Error('request needs a session to be authenticated')
      if(!ctx.session.uid) throw new Error('user not logged in')
      var user = yield comply.User.findById(ctx.session.uid)
      .lean()
      .select('-passwordhash -__v')
      .populate('privileges')
      .exec()
      .then(
        function(user){
          if(!user) throw new Error('user not found');
          if(user.privileges.length){
            user.privileges = user.privileges.map(function(privilege){
              return privilege.name;
            });
          }
          return user;
        },
        function(err){ throw err }
      );
      if(user.roles.length){
        yield comply.Role.find({'_id':{ $in: user.roles }})
        .lean()
        .populate('privileges')
        .exec()
        .then(
          function(roles){
            roles.forEach(function(role){
              if(role.privileges.length){
                role.privileges.forEach(function(privilege){
                  if(user.privileges.indexOf(privilege.name) < 0){
                    user.privileges.push(privilege.name);
                  }
                });
              }
            });
          },
          function(err){ throw err }
        );
        delete user.roles;
      }
      ctx.state.user = user;
      return user;
    } catch(err){
      delete ctx.session.uid;
      delete ctx.state.user;
      return false;
    }
  };
};