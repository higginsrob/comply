var co = require('co');
var Promise = require('promise');
var comply = require('../../');
var forEach = require('co-foreach');

module.exports = {
  summary: 'restore initial roles/privileges',
  options: {
    factory: { alias: 'f', description: 'delete all users, roles, and privileges before reset' }
  },
  description: [
    'attempts to recreate the initial roles and privileges and grant',
    'the default privilegs to the default roles.',
    'If the --factory option is set it will first delete all database information.'
  ].join(" "),
  exec: function reset(argv){
    var ctx = this;
    return new Promise(function(resolve, revoke) {
      co(function*(){
        var answer;
        if(argv.factory){
          answer = yield ctx.ask("*** ARE YOU SURE? ***\nResetting to factory will delete your data and cannot be undone (y/n): ");
          if(answer === 'y' || answer === "yes"){
            answer = yield ctx.ask("*** ARE YOU REALLY SURE? *** all of your data will be gone (y/n): ");
            if(answer === 'y' || answer === "yes"){
              yield comply.Privilege.remove({}).exec();
              yield comply.Role.remove({}).exec();
              yield comply.User.remove({}).exec();
            } else {
              throw new Error('user canceled operation');
            }
          } else {
            throw new Error('user canceled operation');
          }
        }
        yield forEach([
          { name: "login", description: "user is active" },
          { name: "grant", description: "grant privileges to users and roles" },
          { name: "assign", description: "assign roles to users" },
          { name: "read-privileges", description: "list privileges and privilege details" },
          { name: "read-roles", description: "list roles and role details" },
          { name: "read-users", description: "list users and user details" },
          { name: "write-privileges", description: "create, edit, and delete privileges" },
          { name: "write-roles", description: "create, edit, and delete roles" },
          { name: "write-users", description: "create, edit, and delete users" }
        ], function *(item) {
          try{
            var privilege = yield comply.createPrivilege({
              name: item.name,
              description: item.description
            })();
            ctx.stdout('createPrivilege: ' + privilege.name);
          } catch(err){
            ctx.stderr(err);
          }
        });
        yield forEach([
          {
            name: "staff",
            privileges: [
              "read-privileges",
              "read-roles",
              "read-users"
            ]
          },
          {
            name: "admin",
            privileges: [
              "grant",
              "assign",
              "read-privileges",
              "read-roles",
              "read-users",
              "write-privileges",
              "write-roles",
              "write-users"
            ]
          }
        ], function *(item) {
          try{
            var role = yield comply.createRole({ name:item.name });
            ctx.stdout('createRole: ' + role.name);
          } catch(err){
            ctx.stderr(err);
          }
          if(Object.prototype.toString.call(item.privileges) === '[object Array]'){
            yield forEach(item.privileges, function *(name) {
               try{
                  var result = yield comply.grantRole({
                    role: item.name,
                    privilege: name
                  });
                  ctx.stdout('grantRole: ' + result.privilege.name + ' privilege to role ' + result.role.name);
                } catch(err){
                  ctx.stderr(err);
                }
            });
          }
        });

        if(argv.factory){
          answer = yield ctx.ask("do you want to create a new admin user? (y/n)");
          if(answer === 'y' || answer === "yes"){
            var username = yield ctx.ask("username: ");
            yield require('./create').exec.call(ctx, {_:[], users: [username], assign: ['admin'], grant: ['login'] });
          }
        }

      }).then(resolve).catch(revoke);
    });
  }
};