var co = require('co');
var Promise = require('promise');
var comply = require('../../');

module.exports = {
  summary: 'delete roles, privileges, and users',
  options: {
    privileges: { alias: 'p', value: 'name...', description: 'specify privileges to delete' },
    roles: { alias: 'r', value: 'name...', description: 'specify roles to delete' },
    users: { alias: 'u', value: 'username|email...', description: 'specify users to delete' }
  },
  description: [
    'delete privileges, roles, and users.  You can specify as many privilegs,',
    'roles, and users as you like.'
  ].join(" "),
  examples: [
    'remove -u user_a -r role_a -p privilege_a',
    'remove -u "user_a, user_b, user_c"'
  ],
  exec: function remove(argv){
    var ctx = this;
    return new Promise(function(resolve, revoke) {
      co(function *(){
        if(!argv.privileges) argv.privileges = [];
        if(!argv.roles) argv.roles = [];
        if(!argv.users) argv.users = [];
        if(!argv.roles.length && !argv.privileges.length && !argv.users.length)
          throw 'you must specify at least one role, privilege or user be deleted';
        if(argv.roles.length){
          for(var role_index = 0; role_index < argv.roles.length; role_index++){
            try{
              var role = yield comply.removeRole({
                name: argv.roles[role_index]
              });
              ctx.stdout('deleted role: ' + role.name);
            } catch(err){
              ctx.stderr(err);
            }
          }
        }
        if(argv.privileges.length){
          for(var privilege_index = 0; privilege_index < argv.privileges.length; privilege_index++){
            try{
              var privilege = yield comply.removePrivilege({
                name: argv.privileges[privilege_index]
              });
              ctx.stdout('deleted privilege: ' + privilege.name);
            } catch(err){
              ctx.stderr(err);
            }
          }
        }
        if(argv.users.length){
          for(var user_index = 0; user_index < argv.users.length; user_index++){
            try{
              var user = yield comply.removeUser({
                user: argv.users[user_index]
              });
              ctx.stdout('deleted user: ' + user.username);
            } catch(err){
              ctx.stderr(err);
            }
          }
        }
      }).then(resolve).catch(revoke);
    });
  }
};