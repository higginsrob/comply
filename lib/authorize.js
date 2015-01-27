var comply = require('../');

module.exports = function authorize(ctx, obj){
  return function *authorize(){
    if(!ctx.state.user && !!ctx.session && !!ctx.session.uid) {
      yield comply.authenticate(ctx);
    }
    if(!ctx.state.user) throw new Error('Unauthenticated')
    if(!obj) throw new Error('no privileges specified')
    if(Object.prototype.toString.call(obj) === '[object Array]') {
      obj.forEach(function(privilege){
        if(ctx.state.user.privileges.indexOf(privilege) < 0){
          throw new Error('Authorization failed, this resource requires ' + privilege + ' rights')
        }
      });
    } else if(typeof obj === 'string'){
      if(ctx.state.user.privileges.indexOf(obj) < 0){
        throw new Error('Authorization failed, this resource requires ' + obj + ' rights')
      }
    } else {
      throw new Error('bad request')
    }
    return true;
  };
};