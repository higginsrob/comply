var path = require('path');
var Promise = require('promise');
var colors = require('colors/safe');
var spawn = require('child_process').spawn;

module.exports = {
  summary: 'show help manual',
  options: {
      pager: { alias: 'p', value: 'pager', description: 'Specify which pager to use. By default, man uses the less pager.'
    },
  },
  // description: [
  //   '',
  // ],
  exec: function man(argv){
    return new Promise(function(resolve, revoke) {
      try{
        var cmd = argv._.shift();
        if(!cmd) throw 'What manual page do you want?';
        var command;
        try{
          command = require('./' + path.basename(cmd));
        } catch(err){
          throw 'man page not found';
        }
        var first;
        var variadic_arguments = false;
        var variadic_option_arguments = false;
        var default_pager = argv.pager || process.env.MANPAGER || process.env.PAGER || 'less';
        var pager_args = ['-s'];
        if(default_pager === 'less'){
          pager_args.push('-R');
          pager_args.push('-P Manual page '+ cmd +'(1) line %l (press h for help or q to quit)');
        }
        process.stdin.setRawMode(true);
        var pager = spawn(default_pager, pager_args, { stdio: ['pipe', 1, 2] } );
        pager.on('exit', function (code) {
          process.stdin.setRawMode(false);
          resolve();
        });
        var print_title = function(title, max_width){
          title = title.toUpperCase() + "(1)";
          max_width = !max_width? process.stdout.columns : isNaN(max_width)? process.stdout.columns : Number(max_width);
          var length = Math.floor((max_width - (title.length * 2) - "Comply Manual".length) / 2 );
          var margin = new Array(length).join(" ");
          pager.stdin.write(title + margin + "Comply Manual" + margin + title + "\n");
          pager.stdin.write('\n');
        };
        var print = function(text, indent, max_width){
          indent = !indent? 0 : isNaN(indent)? 0 : Number(indent);
          max_width = !max_width? 1000 : isNaN(max_width)? 1000 : Number(max_width);
          var margin = new Array(indent).join(" ");
          var length = Math.min(max_width, process.stdout.columns - indent);
          if(typeof text === 'string'){ text = [text]; }
          if(Object.prototype.toString.call(text) === '[object Array]'){
            text.forEach(function(paragraph){
              if(typeof paragraph === 'string'){
                paragraph = paragraph.trim();
                while(paragraph.length > length){
                  var lastIndex = paragraph.substr(0, length).lastIndexOf(" ");
                  pager.stdin.write(margin + (paragraph.substr(0, lastIndex).trim()) + "\n");
                  paragraph = paragraph.substr(lastIndex).trim();
                }
                pager.stdin.write(margin + (paragraph.trim()) + "\n");
              }
            });
          }
        };
        print_title(cmd);
        var name;
        if(command.summary){
          name = cmd + " - " + command.summary;
        } else {
          name = cmd;
        }
        print('NAME');
        print(name, 7);
        print('');
        print('SYNOPSIS');
        var margin = cmd.length + 8;
        var synopsis = ['[--help]'];
        if(Object.prototype.toString.call(command.options) === '[object Object]'){
            Object.keys(command.options).forEach(function(key){
              if(command.options[key].value){
                var variadic = (command.options[key].value.indexOf("...") > -1);
                var option = command.options[key].value.toUpperCase();
                if(variadic){
                  variadic_option_arguments = true;
                  synopsis.push("[--" + key + ' ' + colors.underline(option.split("...")[0]) + "...]");
                } else {
                  synopsis.push("[--" + key + ' ' + colors.underline(option.split("...")[0]) + "]");
                }
              } else {
                synopsis.push("[--" + key + "]");
              }
            });
        }
        if(Object.prototype.toString.call(command.arguments) === '[object Array]'){
          command.arguments.forEach(function(arg){
            if(typeof arg === 'string'){
              var variadic = (arg.indexOf("...") > -1);
              if(variadic){
                variadic_arguments = true;
                synopsis.push("[" + colors.underline(arg.toUpperCase().split("...")[0]) + "...]");
              } else {
                synopsis.push("[" + colors.underline(arg.toUpperCase().split("...")[0]) + "]");
              }

            }
          });
        }
        first = true;
        var buffer = synopsis.shift();
        synopsis.forEach(function(option){
          if(buffer.length + option.length < process.stdout.columns - margin - 10){
            buffer += " " + option;
          } else {
            if(first){
              print(colors.underline(cmd) + " " + buffer, 7);
              first = false;
            } else {
              print(buffer, margin);
            }
            buffer = option;
          }
        });
        if(first){
          print(colors.underline(cmd) + " " + buffer, 7);
        } else {
          print(buffer, margin);
        }
        print('');
        if(command.description || command.options){
          print('DESCRIPTION');
        }
        if(command.description){
          print(command.description, 7);
          print('');
        }
        if(command.options){
          if(Object.prototype.toString.call(command.options) === '[object Object]'){
            Object.keys(command.options).forEach(function(key){
              print('');
              var option =  command.options[key].alias? '-' + command.options[key].alias + ", " : "";
              option += "--" + key;
              if(command.options[key].value){
                option += ' ' + colors.underline(command.options[key].value.toUpperCase().split("...")[0]);
                if(command.options[key].value.indexOf("...") > -1){
                  option += '...';
                }
              }
              print(option, 7);
              print(command.options[key].description, 14);
            });
          }
          print('');
        }
        if(command.examples){
          print('EXAMPLES');
          print(command.examples, 7);
          print('');
        }
        if(command.additional){
          print('ADDITIONAL INFORMATION');
          print(command.additional, 7);
          print('');
        }
        if(variadic_arguments){
          print('VARIADIC ARGUMENTS');
          print([
            'This command contains a variadic argument, meaning you can specify multiple',
            'values for the argument with "..." in its name. Multiple values are separated',
            'by spaces.  Each command can only contain one variadic argument, and it must',
            'be the last one specified.'
          ].join(" "), 7);
          print('');
        }
        if(variadic_option_arguments){
          print('VARIADIC OPTION ARGUMENTS');
          print([
            'This command contains variadic option arguments, meaning you can specify multiple',
            'values for an option argument with "..." in its name. Only a comma is allowed between',
            'values unless the group is surrounded by quotes. While in quotes you can use any',
            'number of spaces and/or commas to separate values.',
            'The three examples below are equivalent:'
          ].join(" "), 7);
          print('');
          print('example: --option one,two,three', 14),
          print('example: --option "one, two, three"', 14),
          print('example: --option one --option two --option three"', 14),
          print('');
        }
        print_title(cmd);
        pager.stdin.end();
      } catch(err){
        revoke(err);
      }
    });
  }
};