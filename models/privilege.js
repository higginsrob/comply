var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Promise = require('promise');
var config = require('../config');

var privilegeSchema = module.exports = mongoose.Schema({
	name: {
	  type: String,
	  trim: true,
	  lowercase: true,
	  unique: true,
	  required: 'privilege name is required',
    validate: [
      /^[a-z0-9_-]+$/,
      'privilege name must only contain lowercase letters, dashes, underscores, and numbers'
    ]
	},
	description: String
});

privilegeSchema.plugin(uniqueValidator, {
  message: 'expected privilege name to be unique, "{VALUE}" already exists'
});

privilegeSchema.path('name').validate(function (value) {
  return /^(.){1,64}$/.test(value);
}, 'privilege name must be 1 to 64 characters long');

privilegeSchema.path('description').validate(function (value) {
  return /^(.){0,500}$/.test(value);
}, 'description limited to 500 characters long');

privilegeSchema.methods.savePromise = function() {
  var self = this;
  return new Promise(function(resolve, revoke) {
    self.save(function(err){
      if(err) return revoke(err);
      resolve(self);
    });
  });
};

module.exports = config.db_connection.model('Privilege', privilegeSchema);