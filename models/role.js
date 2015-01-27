var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Promise = require('promise');
var config = require('../config');

var roleSchema = mongoose.Schema({
	name: {
	  type: String,
	  trim: true,
	  lowercase: true,
	  unique: true,
	  required: 'role name is required',
    validate: [
      /^[a-z0-9_-]+$/,
      'role name must only contain lowercase letters, dashes, underscores, and numbers'
    ]
	},
  privileges: [{ type : mongoose.Schema.Types.ObjectId, ref: 'Privilege'}]
});

roleSchema.plugin(uniqueValidator, {
  message: 'expected role name to be unique, "{VALUE}" already exists'
});

roleSchema.path('name').validate(function (value) {
  return /^(.){1,64}$/.test(value);
}, 'role name must be 1 to 64 characters long');

roleSchema.methods.savePromise = function() {
  var self = this;
  return new Promise(function(resolve, revoke) {
    self.save(function(err){
      if(err) return revoke(err);
      resolve(self);
    });
  });
};

module.exports = config.db_connection.model('Role', roleSchema);