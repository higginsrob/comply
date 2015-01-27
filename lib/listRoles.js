var comply = require('../');

module.exports = function listRoles(obj){
  return function *listRoles(){
    if(Object.prototype.toString.call(obj) !== '[object Object]') obj = {};
    var criteria = {};
    if(obj.name) criteria.name = new RegExp(obj.name, 'i');
    if(obj.privilege){
      yield comply.Privilege.findOne({ name: new RegExp(obj.privilege, 'i')})
      .lean()
      .select('_id')
      .exec()
      .then(function(privilege){ if(privilege) { criteria.privileges = privilege._id }});
    }
    if(obj.any){
      criteria.$or = [
        { name: new RegExp(obj.any, 'i')}
      ];
      yield comply.Privilege.findOne({ name: new RegExp(obj.any, 'i')})
      .lean()
      .select('_id')
      .exec()
      .then(function(privilege){ if(privilege) { criteria.$or.push({ privileges: privilege._id })}});
    }
    obj.total = yield comply.Role.count(criteria).exec().then(
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
    obj.sort = obj.sort || "name";
    return yield comply.Role.find(criteria)
    .lean()
    .sort(obj.sort)
    .select("-__v")
    .populate({
      path: 'privileges',
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