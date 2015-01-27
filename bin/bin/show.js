var co = require('co');
var Promise = require('promise');
var comply = require('../../');

module.exports = {
  summary: 'display privileges, roles, and/or users',
  options: {
    roles: { alias: 'r', value: 'name...', description: 'display roles' },
    privileges: { alias: 'p', value: 'name...', description: 'display privileges' },
    users: { alias: 'u', value: 'username|email...', description: 'display users' },
    id: { alias: 'i', description: 'show database ids in results' }
  },
  description: [
    'Show database documents as json objects.  You can specify as many privileges,',
    'roles, and users as you like.'
  ],
  exec: function show(argv){
    var ctx = this;
    return new Promise(function(resolve, revoke) {
      co(function *(){
        if(!argv.roles) argv.roles = [];
        if(!argv.privileges) argv.privileges = [];
        if(!argv.users) argv.users = [];
        if(!argv.roles.length && !argv.privileges.length && !argv.users.length)
          throw 'you must specify at least one role, privilege or user';
        if(argv.roles.length){
          for(var role_index = 0; role_index < argv.roles.length; role_index++){
            try{
              var role = yield comply.Role.findOne({name: argv.roles[role_index]})
              .lean()
              .select(argv.id? "-__v" : "-__v -_id")
              .populate({
                path: 'privileges',
                select: argv.id? "-__v" : "-__v -_id",
                options: {
                  sort: 'name'
                }
              })
              .exec();
              if(!role){
                throw new Error('role not found');
              }
              ctx.stdout("role: " + JSON.stringify(role, null, 3));
            } catch(err){
              ctx.stderr(err);
            }
          }
        }
        if(argv.privileges.length){
          for(var privilege_index = 0; privilege_index < argv.privileges.length; privilege_index++){
            try{
              var privilege = yield comply.Privilege.findOne({name: argv.privileges[privilege_index]})
              .lean()
              .select(argv.id? "-__v" : "-__v -_id")
              .exec();
              if(!privilege){
                throw new Error('privilege not found');
              }
              ctx.stdout("privilege: " + JSON.stringify(privilege, null, 3));
            } catch(err){
              ctx.stderr(err);
            }
          }
        }
        if(argv.users.length){
          for(var user_index = 0; user_index < argv.users.length; user_index++){
            try{
              var criteria = {};
              if(argv.users[user_index].indexOf('@') === -1){ criteria.username = argv.users[user_index]; }
              else { criteria.email = argv.users[user_index]; }
              var user = yield comply.User.findOne(criteria)
              .lean()
              .select(argv.id? "-__v -passwordhash" : "-__v -passwordhash -_id")
              .populate({
                path: 'roles privileges',
                select: argv.id? "-__v" : "-__v -_id",
                options: {
                  sort: 'name'
                }
              })
              .exec();
              if(!user){
                throw new Error('user not found');
              }
              for(var rIndex = 0; rIndex < user.roles.length; rIndex++){
                for(var pIndex = 0; pIndex < user.roles[rIndex].privileges.length; pIndex++){
                  user.roles[rIndex].privileges[pIndex] = yield comply.Privilege.findById(user.roles[rIndex].privileges[pIndex])
                  .lean()
                  .select(argv.id? "-__v" : "-__v -_id")
                  .exec();
                }
                user.roles[rIndex].privileges.sort(function(a, b) { return a.name > b.name; });
              }
              ctx.stdout("user: " + JSON.stringify(user, null, 3));
            } catch(err){
              ctx.stderr(err);
            }
          }
        }
      }).then(resolve).catch(revoke);
    });
  }
};