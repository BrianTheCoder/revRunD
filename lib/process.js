(function() {
  var Process, events, forever, util;

  forever = require('forever');

  util = require('util');

  events = require('events');

  Process = function(command, options) {
    this.id = options.id || crypto.createHash('md5').update(command).digest("hex");
    events.EventEmitter.call(this);
    this.every = function(delay, callback) {
      return this.interval = setInterval(function() {
        return callback(file);
      }, delay * 1000);
    };
    this.start = function() {
      return console.log('start');
    };
    this.restart = function() {
      return console.log('restart');
    };
    return this.stop = function() {
      return console.log('stop');
    };
  };

  util.inherits(Process, events.EventEmitter);

  exports.File = Process;

}).call(this);
