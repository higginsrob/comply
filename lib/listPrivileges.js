var comply = require('../');
var ObjectId = require('mongoose').Types.ObjectId;

module.exports = function listPrivileges(obj){
  return function *listPrivileges(){
    if(Object.prototype.toString.call(obj) !== '[object Object]') obj = {};
    var criteria = {};
    if(obj.id) {
      try{
      var id = new ObjectId(obj.id);
      criteria._id = id;
      } catch(err){}
    }
    if(obj.name) criteria.name = new RegExp(obj.name, 'i');
    if(obj.any){
      criteria.$or = [
        { name: new RegExp(obj.any, 'i') }
      ];
      if(obj.any.length > 11){
        try{
          var any_id = new ObjectId(obj.any);
          criteria.$or.push({_id: new ObjectId(any_id)});
        } catch(err){}
      }
    }
    obj.total = yield comply.Privilege.count(criteria).exec().then(
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
    return yield comply.Privilege.find(criteria)
    .lean()
    .sort(obj.sort)
    .select("-__v")
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