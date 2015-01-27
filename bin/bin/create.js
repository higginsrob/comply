var co = require('co');
var Promise = require('promise');
var comply = require('../../');

module.exports = {
  summary: 'create new privileges, roles, and users',
  options: {
    roles: { alias: 'r', value: 'name...', description: 'specify roles to create' },
    privileges: { alias: 'p', value: 'name...', description: 'specify privileges to create' },
    users: { alias: 'u', value: 'username...', description: 'specify users to create' },
    assign: { alias: 'a', value: 'name...', description: 'assign roles to the newly created user' },
    grant: { alias: 'g', value: 'name...', description: 'grant privileges to the newly created roles and users' },
    description: { alias: 'd', value: '"description"', description: 'add a description to newly created privileges' },
  },
  description: [
    'Create new privileges, roles, and users.  You can specify as many privilegs,',
    'roles, and users as you like. While creating users you can specify roles',
    'to be assigned to the newly created users, and while creating roles and users you can',
    'specify privilegs to be granted the newly created roles and users. When creating',
    'users you will be asked interactivly to provide email and password.'
  ].join(" "),
  examples: [
    'create -u user_a -r role_a -p privilege_a',
    'create -u user_a -a role_a -g privilege_a',
    'create -p privilege_a -d "this is the privilege description"',
    'create -r role_a -g privilege_a'
  ],
  exec: function create(argv){
    var ctx = this;
    return new Promise(function(resolve, revoke) {
      co(function *(){
        if(!argv.roles) argv.roles = [];
        if(!argv.privileges) argv.privileges = [];
        if(!argv.users) argv.users = [];
        if(!argv.assign) argv.assign = [];
        if(!argv.grant) argv.grant = [];
        if(!argv.roles.length && !argv.privileges.length && !argv.users.length)
          throw 'you must specify at least one role, privilege or user be created';
        var result, i;
        if(argv.privileges.length){
          for(var privilege_index = 0; privilege_index < argv.privileges.length; privilege_index++){
            try{
              result = yield comply.createPrivilege({
                name: argv.privileges[privilege_index],
                description: argv.description || ""
              });
              ctx.stdout('created privilege: ' + result.name);
            } catch(err){
              ctx.stderr(err);
            }
          }
        }
        if(argv.roles.length){
          for(var role_index = 0; role_index < argv.roles.length; role_index++){
            try{
              var role = yield comply.createRole({ name: argv.roles[role_index] });
              ctx.stdout('created role: ' + role.name);
              for(i = 0; i < argv.grant.length; i++){
                try{
                  result = yield comply.Privilege.findOne({ name: argv.grant[i] }).exec();
                  if(!result){
                    ctx.stderr('privilege ' + argv.grant[i] + ' not found');
                  } else {
                    if(role.privileges.indexOf(result._id) > -1){
                      ctx.stderr(role.name + ' already granted privilege ' + result.name);
                    } else {
                      role.privileges.push(result._id);
                      yield role.savePromise().then(
                        function(role) { ctx.stdout(role.name + ' granted privilege ' + role.name); },
                        function(err) { ctx.stderr(err); }
                      );
                    }
                  }
                } catch(err){
                  ctx.stderr(err);
                }
              }
            } catch(err){
              ctx.stderr(err);
            }
          }
        }
        if(argv.users.length){
          for(var user_index = 0; user_index < argv.users.length; user_index++){
            try{
              var obj = { username: argv.users[user_index] };
              obj.email = yield ctx.ask(argv.users[user_index] + '> email: ');
              obj.password = yield ctx.ask(argv.users[user_index] + '> password: ', true);
              obj.passwordconfirmation = yield ctx.ask(argv.users[user_index] + '> password confirmation: ', true);
              if(!obj.email || !obj.password || !obj.passwordconfirmation){
                throw new Error(argv.users[user_index] + '> email, password and confirmation are required');
              }
              var user = yield comply.createUser(obj);
              ctx.stdout('created user: ' + user.username);
              for(i = 0; i < argv.grant.length; i++){
                try{
                  result = yield comply.Privilege.findOne({name: argv.grant[i]}).exec();
                  if(!result){
                    ctx.stderr('privilege ' + argv.grant[i] + ' not found');
                  } else {
                    if(user.privileges.indexOf(result._id) > -1){
                      ctx.stderr(user.username + ' already granted privilege ' + result.name);
                    } else {
                      user.privileges.push(result._id);
                      yield user.savePromise().then(
                        function(role) { ctx.stdout(user.username + ' granted privilege ' + role.name); },
                        function(err) { ctx.stderr(err); }
                      );
                    }
                  }
                } catch(err){
                  ctx.stderr(err);
                }
              }
              for(i = 0; i < argv.assign.length; i++){
                try{
                  result = yield comply.Role.findOne({name: argv.assign[i]}).exec();
                  if(!result){
                    ctx.stderr('role ' + argv.assign[i] + ' not found');
                  } else {
                    if(user.roles.indexOf(result._id) > -1){
                      ctx.stderr(user.username + ' already assigned role ' + result.name);
                    } else {
                      user.roles.push(result._id);
                      yield user.savePromise().then(
                        function(role) { ctx.stdout(user.username + ' assigned role ' + role.name); },
                        function(err) { ctx.stderr(err); }
                      );
                    }
                  }
                } catch(err){
                  ctx.stderr(err);
                }
              }
            } catch(err){
              ctx.stderr(err);
            }
          }
        }
      }).then(resolve).catch(revoke);
    });
  }
};