var parse = require('co-body');

// call comply functions as middleware
module.exports = function(cmd, obj){
  var comply = module.exports;
  return function*(next){
    var ctx = this;
    delete ctx.state.result;
    var array = [];
    if(!ctx.request.body) {
      if(ctx.request.method === 'POST') {
        ctx.request.body = yield parse(ctx);
      } else {
        ctx.request.body = {};
      }
    }
    if(Object.prototype.toString.call(obj) === '[object Array]'){
      array = obj;
    } else if(Object.prototype.toString.call(obj) === '[object Object]'){
      Object.keys(obj).forEach(function(key){
        ctx.request.body[key] = obj[key];
      });
    }
    switch(cmd){
      case 'assign': ctx.state.result = yield comply.assign(ctx.request.body); break;
      case 'authenticate': ctx.state.result = yield comply.authenticate(ctx); break;
      case 'authorize': ctx.state.result = yield comply.authorize(ctx, array); break;
      case 'createPrivilege': ctx.state.result = yield comply.createPrivilege(ctx.request.body); break;
      case 'createRole': ctx.state.result = yield comply.createRole(ctx.request.body); break;
      case 'createUser': ctx.state.result = yield comply.createUser(ctx.request.body); break;
      case 'grantUser': ctx.state.result = yield comply.grantUser(ctx.request.body); break;
      case 'grantRole': ctx.state.result = yield comply.grantRole(ctx.request.body); break;
      case 'listPrivileges': ctx.state.result = yield comply.listPrivileges(ctx.request.body); break;
      case 'listRoles': ctx.state.result = yield comply.listRoles(ctx.request.body); break;
      case 'listUsers': ctx.state.result = yield comply.listUsers(ctx.request.body); break;
      case 'login': ctx.state.result = yield comply.login(ctx, ctx.request.body); break;
      case 'logout': ctx.state.result = comply.logout(ctx); break;
      case 'removePrivilege': ctx.state.result = yield comply.removePrivilege(ctx.request.body); break;
      case 'removeRole': ctx.state.result = yield comply.removeRole(ctx.request.body); break;
      case 'removeUser': ctx.state.result = yield comply.removeUser(ctx.request.body); break;
      case 'revokeUser': ctx.state.result = yield comply.revokeUser(ctx.request.body); break;
      case 'revokeRole': ctx.state.result = yield comply.revokeRole(ctx.request.body); break;
      case 'unassignRole': ctx.state.result = yield comply.unassignRole(ctx.request.body); break;
      default: throw new Error('comply middleware "' + cmd + '" not found')
    }
    yield next;
  };
};

// config
module.exports.config = require('./config');

// models
module.exports.User = require('./models/user');
module.exports.Role = require('./models/role');
module.exports.Privilege = require('./models/privilege');

// lib
module.exports.assign = require('./lib/assign');
module.exports.authenticate = require('./lib/authenticate');
module.exports.authorize = require('./lib/authorize');
module.exports.createPrivilege = require('./lib/createPrivilege');
module.exports.createRole = require('./lib/createRole');
module.exports.createUser = require('./lib/createUser');
module.exports.grantUser = require('./lib/grantUser');
module.exports.grantRole = require('./lib/grantRole');
module.exports.listPrivileges = require('./lib/listPrivileges');
module.exports.listRoles = require('./lib/listRoles');
module.exports.listUsers = require('./lib/listUsers');
module.exports.login = require('./lib/login');
module.exports.logout = require('./lib/logout');
module.exports.removePrivilege = require('./lib/removePrivilege');
module.exports.removeRole = require('./lib/removeRole');
module.exports.removeUser = require('./lib/removeUser');
module.exports.revokeUser = require('./lib/revokeUser');
module.exports.revokeRole = require('./lib/revokeRole');
module.exports.unassign = require('./lib/unassign');