The comply node.js module aims to become a useful starting point when building user based apps in Koa. It is implemented as both Koa middleware and as a command line interface.  Koa Middleware controls the authentication and authorization flow of your app, while the cli allows administration of the database independent of the web server.

The comply module exports multiple functions (this readme document will refer to them as Public Functions).  Complys main export function wrapps all of its public functions within koa middleware.  This allows you to use the same building blocks in multiple ways, be it middleware, the cli, or your custom functions.

<a id="top"></a>

# TOC
* [Install](#install)
* [Command Line Usage](#command-line-usage)
  * [shell](#shell)
  * [help](#help)
  * [man](#man)
* [Koa Middleware Usage](#koa-middleware-usage)
  * [comply(_string_, _object_)](#comply)
  * [comply('authenticate')](#comply-authenticate)
  * [examples](#koa-middleware-examples):
    * [comply('authorize', _privileges_)](#comply-authorize)
    * [comply('login')](#comply-login)
    * [comply('logout')](#comply-logout)
* [Public Functions](#public-functions)
  * [comply.assign(obj)](#assign)
  * [comply.createPrivilege(obj)](#createPrivilege)
  * [comply.createRole(obj)](#createRole)
  * [comply.createUser(obj)](#createUser)
  * [comply.grantUser(obj)](#grantUser)
  * [comply.grantRole(obj)](#grantRole)
  * [comply.listPrivileges(obj)](#listPrivileges)
  * [comply.listRoles(obj)](#listRoles)
  * [comply.listUsers(obj)](#listUsers)
  * [comply.removePrivilege(obj)](#removePrivilege)
  * [comply.removeRole(obj)](#removeRole)
  * [comply.removeUser(obj)](#removeUser)
  * [comply.revokeRole(obj)](#revokeRole)
  * [comply.revokeUser(obj)](#revokeUser)
  * [comply.unassign(obj)](#unassign)
* [Mongoose Models](#mongoose-models)
  * [comply.User](#mongoose-user)
  * [comply.Role](#mongoose-role)
  * [comply.Privilege](#mongoose-privilege)

<a id="install"></a>

[↑](#top)

# Install

npm install comply --save

<a id="command-line-usage"></a>

[↑](#top)

# Command Line Usage

You can set the mongoDB url with the environment variable 'DATABASE\_URL', this can be useful when managing multiple projects on the same computer. Otherwise the mongoDB url will be set to mongodb://localhost/default.

To call individual comply commands (not using the comply shell):
> $ comply [command] [arguments...]

<a id="shell"></a>

[↑](#top)

## shell

Calling 'comply' in your terminal will open the comply shell.  The shell has bash like commands 'clear', 'exit', 'help', 'man', and uses its own history.

```shell
$ comply
Comply version 1.0.0
Connected to: mongodb://localhost/default
>
```

<a id="help"></a>

[↑](#top)

## help

Use the 'help' command to list available commands with a short summary.

```shell
$ comply help
assign   assign roles to users
clear    clear terminal screen
create   create new privileges, roles, and users
exit     exit comply shell
find     list privileges, roles, or users
grant    grant privileges to roles and users
help     display this help page
man      show help manual
remove   delete roles, privileges, and users
reset    restore initial roles/privileges
revoke   revoke privileges from roles and users
show     display privileges, roles, and/or users
unassign unassign roles from users

```

<a id="man"></a>

[↑](#top)

## man

Use the 'man' command to display manual pages.  They will open in a pager for easy navigation.  less is the default pager but you can specify a different one with the "--pager" option.

example:

```
$ comply man find
FIND(1)                      Comply Manual                      FIND(1)

NAME
      find - list privileges, roles, or users

SYNOPSIS
      find [--help] [--email PATTERN]
           [--username PATTERN]
           [--role PATTERN]
           [--privilege PATTERN]
           [--name PATTERN]
           [--description PATTERN]
           [--limit NUMBER] [--skip NUMBER]
           [--sort KEY] [TYPE]
           [SEARCH]

DESCRIPTION
      List privileges, roles, or users, and filter results by searching
      individual database fields, or by searching all fields at once
      using the "SEARCH" argument.  You control what kind of list you
      are creating with the "TYPE" argument, it can be one of:
      privilege/privileges, role/roles, or user/users. TYPE can be
      written singular or plural (user/users) and will make no
      difference. If you do not specify TYPE the list defaults to users.

      -e, --email PATTERN
             filter users by email

      -u, --username PATTERN
             filter users by username

      -r, --role PATTERN
             filter users by roles names

      -p, --privilege PATTERN
             filter roles and users by privileges names

      -n, --name PATTERN
             filter roles and privileges by name

      -d, --description PATTERN
             filter privileges by description

      -l, --limit NUMBER
             limit to NUMBER results (default is 100)

      -s, --skip NUMBER
             skip first NUMBER results, use with limit to page your
             results into sets.

      -k, --sort KEY
             sort fileds by KEY. User lists default to username, roles
             and privileges default to name

EXAMPLES
      find
      find roles -p privilege_a
      find role -n role_a
      find privileges -d "some text"
      find users -u a_username
      find user -e email@address.com

FIND(1)                      Comply Manual                      FIND(1)

(END)
```

<a id="koa-middleware-usage"></a>

[↑](#top)

# Koa Middleware Usage

```javascript
var comply = require('comply');
```

The examples below are using a router and a template renderer.  You will need to be familiar with how [koa](http://koajs.com/) processes middleware, as well as how  [koa-router](https://github.com/alexmingoia/koa-router) routes requests.

<a id="comply"></a>

[↑](#top)

## comply(_string_, _object_)

The main comply method wraps its public functions into koa middleware. It accepts two arguments, a string (the name of the function it will wrap), and an optional object. If comply() method succeeds it sets context.state.result to the return value of the wrapped function.  If context.request.body is not already set and the request method is POST, then comply will attempt to parse POST form data into the context.request.body object. if _object_ is specified it will be merged into the context.request.body object, overriding any request body parameters already set. context.request.body will be called as the wrapped functions _obj_ parameter.

<a id="comply-authenticate"></a>

[↑](#top)

## comply('authenticate')

This middleware will check the session for a user id. If ctx.session.uid exists it will search mongoDB for that user, and if found, it converts the found mongoose document into a plain object.  This user object is stripped of the 'passwordhash', 'roles', and '__v' fields. The "privileges" field is populated with the users privileges, including all of the privileges assigned to the users roles.  The 'roles' field is not returned, because you should not be validating a user based on their role, your functions and templates downstream should authorize your user based solely on their privileges.

The example below calls comply('authenticate') before mounting any routers. You don't have to put this middleware before your router, but if you do then your user object will be available in all middleware downstream (ctx.state.user). You do have to put this middleware after your session middleware as it uses the session variable 'uid' to keep track of the logged in user.

in server.js:

```javascript
var koa = require('koa');
var session = require('koa-session');
var views = require('koa-views');
var mount = require('koa-mount');
var routes = require('./routes');
var comply = require('comply');

var app = koa();

... other koa middleware ...

// template render is used in examples below
app.use(views('./views', { "default": 'jade' }));

// there are multiple session modules to choose from,
// this example is using a cookie based session store, but you
// could just as easily be using mongoDB, redis, levelDB etc..

app.keys = ['some secret key here'];
app.use(session(app));

... other koa middleware ...

// authenticate the user if context.session.uid exists
app.use(comply('authenticate'));

// use a koa router
app.use(mount('/', routes.middleware()))

```

<a id="koa-middleware-examples"></a>

### * _all koa middleware examples below are assumed to be in a module named ./routes.js_

routes.js:
```javascript
var Router = require('koa-router');
var router = module.exports = new Router();
var comply = require('comply');

```

_There are only a few middleware examples shown here (login, logout, authorize), the rest of the public functions would be set up identical to the [login](#comply-login) example_


<a id="comply-login"></a>

[↑](#top)

## comply('login')

In this example the router is accepting a POST request (whose formdata is populating the public comply.login functions _obj_ variable). It sets an error handler that will render the '/login' template if login fails, and redirect to '/profile' if login succeeds.

```javascript
router.post('/login',

  // catch errors
  function *(next){
    try{ yield next; }
    catch(err){
      yield this.render('/login', {
        warning: err.message
      });
    }
  },

  comply('login'),

  // success
  function *(){
    this.redirect('/profile');
  }

);
```

<a id="comply-logout"></a>

[↑](#top)

## comply('logout')

In this example logout deletes context.session.uid and context.state.user so that future middleware and requests will not be authorized.

```javascript
router.get('/logout',

  comply('logout'),

  function *(){
    this.redirect('/login');
  }

);
```

<a id="comply-authorize"></a>

[↑](#top)

## comply('authorize', _privileges_)

This middleware restricts access to resources downstream.  The 'privileges' argument can either be a string or an array of strings. It will check that a user is authenticated and has every privilege specified, or it will throw an error.  If the user does have all specified privileges it will pass off the request to the next middleware. If comply('authenticate') has not already been called upstream it will first run comply.authenticate(ctx).

This example sets an error handler that will redirect to '/login' if authorization fails, and render the 'profile' template if authorization succeeds.

```javascript
router.get('/profile',

  function *(next) {
    // catch errors
    try { yield next; }
    catch(err) {
      console.log(err);
      this.redirect('/login');
    }
  },

  comply('authorize', 'login'),

  // success
  function *(next){
    yield this.render('profile', {
      title: 'profile',
      message: 'yay I\'m logged in!'
    });
  }

);
```

---

<a id="public-functions"></a>

[↑](#top)

# Public Functions

All of Complys public functions are written as generators, this means you must use a flow control library like [co](https://github.com/tj/co) to use them directly.  They can be used as-is inside koa middleware because koa uses co to process middleware.  The most common use of these functions will be wrapped in the main comply function (see [comply(_string_, _object_)](#comply)), doing so will convert the function into middleware and automatically parse POST request parameters into the wrapped function.

Generators can be used to execute multiple asynchronous functions in a more elegant way, without callbacks.  Using asynchronous callbacks inside loops require async libraries and more complexity.  The beauty of generators in co is that you can throw errors anywhere in your asynchronous code, it will stop executing and bubble the error up the stack until it is handled. This gives you much more control over how you handle errors.  You can use 'then' and 'catch' functions of co to control the outcome of a block of code, and try/catch blocks inside co to handle individual yields.

example using comply public functions outside of koa middleware:

```javascript
var co = require('co');

co(function *(){

  yield comply.removeRole({
    name: 'a_role'
  });

  // if 'a_role' doesn't exist execution stops
  // here and co's catch function will call the
  // "revoke" function that is specified

  try{
    yield comply.removeRole({
      name: 'b_role'
    });
  } catch(error){
    // if 'b_role' doesn't exist you could silence
    // the error here and continue executing,
    // but instead we will throw an error
    // with a different error message
    throw new Error('b_role does not exist, but a_role was deleted!')
  }

  return 'you have deleted both a_role and b_role';

}).then(resolve).catch(revoke);

```

<a id="assign"></a>

[↑](#top)

## comply.assign(_obj_)

_assign a role to a user_

required:

* obj.user - can be string or object
  * _string_ username or email
  * _object_ at least one:
    * obj.user.username
    * obj.user.email
    * obj.user.id
* obj.role - can be string or object
  * _string_ role name
  * _object_ at least one:
    * obj.role.name
    * obj.role.id

example:
```javascript
var result = yield comply.assign({
  user: 'temp_user',
  role: 'temp_role'
});

```
result:
```javascript
result = {
  role: [mongoose document],
  user: [mongoose document]
}
```

<a id="createPrivilege"></a>

[↑](#top)

## comply.createPrivilege(_obj_)

_create a new privilege_

required:

* obj.name (_string_)

optional:

* obj.description (_string_)

example:
```javascript
var privilege = yield comply.createPrivilege({
  name: 'temp_privilege',
  description: 'a temporary privilege'
});

```
result:
```javascript
result = [mongoose document]
```

<a id="createRole"></a>

[↑](#top)

## comply.createRole(_obj_)

_create a new role_

required:

* obj.name (_string_)

example:
```javascript
var role = yield comply.createRole({
  name: 'temp_role'
});

```
result:
```javascript
result = [mongoose document]
```

<a id="createUser"></a>

[↑](#top)

## comply.createUser(_obj_)

_create a new user_

required:

* obj.username (_string_)
* obj.email (_string_)
* obj.password (_string_)
* obj.passwordconfirmation (_string_)

example:
```javascript
var user = yield comply.createUser({
  username: 'temp_user',
  email: 'temp_user@example.com',
  password:'testing123',
  passwordconfirmation:'testing123'
});

// passwordconfirmation is required because
// createUser will most likely be called
// as middleware using POST parameters.

```
result:
```javascript
result = [mongoose document]
```

<a id="grantUser"></a>

[↑](#top)

## comply.grantUser(_obj_)

_grant a privilege to a user_

required:

* obj.user - can be string or object
  * _string_ username or email
  * _object_ at least one:
    * obj.user.username
    * obj.user.email
    * obj.user.id
* obj.privilege - can be string or object
  * _string_ privilege name
  * _object_ at least one:
    * obj.privilege.name
    * obj.privilege.id

example:
```javascript
var result = yield comply.grantUser({
  user: 'temp_user',
  privilege: 'temp_privilege'
});

```
result:
```javascript
result = {
  privilege: [mongoose document],
  user: [mongoose document]
}
```

<a id="grantRole"></a>

[↑](#top)

## comply.grantRole(_obj_)

_grant a privilege to a role_

required:

* obj.role - can be string or object
  * _string_ role name
  * _object_ at least one:
    * obj.role.name
    * obj.role.id
* obj.privilege - can be string or object
  * _string_ privilege name
  * _object_ at least one:
    * obj.privilege.name
    * obj.privilege.id

example:
```javascript
var result = yield comply.grantRole({
  role: 'temp_role',
  privilege: 'temp_privilege'
});

```
result:
```javascript
result = {
  privilege: [mongoose document],
  role: [mongoose document]
}
```

<a id="listPrivileges"></a>

[↑](#top)

## comply.listPrivileges(_obj_)

search criteria (optional):

  * obj.name (_string_) - filter results by pattern matching privilege names
  * obj.description (_string_) - filter results by pattern matching privilege descriptions
  * obj.any (_string_) - filter results by pattern matching either privilege names or descriptions
  * obj.limit (_number_) - limit results to _number_ results (default is 100)
  * obj.skip (_number_) - skip first _number_ results
  * obj.sort (_string_) - sort results by keywords (default is 'name')

example:
```javascript
var result = yield comply.listPrivileges();
```
result:
```javascript
result = {
  name: obj.name,
  description: obj.description,
  any: obj.any,
  total: [number of total documents found matching criteria],
  limit: obj.limit,
  pages: [total number of pages sent, determined by limit and total],
  page: [current page, determined by pages and skip],
  sort: obj.sort,
  list: [array of results]
}


```

<a id="listRoles"></a>

[↑](#top)

## comply.listRoles(_obj_)

search criteria (optional):

  * obj.name (_string_) - filter results by pattern matching role names
  * obj.privilege (_string_) - filter results by pattern matching role privileges names
  * obj.any (_string_) - filter results by pattern matching either role name or role privileges names
  * obj.limit (_number_) - limit results to _number_ results (default is 100)
  * obj.skip (_number_) - skip first _number_ results
  * obj.sort (_string_) - sort results by keywords (default is 'name')

example:
```javascript
var result = yield comply.listRoles();
```
result:
```javascript
result = {
  name: obj.name,
  privilege: obj.privilege,
  any: obj.any,
  total: [number of total documents found matching criteria],
  limit: obj.limit,
  pages: [total number of pages sent, determined by limit and total],
  page: [current page, determined by pages and skip],
  sort: obj.sort,
  list: [array of results]
}
```

<a id="listUsers"></a>

[↑](#top)

## comply.listUsers(_obj_)

search criteria (optional):

  * obj.username (_string_) - filter results by pattern matching username
  * obj.email (_string_) - filter results by pattern matching email address
  * obj.privilege (_string_) - filter results by pattern matching user privileges
  * obj.role (_string_) - filter results by pattern matching user roles names
  * obj.any (_string_) - filter results by pattern matching any of the previous fields
  * obj.limit (_number_) - limit results to _number_ results (default is 100)
  * obj.skip (_number_) - skip first _number_ results
  * obj.sort (_string_) - sort results by keywords (default is 'username')

example:
```javascript
var result = yield comply.listUsers();
```
result:
```javascript
result = {
  username: obj.username,
  email: obj.username,
  privilege: obj.privilege,
  role: obj.role,
  any: obj.any,
  total: [number of total documents found matching criteria],
  limit: obj.limit,
  pages: [total number of pages sent, determined by limit and total],
  page: [current page, determined by pages and skip],
  sort: obj.sort,
  list: [array of results]
}
```

<a id="removePrivilege"></a>

[↑](#top)

## comply.removePrivilege(_obj_)

_delete a privilege_

required at least one of:

* obj.name (_string_)
* obj.id (_string_)

example:
```javascript
var privilege = yield comply.removePrivilege({
  name: 'temp_privilege'
});

```
result:
```javascript
result = [mongoose document]
```

<a id="removeRole"></a>

[↑](#top)

## comply.removeRole(_obj_)

_delete a role_

required at least one of:

* obj.name (_string_)
* obj.id (_string_)

example:
```javascript
var role = yield comply.removeRole({
  name: 'temp_role'
});

```
result:
```javascript
result = [mongoose document]
```

<a id="removeUser"></a>

[↑](#top)

## comply.removeUser(_obj_)

_delete a user_

required at least one of:

* obj.user (_string_) username or email
* obj.username (_string_)
* obj.email (_string_)
* obj.id (_string_)

example:
```javascript
var user = yield comply.removeUser({
  user: 'temp_user'
});

```
result:
```javascript
result = [mongoose document]
```

<a id="revokeRole"></a>

[↑](#top)

## comply.revokeRole(_obj_)

_revoke a privilege from a role_

required:

* obj.role - can be string or object
  * _string_ role name
  * _object_ at least one:
    * obj.role.name
    * obj.role.id
* obj.privilege - can be string or object
  * _string_ privilege name
  * _object_ at least one:
    * obj.privilege.name
    * obj.privilege.id

example:
```javascript
var result = yield comply.revokeRole({
  role: 'temp_role',
  privilege: 'temp_privilege'
});

```
result:
```javascript
result = {
  privilege: [mongoose document],
  role: [mongoose document]
}
```

<a id="revokeUser"></a>

[↑](#top)

## comply.revokeUser(_obj_)

_revoke a privilege from a user_

required:

* obj.user - can be string or object
  * _string_ username or email
  * _object_ at least one:
    * obj.user.username
    * obj.user.email
    * obj.user.id
* obj.privilege - can be string or object
  * _string_ privilege name
  * _object_ at least one:
    * obj.privilege.name
    * obj.privilege.id

example:
```javascript
var result = yield comply.revokeUser({
  user: 'temp_user',
  privilege: 'temp_privilege'
});

```
result:
```javascript
result = {
  privilege: [mongoose document],
  user: [mongoose document]
}
```

<a id="unassign"></a>

[↑](#top)

## comply.unassign(_obj_)

_unassign a role from a user_

required:

* obj.user - can be string or object
  * _string_ username or email
  * _object_ at least one:
    * obj.user.username
    * obj.user.email
    * obj.user.id
* obj.role - can be string or object
  * _string_ role name
  * _object_ at least one:
    * obj.role.name
    * obj.role.id

example:
```javascript
var result = yield comply.unassign({
  user: 'temp_user',
  role: 'temp_role'
});

```
result:
```javascript
result = {
  role: [mongoose document],
  user: [mongoose document]
}
```

---
<a id="mongoose-models"></a>

## Mongoose models

The following is for advanced users and gives access to the user, role, and privilege mongoose models.  This will allow you to manually create, query, update, and remove documents (users, roles, and privileges) from mongoDB.  Learn more about mongoose models at http://mongoosejs.com/docs/models.html


<a id="mongoose-user"></a>

[↑](#top)

## comply.User

The user model has the following schema:

```javascript
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
```
* you do not set passwordhash directly, rather you set the virtual path 'password', and the schema validator automatically creates a bCrypt hash for you, the password is never saved in plain text.
* roles and privileges are arrays that link to mongoDB collections.

__validation__

* username, email, and passwordhash (password) are required.
* username must be 3 to 15 alphanumeric characters and allows underscores.
* email must be a valid email address.
* password must be 6 to 64 characters.


```javascript
// new user example:

var user = new comply.User({
  username: 'myusername',
  email: 'my@email.com',
  password: 'apassword'
});

user.save(function(err, user){
  // ... handle error
});
```
Also added to the schema is a promise based save method:

```javascript
user.savePromise().then(
  function(item) { /* success */ },
  function(err) { /* error */ }
);
```

<a id="mongoose-role"></a>

[↑](#top)

## comply.Role

The role model has the following schema:

```javascript
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
```
__validation__

* name is required.
* name must be 1 to 64 alphanumeric characters and allows underscores and dashes.

```javascript
// new role example:

var role = new comply.Role({
  name: 'myrole'
});

role.save(function(err, user){
  // ... handle error
});
```
Also added to the schema is a promise based save method:

```javascript
role.savePromise().then(
  function(item) { /* success */ },
  function(err) { /* error */ }
);
```

<a id="mongoose-privilege"></a>

[↑](#top)

## comply.Privilege

The privilege model has the following schema:

```javascript
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
```

__validation__

* name is required.
* name must be 1 to 64 alphanumeric characters and allows underscores and dashes.
* description is optional

```javascript
// new privilege example:

var privilege = new comply.Privilege({
  name: 'myprivilege',
  description: 'this is an optional description'
});

privilege.save(function(err, user){
  // ... handle error
});
```
Also added to the schema is a promise based save method:

```javascript
privilege.savePromise().then(
  function(item) { /* success */ },
  function(err) { /* error */ }
);
```

##### Author Rob Higgins © 2015