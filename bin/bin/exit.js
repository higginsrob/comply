var Promise = require('promise');

module.exports = {
  summary: 'exit comply shell',
  description: [
    'Exit comply shell with the exit status of the last command executed.',
    'This command is only useful when executing commands in',
    'complys interactive shell'
  ],
  exec: function exit(argv){
    var ctx = this;
    return new Promise(function(resolve, revoke) {
      resolve(process.exit(argv._[0] || ctx.status));
    });
  }
};