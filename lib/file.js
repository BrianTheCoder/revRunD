(function() {
  var File, HEARTBEAT_FAILS, HEARTBEAT_PERIOD, HISTORY_LENGTH, LOG_LINEBREAK, RECONNECT_INTERVAL, STATUS_INTERVAL, crypto, events, fs, io, os, util, _;

  util = require('util');

  events = require('events');

  fs = require('fs');

  os = require('os');

  _ = require('underscore');

  io = require('socket.io-client');

  crypto = require('crypto');

  LOG_LINEBREAK = "\n";

  HISTORY_LENGTH = 100000;

  STATUS_INTERVAL = 60 * 1000;

  RECONNECT_INTERVAL = 5 * 1000;

  HEARTBEAT_PERIOD = 20 * 1000;

  HEARTBEAT_FAILS = 3;

  File = function(filePath, options) {
    var file;
    file = this;
    this.id = options.id || crypto.createHash('md5').update(filePath).digest("hex");
    this.path = filePath;
    this.options = options;
    this.connected = false;
    this.reconnecting = false;
    this.lastHeartbeat = null;
    this.hostname = this.options.hostname || os.hostname();
    events.EventEmitter.call(this);
    this.watch = function() {
      return fs.watchFile(file.path, function(curr, prev) {
        var stream;
        if (curr.size !== prev.size) {
          file.emit('change', file);
          if (file.options.stream) {
            stream = fs.createReadStream(filePath, {
              start: prev.size,
              end: curr.size,
              encoding: 'utf8'
            });
            return stream.on('data', function(data) {
              var lines;
              lines = data.split(LOG_LINEBREAK);
              return _.each(lines, function(line, i) {
                if (i < lines.length - 1) {
                  return socket.emit('stream', {
                    hostname: file.hostname,
                    id: file.path,
                    msg: line,
                    type: 'file',
                    path: file.path
                  });
                }
              });
            });
          }
        }
      });
    };
    this.every = function(delay, callback) {
      return this.interval = setInterval(function() {
        return callback(file);
      }, delay * 1000);
    };
    this.history = function() {
      var fd, length, lines, stat, text;
      length = HISTORY_LENGTH;
      lines = [];
      try {
        stat = fs.statSync(file.path);
        fd = fs.openSync(file.path, 'r');
        text = fs.readSync(fd, length, Math.max(0, stat.size - length));
        lines = text[0].split(LOG_LINEBREAK).reverse();
      } catch (err) {
        console.log(err);
      }
      return socket.emit('history', {
        hostname: file.hostname,
        id: file.id,
        lines: lines,
        type: 'file',
        path: file.path
      });
    };
    this.connect = function() {
      file.socket = io.connect('http://localhost:5500');
      file.socket.on('error', function(err) {
        return console.log('socket error', err);
      });
      return file.socket.on('connect', function() {
        file.socket.emit('register_node', {
          host: file.hostname,
          id: file.id,
          type: 'file',
          path: file.path
        });
        file.connected = true;
        file.reconnecting = false;
        return file.lastHeartbeat = new Date().getTime();
      });
    };
    this.reconnect = function(force) {
      if (!force && this.reconnecting) return;
      file.reconnecting = true;
      console.log('Reconnecting to server...');
      return setTimeout(function() {
        if (file.connected) return;
        file.connect();
        return setTimeout(function() {
          if (!file.connected) return file.reconnect(true);
        }, RECONNECT_INTERVAL / 2);
      }, RECONNECT_INTERVAL);
    };
    this.run = function() {
      file.connect();
      if (file.options.watch) return file.watch();
    };
    return file;
  };

  util.inherits(File, events.EventEmitter);

  exports.File = File;

}).call(this);
