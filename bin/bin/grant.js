var co = require('co');
var Promise = require('promise');
var comply = require('../../');

module.exports = {
  summary: 'grant privileges to roles and users',
  options: {
    roles: { alias: 'r', value: 'name...', description: 'specify roles to be granted privileges' },
    users: { alias: 'u', value: 'username|email...', description: 'specify users to be granted privileges' },
    privileges: { alias: 'p', value: 'name...', description:
      'this option is an additional way to specify privileges and included only as a convenience.'
    }
  },
  arguments: [
    "privilege..."
  ],
  description: [
    'Grant privileges to roles and users.',
    'Specify privileges and roles by name, users by username or email address.',
    'You may specify as many users, roles, and privileges as you like, all users/roles',
    'will be granted every privilege.',
    'You must specify at least one user or one role, if you do not specify a privilege',
    'you will be asked interactively to provide one.'
  ].join(" "),
  examples: [
    'grant -u user_a privilege_a',
    'grant -u user_a -r role_a privilege_a privilege_b privilege_c',
    'grant -r role_a -u "user_a, user_b, user_c" privilege_a'
  ],
  exec: function grant(argv){
    var ctx = this;
    return new Promise(function(resolve, revoke) {
      co(function *(){
        if(!argv.users) argv.users = [];
        if(!argv.roles) argv.roles = [];
        if(!argv.roles.length && !argv.users.length)
          throw 'you must specify at least one role or user be granted privileges';
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
        var result, i;
        if(argv.roles.length){
          for(var role_index = 0; role_index < argv.roles.length; role_index++){
            for(i = 0; i < argv.privileges.length; i++){
              try{
                result = yield comply.grantRole({
                  role: argv.roles[role_index],
                  privilege: argv.privileges[i]
                });
                ctx.stdout('you have granted privilege ' + result.privilege.name + ' to role ' + result.role.name);
              } catch(err){
                ctx.stderr(err);
              }
            }
          }
        }
        if(argv.users.length){
          for(var user_index = 0; user_index < argv.users.length; user_index++){
            for(i = 0; i < argv.privileges.length; i++){
              try{
                result = yield comply.grantUser({
                  user: argv.users[user_index],
                  privilege: argv.privileges[i]
                });
                ctx.stdout('you have granted privilege ' + result.privilege.name + ' to user ' + result.user.username);
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