(function() {
  var Client, io, os;

  io = require('socket.io-client');

  os = require('os');

  Client = function() {
    var File, Process, client;
    client = this;
    this.connected = false;
    this.reconnecting = false;
    this.lastHeartbeat = null;
    this.hostname = this.options.hostname || os.hostname();
    this.connect = function() {
      client.socket = io.connect('http://localhost:5500');
      client.socket.on('error', function(err) {
        return console.log('socket error', err);
      });
      return client.socket.on('connect', function() {
        client.socket.emit('register_node', {
          host: client.hostname
        });
        client.connected = true;
        client.reconnecting = false;
        return client.lastHeartbeat = new Date().getTime();
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
      return file.connect();
    };
    File = require('./file');
    Process = require('./process');
    return client;
  };

}).call(this);
