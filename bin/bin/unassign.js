var co = require('co');
var Promise = require('promise');
var comply = require('../../');

module.exports = {
  summary: 'unassign roles from users',
  options: {
    users: { alias: 'u', value: 'username|email...', description: 'specify users to unassign roles' },
    roles: { alias: 'r', value: 'name...', description:
      'this option is an additional way to specify roles and included only as a convenience.'
    }
  },
  arguments: [
    'role...'
  ],
  description: [
    'Unassign roles from users.',
    'Specify users by username or email address, and roles by role name.',
    'You may specify as many users and roles as you like, all users will be unassinged every role.',
    'If you do not specify a role or a user you will be asked interactively to provide one.'
  ].join(" "),
  examples: [
    'unassign -u user_a -r role_a',
    'unassign -u user_a role_a role_b role_c',
    'unassign role_a -u "user_a, user_b, user_c"'
  ],
  exec: function assign(argv){
    var ctx = this;
    return new Promise(function(resolve, revoke) {
      co(function *(){
        if(!argv.users) argv.users = [];
        if(!argv.roles) argv.roles = [];
        if(!argv.users.length) {
          argv.users.push(yield ctx.ask('username or email: '));
          if(!argv.users[0]) throw 'you must specify at least one user';
        }
        if(argv._.length){
          argv._.forEach(function(arg){
            if(argv.roles.indexOf(arg) < 0){
              argv.roles.push(arg);
            }
          });
        }
        if(!argv.roles.length){
          argv.roles.push(yield ctx.ask('role name: '));
          if(!argv.roles[0]) throw 'you must specify at least one role';
        }
        for(var user_index = 0; user_index < argv.users.length; user_index++){
          for(var role_index = 0; role_index < argv.roles.length; role_index++){
            try{
              var result = yield comply.unassign({
                user: argv.users[user_index],
                role: argv.roles[role_index]
              });
              ctx.stdout('unassigned role: ' + result.role.name + " from user: " + result.user.username);
            } catch(err){
              ctx.stderr(err);
            }
          }
        }
      }).then(resolve).catch(revoke);
    });
  }
};