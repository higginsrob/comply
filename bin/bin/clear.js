var Promise = require('promise');

module.exports = {
  summary: 'clear terminal screen',
  description: [
    'clears terminal screen and ignores any command-line parameters that may be present',
  ],
  exec: function(args){
    return new Promise(function(resolve, revoke) {
      process.stdout.write('\u001B[2J\u001B[0;0f');
      resolve();
    });
  }
};