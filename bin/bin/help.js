var fs = require('fs');
var Promise = require('promise');
var cliff = require('cliff');

module.exports = {
  summary: 'display this help page',
  description: [
    'Display a short summary of commands.',
  ],
  exec: function(argv){
    var ctx = this;
    if(argv._[0]) {
      return require('./man').exec.call(ctx, argv);
    } else {
      return new Promise(function(resolve, revoke) {
        var rows = [];
        var cmds = {};
        fs.readdirSync(__dirname).forEach(function(file){
          cmds[file.split(".").shift()] = require('./' + file);
        });
        Object.keys(cmds).forEach(function(key){
          rows.push([key, cmds[key].summary]);
        });
        resolve(cliff.stringifyRows(rows));
      });
    }
  }
};
