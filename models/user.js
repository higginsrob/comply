var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Promise = require('promise');
var validator = require('validator');
var bCrypt = require('bcrypt-nodejs');
var config = require('../config');

var userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    required: 'username is required',
    validate: [
      /^[a-z0-9_]+$/,
      'username must only contain lowercase letters, numbers and underscores'
    ]
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    required: 'email is required'
  },
  passwordhash: { type: String, required: 'password is required' },
  roles: [{ type : mongoose.Schema.Types.ObjectId, ref: 'Role' }],
  privileges: [{ type : mongoose.Schema.Types.ObjectId, ref: 'Privilege' }]
});

userSchema.plugin(uniqueValidator, {
  message: 'expected {PATH} to be unique, "{VALUE}" already exists'
});

userSchema.path('username').validate(function (value) {
  return /^(.){3,15}$/.test(value);
}, 'username must be 3 to 15 characters long');

userSchema.path('email').validate(function (value) {
  if (!validator.isEmail(value)) {
    this.invalidate('email', 'email must be a valid email address');
  }
}, null);

userSchema.virtual('password')
  .set(function(value) {
    this._password = value;
    this.passwordhash = bCrypt.hashSync(value, bCrypt.genSaltSync(10), null);
  });

userSchema.path('passwordhash').validate(function(value){
  if (this._password){
    if (!validator.isLength(this._password, 6, 64)) {
      this.invalidate('password', 'password must be between 6 and 64 characters');
    }
  }
}, null);

userSchema.methods.validatePassword = function(password){
  return bCrypt.compareSync(password, this.passwordhash);
};

userSchema.methods.savePromise = function() {
  var self = this;
  return new Promise(function(resolve, revoke) {
    self.save(function(err){
      if(err) return revoke(err);
      resolve(self);
    });
  });
};

module.exports = config.db_connection.model('User', userSchema);