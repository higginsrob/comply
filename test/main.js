/* global describe it */

process.env.NODE_ENV = 'test';

require("co-mocha");
var mongoose = require('mongoose');
var assert = require("assert");
var comply = require("../");


describe('database:', function(){

 it('connected', function(done){
    mongoose.connection.on('open', function(){
      console.log('    ' + comply.config.db_url);
      done();
    });
  });

});

describe('create:', function(){

  it('user', function*(){
    var user = yield comply.createUser({
      username: 'temp_user',
      email: 'temp_user@example.com',
      password:'testing123',
      passwordconfirmation:'testing123'
    });
    assert.equal(user.username, 'temp_user');
    assert.equal(user.email, 'temp_user@example.com');
    assert.equal(user.password, null);
    assert.notEqual(user.passwordhash, 'testing123');
  });

  it('role', function*(){
    var role = yield comply.createRole({
      name: 'temp_role'
    });
    assert.equal(role.name, 'temp_role');
  });

  it('privilege', function*(){
    var privilege = yield comply.createPrivilege({
      name: 'temp_privilege',
      description: 'a temporary privilege'
    });
    assert.equal(privilege.name, 'temp_privilege');
    assert.equal(privilege.description, 'a temporary privilege');
  });

});

describe('assign:', function(){

  it('user a role', function*(){
    var result = yield comply.assign({
      user: 'temp_user',
      role: 'temp_role'
    });
    assert.notEqual(result.user.roles.indexOf(result.role._id), -1);
  });

});

describe('grant:', function(){

  it('role a privilege', function*(){
    var result = yield comply.grantRole({
      role: 'temp_role',
      privilege: 'temp_privilege'
    });
    assert.notEqual(result.role.privileges.indexOf(result.privilege._id), -1);
  });

  it('user a privilege', function*(){
    var result = yield comply.grantUser({
      user: 'temp_user',
      privilege: 'temp_privilege'
    });
    assert.notEqual(result.user.privileges.indexOf(result.privilege._id), -1);
  });

});

describe('auth:', function(){

  var ctx = { session:{}, state:{} };
  var user;

  it('login', function*(){
    user = yield comply.login(ctx, {
      username: 'temp_user',
      password: 'testing123'
    });
    assert.notEqual(user, null);
    assert.equal(user.username, 'temp_user');
    assert.equal(user.email, 'temp_user@example.com');
  });

  it('authenticate', function*(){
    var authenticated_user = yield comply.authenticate(ctx);
    assert.notEqual(authenticated_user, false);
    assert.equal(authenticated_user.username, 'temp_user');
    assert.equal(authenticated_user.email, 'temp_user@example.com');
    assert.equal(authenticated_user, ctx.state.user);
  });

  it('authorize', function(){
    var result = comply.authorize(ctx, 'temp_privilege');
    assert.equal(result, true);
  });

  it('authorize fail fake privilege ', function(){
    try{
      var result = comply.authorize(ctx, ['temp_privilege','this_should_fail_privilege']);
      assert.notEequal(result, true);
    } catch(err){
      assert.equal(Object.prototype.toString.call(err) , '[object Error]');
    }
  });

  it('logout', function(){
    comply.logout(ctx);
    assert.equal(ctx.session.uid, null);
    assert.equal(ctx.state.user, null);
  });

});

describe('list:', function(){

  it('users', function*(){
    var result = yield comply.listUsers();
    assert.notEqual(result.list.length, 0);
  });

  it('roles', function*(){
    var result = yield comply.listRoles();
    assert.notEqual(result.list.length, 0);
  });

  it('privileges', function*(){
    var result = yield comply.listPrivileges();
    assert.notEqual(result.list.length, 0);
  });

});

describe('revoke:', function(){

  it('role a privilege', function*(){
    var result = yield comply.revokeRole({
      role: 'temp_role',
      privilege: 'temp_privilege'
    });
    assert.equal(result.role.privileges.indexOf(result.privilege._id), -1);
  });

  it('user a privilege', function*(){
    var result = yield comply.revokeUser({
      user: 'temp_user',
      privilege: 'temp_privilege'
    });
    assert.equal(result.user.privileges.indexOf(result.privilege._id), -1);
  });

});

describe('unassign:', function(){

  it('user a role', function*(){
    var result = yield comply.unassign({
      user: 'temp_user',
      role: 'temp_role'
    });
    assert.equal(result.user.roles.indexOf(result.role._id), -1);
  });

});

describe('remove:', function(){

  it('user', function*(){
    var user = yield comply.removeUser({
      username: 'temp_user',
      email: 'temp_user@example.com'
    });
    assert.notEqual(user, null);
  });

  it('role', function*(){
    var role = yield comply.removeRole({
      name: 'temp_role'
    });
    assert.notEqual(role, null);
  });

  it('privilege', function*(){
    var privilege = yield comply.removePrivilege({
      name: 'temp_privilege'
    });
    assert.notEqual(privilege, null);
  });

});