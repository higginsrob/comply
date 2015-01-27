var co = require('co');
var Promise = require('promise');
var comply = require('../../');
var cliff = require('cliff');

module.exports = {
  summary: 'list privileges, roles, or users',
  options: {
    email: { alias: 'e', value: "pattern", description: 'filter users by email' },
    username: { alias: 'u', value: "pattern", description: 'filter users by username' },
    role: { alias: 'r', value: "pattern", description: 'filter users by role name' },
    privilege: { alias: 'p', value: "pattern", description: 'filter roles and users by privilege name' },
    name: { alias: 'n', value: "pattern", description: 'filter roles and privileges by name' },
    description: { alias: 'd', value: "pattern", description: 'filter roles and privileges by description' },
    limit: { alias: 'l', value: "number", description: 'limit to NUMBER results (default is 100)' },
    skip: { alias: 's', value: "number", description: 'skip first NUMBER results, use with limit to page your results into sets.' },
    sort: { alias: 'k', value: "key", description: 'sort fields by KEY. User lists default to username, roles and privileges default to name' }
  },
  arguments: [
    'type',
    'search'
  ],
  description:[
    'List privileges, roles, or users, and filter results by searching individual database fields, or by',
    'searching all fields at once using the "SEARCH" argument.  You control what kind of list you are creating',
    'with the "TYPE" argument, it can be one of: privilege/privileges, role/roles, or user/users.',
    'TYPE can be written singular or plural (user/users) and will make no difference.',
    'If you do not specify TYPE the list defaults to users. '
  ].join(" "),
  examples: [
    'find',
    'find roles -p privilege_a',
    'find role -n role_a',
    'find privileges -d "some text"',
    'find users -u a_username',
    'find user -e email@address.com'
  ],
  exec: function find(argv){
    return new Promise(function(resolve, revoke) {
      var obj = {};
      if(argv.description){ obj.description = argv.description; }
      if(argv.email){ obj.email = argv.email; }
      if(argv.name){ obj.name = argv.name; }
      if(argv.privilege){ obj.privilege = argv.privilege; }
      if(argv.role){ obj.role = argv.role; }
      if(argv.username){ obj.username = argv.username; }
      if(argv.limit){ obj.limit = argv.limit; }
      if(argv.skip){ obj.skip = argv.skip; }
      co(function *(){
        var result;
        var list = [];
        if(argv._[0] === 'privilege' || argv._[0] === 'privileges'){
          argv._.shift();
          if(argv.sort){ obj.sort = argv.sort; } else { obj.sort = "name"; }
          if(argv._[0]){ obj.any = argv._[0]; }
          result = yield comply.listPrivileges(obj);
          if(result.list.length){
            result.list.forEach(function(item){
              list.push({
                name: item.name,
                description: item.description || ""
              });
            });
            return cliff.stringifyObjectRows(list, ['name', 'description'], ['underline']);
          } else {
            throw new Error('no privileges found');
          }
        } else if(argv._[0] === 'role' || argv._[0] === 'roles'){
          argv._.shift();
          if(argv.sort){ obj.sort = argv.sort; } else { obj.sort = "name"; }
          if(argv._[0]){ obj.any = argv._[0]; }
          result = yield comply.listRoles(obj);
          if(result.list.length){
            result.list.forEach(function(item){
              if(item.privileges.length){
                for(var i=0; i<item.privileges.length; i++){
                  if(i===0){
                    list.push({
                      name: item.name,
                      privileges: item.privileges[i].name,
                      description: item.privileges[i].description || ""
                    });
                  } else {
                    list.push({
                      name: "↑",
                      privileges: item.privileges[i].name,
                      description: item.privileges[i].description || ""
                    });
                  }
                }
              } else {
                list.push({
                  name: item.name,
                  privileges: "",
                  description: ""
                });
              }
            });
            return cliff.stringifyObjectRows(list, ['name', 'privileges', 'description'], ['underline']);
          } else {
            throw new Error('no roles found');
          }
        } else {
          if(argv._[0] === 'user' || argv._[0] === 'users'){
            argv._.shift();
          }
          if(argv.sort){ obj.sort = argv.sort; } else { obj.sort = "username"; }
          if(argv._[0]){ obj.any = argv._[0]; }
          result = yield comply.listUsers(obj);
          if(result.list.length){
            result.list.forEach(function(item){
              if(item.privileges.length || item.roles.length){
                var max = Math.max(item.privileges.length, item.roles.length);
                for(var i=0; i<max; i++){
                  var role = "---", privilege = "---";
                  if(item.roles[i]){
                    role = item.roles[i].name;
                  }
                  if(item.privileges[i]){
                    privilege = item.privileges[i].name;
                  }
                  if(i===0){
                    list.push({
                      username: item.username,
                      email: item.email,
                      roles: role,
                      privileges: privilege
                    });
                  } else {
                    list.push({
                      username: "↑",
                      email: "---",
                      roles: role,
                      privileges: privilege
                    });
                  }
                }
              } else {
                list.push({
                  username: item.username,
                  email: item.email,
                  roles: "---",
                  privileges: "---"
                });
              }
            });
            return cliff.stringifyObjectRows(list, ['username', 'email', 'privileges', 'roles'], ['underline']);
          } else {
            throw new Error('no users found');
          }
        }
      }).then(resolve).catch(revoke);
    });
  }
};