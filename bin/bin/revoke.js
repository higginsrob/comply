var co = require('co');
var Promise = require('promise');
var comply = require('../../');

module.exports = {
  summary: 'revoke privileges from roles and users',
  options: {
    roles: { alias: 'r', value: 'name', description: 'specify roles to be revoked privileges' },
    users: { alias: 'u', value: 'username|email', description: 'specify users to be revoked privileges' },
    privileges: { alias: 'p', value: 'name...', description:
      'this option is an additional way to specify privileges and included only as a convenience.'
    }
  },
  arguments: [
    "privilege..."
  ],
  description: [
    'Revoke privileges from roles and users.',
    'Specify privileges and roles by name, users by username or email address.',
    'You may specify as many users, roles, and privileges as you like, all users/roles',
    'will be revoked every privilege.',
    'You must specify at least one user or one role, if you do not specify a privilege',
    'you will be asked interactively to provide one.'
  ].join(" "),
  examples: [
    'revoke -u user_a privilege_a',
    'revoke -u user_a -r role_a privilege_a privilege_b privilege_c',
    'revoke -r role_a -u "user_a, user_b, user_c" privilege_a'
  ],
  exec: function revoke(argv){
    var ctx = this;
    return new Promise(function(resolve, revoke) {
      co(function *(){
        if(!argv.users) argv.users = [];
        if(!argv.roles) argv.roles = [];
        if(!argv.roles.length && !argv.users.length)
        if(!argv.privileges) argv.privileges = [];
        argv._.forEach(function(item){
          item.split(/[,|\s]+/).forEach(function(privilege){
            if(argv.privileges.indexOf(privilege) < 0){
              argv.privileges.push(privilege);
            }
          });
        });
        if(!argv.privileges.length){
          yield ctx.ask('privilege name: ').then(
            function(reply){ argv.privileges.push(reply); }
          );
          if(!argv.privileges[0])
            throw 'you must specify at least one privileges';
        }
        var result,i;
        if(argv.role){
          for(var role_index = 0; role_index < argv.roles.length; role_index++){
            for(i = 0; i < argv.privileges.length; i++){
              try{
                result = yield comply.revokeRole({
                  role: argv.roles[role_index],
                  privilege: argv.privileges[i]
                });
                ctx.stdout('you have revoked privilege ' + result.privilege.name + ' from role ' + result.role.name);
              } catch(err){
                ctx.stderr(err);
              }
            }
          }
        }
        if(argv.user){
          for(var user_index = 0; user_index < argv.users.length; user_index++){
            for(i = 0; i < argv.privileges.length; i++){
              try{
                result = yield comply.revokeUser({
                  user: argv.users[user_index],
                  privilege: argv.privileges[i]
                });
                ctx.stdout('you have revoked privilege ' + result.privilege.name + ' from user ' + result.user.username);
              } catch(err){
                ctx.stderr(err);
              }
            }
          }
        }
      }).then(resolve).catch(revoke);
    });
  }
};