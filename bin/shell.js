#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var Promise = require('promise');
var minimist = require('minimist');
var stringArgv = require('string-argv').parseArgsStringToArgv;
var comply = require('../');
var mongoose = require('mongoose');
var colors = require('colors/safe');

var ps1 = "> ";
var prompt_string;
var is_subcommand = false;

var history = [''];
var history_index = 0;

var readline = function(mask, saveHistory) {
  return new Promise(function(resolve) {
    var stdin = '';
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.setRawMode(true);
    var temp, index = 0;
    var onread = function(chunk) {
      process.stdin.pause();
      if(chunk.indexOf("\u0003") > -1){ // SIGINT
        process.stdout.write("\n");
        process.exit(1);
      } else if(chunk.indexOf("\u007F") > -1){ // delete key
        if(index > 0){
          temp = stdin.substr(0, index-1);
          stdin = temp + stdin.substr(index);
          index--;
        }
      } else if(chunk.indexOf("\033[A") > -1){ // up key
        if(saveHistory && !mask && typeof history[history_index - 1] !== 'undefined'){
          history_index--;
          stdin = history[history_index];
          index = stdin.length;
        }
      } else if(chunk.indexOf("\033[B") > -1){ // down key
        if(saveHistory && !mask && typeof history[history_index + 1] !== 'undefined'){
          history_index ++;
          stdin = history[history_index];
          index = stdin.length;
        }
      } else if(chunk.indexOf("\033[C") > -1){ // right key
        if(index < stdin.length){ index++; }
      } else if(chunk.indexOf("\033[D") > -1){ // left key
        if(index > 0){ index--; }
      } else if(chunk.indexOf("\n") > -1 ||
                chunk.indexOf("\r") > -1 ||
                chunk.indexOf("\u0004") > -1){ // enter key
        process.stdin.removeListener("data", onread);
        process.stdout.write("\n");
        process.stdin.setRawMode(false);
        if(saveHistory && !mask && stdin !== ""){
          while(history.indexOf(stdin) > -1){
            history.splice(history.indexOf(stdin), 1);
          }
          history.push(stdin);
          history.push('');
          history_index = history.length - 1;
          while(history.length > 101){ history.shift(); }
        }
        return resolve(stdin);
      } else if(/^[ -~]+$/.test(chunk)){ // printable characters
        temp = stdin.substr(0, index);
        stdin = temp + chunk + stdin.substr(index);
        index = index + chunk.length;
        if(saveHistory && !mask){
          history_index = history.length - 1;
          history[history_index] = stdin;
        }
      }
      if(mask){
        process.stdout.write("\033[2K\033[200D" + prompt_string + Array(stdin.length+1).join("*") + "\033[200D\033[" + (index + prompt_string.length) + "C");
      } else {
        process.stdout.write("\033[2K\033[200D" + prompt_string + stdin + "\033[200D\033[" + (index + prompt_string.length) + "C");
      }
      process.stdin.resume();
    };
    process.stdin.on('data', onread);
  });
};

function ask(question, mask, saveHistory){
  prompt_string = question.split("\n").pop();
  return new Promise(function(resolve, reject) {
    process.stdout.write(question);
    readline(mask, saveHistory).then(
      function(answer) {
        resolve(answer);
      }
    );
  });
}

var print_stderr = function(stderr){
  if(typeof stderr === 'string'){
    console.error(colors.yellow('Error: ' + stderr));
  } else if(Object.prototype.toString.call(stderr) === '[object Object]'){
    if (stderr.name === 'ValidationError') {
      Object.keys(stderr.errors).forEach(function(key){
        console.error(colors.yellow('Error: ' + stderr.errors[key].message));
      });
    } else {
      console.error(colors.yellow(JSON.stringify(stderr, null, 3)));
    }
  } else if(Object.prototype.toString.call(stderr) === '[object Array]'){
    stderr.forEach(function(error){
      if(typeof error === 'string'){
        console.error(colors.yellow('Error: ' + error));
      } else if(Object.prototype.toString.call(error) === '[object Object]'){
        console.error(colors.yellow(JSON.stringify(error, null, 3)));
      } else if(error !== null && error !== undefined){
        console.error(colors.yellow(error.toString()));
      }
    });
  } else if(stderr !== null && stderr !== undefined){
    console.error(colors.yellow(stderr.toString()));
  }
};

var handle_error = function(stderr){
  print_stderr(stderr);
  ctx.status = 1;
  if(is_subcommand){
    prompt();
  } else {
    process.exit(ctx.status);
  }
};

var print_stdout = function(stdout){
  if(typeof stdout === 'string'){
    console.log(stdout);
  } else if(Object.prototype.toString.call(stdout) === '[object Object]'){
    console.log(JSON.stringify(stdout, null, 3));
  } else if(Object.prototype.toString.call(stdout) === '[object Array]'){
    stdout.forEach(function(item){
      if(typeof item === 'string'){
        console.log(item);
      } else if(Object.prototype.toString.call(item) === '[object Object]'){
        console.log(JSON.stringify(item, null, 3));
      } else if(item !== null && item !== undefined){
        console.log(item.toString());
      }
    });
  } else if(stdout !== null && stdout !== undefined){
    console.log(stdout);
    console.log(stdout.toString());
  }
};

var handle_success = function(stdout){
  print_stdout(stdout);
  ctx.status = 0;
  if(is_subcommand){
    prompt();
  } else {
    process.exit(ctx.status);
  }
};

function prompt(){
  ask(ctx.state.user? ctx.state.user.username + ps1 : ps1, false, true).then(function(answer) {
    process_command(stringArgv(answer)).then(handle_success).catch(handle_error);
  });
}

var aliases = {
  c: { cmd: "clear" },
  ls: { cmd: "find" },
  lsr: { cmd: "find", _: ["roles"] },
  lsp: { cmd: "find", _: ["privileges"] },
  rm: { cmd: "remove" },
  x: { cmd: "exit" }
};

var ctx = {
  session: {},
  state: {},
  request: { body: {} },
  ask: ask,
  stderr: print_stderr,
  stdout: print_stdout,
  status: 0
};

function process_command(args){
  return new Promise(function(resolve, revoke) {
    var argv = minimist(args, {
      alias: {
        h: "help",
        v: "version"
      }
    });
    var cmd = argv._.shift();
    if(argv.help){
       require('./bin/help').exec.call(ctx, {_:[cmd]}).then(
        resolve,
        revoke
      ).catch(revoke);
    } else if(!cmd && argv.version){
      var pjson = require('../package.json');
      resolve(pjson.version);
    } else if(cmd) {
      cmd = cmd.toLowerCase();
      if(!!aliases[cmd]) {
        var temp = args.shift();
        if(aliases[cmd]._){
          args.forEach(function(item){
            aliases[cmd]._.push(item);
          });
          args = aliases[cmd]._;
          if(temp){
            args.unshift(temp);
          }
        }
        cmd = aliases[cmd].cmd;
      }
      var command;
      try{
        command = require('./bin/' + path.basename(cmd));
      } catch(err){
        throw 'command not found';
      }
      var string = [];
      var bool = [];
      var alias = {};
      var separator = command.usage? command.usage.match(/--(?=\s|$)/g) : false;
      if(command.options){
        Object.keys(command.options).forEach(function(key){
          var option = command.options[key];
          if(option.value){ string.push(key); }
          else { bool.push(key); }
          if(option.alias){ alias[option.alias] = key; }
        });
        args.shift();
        argv = minimist(args, {
          '--': separator,
          "string": string,
          "boolean": bool,
          "alias": alias,
          "unknown": function(unknown){
            if(unknown.substr(0,1) === '-'){
              throw 'unknown option: '+ unknown;
            }
          }
        });
        Object.keys(argv).forEach(function(arg){
          if(alias[arg]){
            delete argv[arg];
          } else {
            if(command.options[arg]){
              if(command.options[arg].value && !argv[arg].length){
                throw 'missing required option argument: --' + arg;
              }
              if(command.options[arg].value && command.options[arg].value.indexOf("...") > -1){
                var array = [];
                if(Object.prototype.toString.call(argv[arg]) === '[object Array]'){
                  argv[arg].forEach(function(item){
                    item.split(/[,|\s]+/).forEach(function(item){
                      if(array.indexOf(item) < 0){
                        array.push(item);
                      }
                    });
                  });
                } else if(typeof argv[arg] === 'string'){
                  argv[arg].split(/[,|\s]+/).forEach(function(item){
                    if(array.indexOf(item) < 0){
                      array.push(item);
                    }
                  });
                }
                argv[arg] = array;
              }
              if(Object.prototype.toString.call(argv[arg]) === '[object Array]'){
                argv[arg] = argv[arg].filter(function(item){
                  return typeof item === 'string' && item !== '';
                });
              }
            }
          }
        });
      }
      command.exec.call(ctx, argv).then(resolve).catch(revoke);
    } else {
      if(is_subcommand){
        prompt();
      } else {
        throw 'command empty';
      }
    }
  });
}

mongoose.connection.on('open', function(){
  var argv = minimist(process.argv.slice(2));
  if(argv._.length || argv.h || argv.help || argv.v || argv.version){
    process_command(process.argv.slice(2)).then(handle_success).catch(handle_error);
  } else {
    is_subcommand = true;
    fs.exists(__dirname + '/history.json', function (exists) {
      if(exists){
        fs.readFile(__dirname + '/history.json', function(err, data){
          if (err) throw err;
          history = JSON.parse(data);
          history_index = history.length -1;
          var version = require('../package.json').version;
          console.log('Comply version ' + version);
          console.log('Connected to: ' +  comply.config.db_url);
          prompt();
        });
      } else {
        var version = require('../package.json').version;
        console.log('Comply version ' + version);
        console.log('Connected to: ' +  comply.config.db_url);
        prompt();
      }
    });
  }
});

process.on('exit', function(code) {
  process.stdin.setRawMode(false);
  if(is_subcommand){
    history[history.length -1] = '';
    fs.writeFileSync(__dirname + '/history.json', JSON.stringify(history));
  }
  process.exit(code);
});