var comply = require('../');
var ObjectId = require('mongoose').Types.ObjectId;

module.exports = function listUsers(obj){
  return function *listUsers(){
    if(Object.prototype.toString.call(obj) !== '[object Object]') obj = {};
    var criteria = {};
    if(obj.username) criteria.username = new RegExp(obj.username, 'i');
    if(obj.email) criteria.email = new RegExp(obj.email, 'i');
    if(obj.role){
      yield comply.Role.findOne({ name: new RegExp(obj.role, 'i')})
      .lean()
      .select('_id')
      .exec()
      .then(function(role){ if(role) { criteria.roles = role._id }});
    }
    if(obj.privilege){
      yield comply.Privilege.findOne({ name: new RegExp(obj.privilege, 'i')})
      .lean()
      .select('_id')
      .exec()
      .then(function(privilege){ if(privilege) { criteria.privileges = privilege._id }});
    }
    if(obj.any){
      criteria.$or = [
        { username: new RegExp(obj.any, 'i')},
        { email: new RegExp(obj.any, 'i')}
      ];
      yield comply.Role.findOne({ name: new RegExp(obj.any, 'i')})
      .lean()
      .select('_id')
      .exec()
      .then(function(role){ if(role) { criteria.$or.push({ roles: role._id })}});
      yield comply.Privilege.findOne({ name: new RegExp(obj.any, 'i')})
      .lean()
      .select('_id')
      .exec()
      .then(function(privilege){ if(privilege) { criteria.$or.push({ privileges: privilege._id })}});
    }
    obj.total = yield comply.User.count(criteria).exec().then(
      function(total){ return total; },
      function(err){ throw err; }
    );
    if(!obj.limit || obj.limit < 1){ obj.limit = 100; }
    else { obj.limit = Number(obj.limit); }
    obj.pages = Math.ceil(obj.total / obj.limit);
    obj.page = Number(obj.page || 1);
    if(obj.page < 1){ obj.page = 1; }
    if(obj.page > obj.pages) { obj.page = obj.pages }
    var skip = Math.max((obj.page - 1) * obj.limit, 0);
    obj.sort = obj.sort || "username";
    return yield comply.User.find(criteria)
    .lean()
    .sort(obj.sort)
    .select("-passwordhash -__v")
    .populate({
      path: 'roles privileges',
      select: '-_id',
      options: {
        sort: 'name'
      }
    })
    .limit(obj.limit)
    .skip(skip)
    .exec()
    .then(
      function(list){
        obj.list = list;
        return obj;
      },
      function(err){ throw err }
    );
  };
};