(function() {
  var app, express, http, io, routes, server;

  express = require('express');

  routes = require('./routes');

  io = require('socket.io');

  http = require('http');

  app = module.exports = express.createServer();

  app.nodes = {};

  app.clients = {};

  app.configure(function() {
    app.set('port', process.env.PORT || 5500);
    app.set('views', "" + __dirname + "/views");
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.favicon());
    app.use(express.query());
    app.use(express.responseTime());
    app.use(app.router);
    app.use(express.static("" + __dirname + "/public"));
    return app.use(require('connect-assets')());
  });

  app.configure('development', function() {
    app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
    return app.use(express.logger('dev'));
  });

  app.configure('production', function() {
    return app.use(express.errorHandler());
  });

  app.get('/', routes.index);

  server = http.createServer(app).listen(app.get('port'), function() {
    return console.log("Express server listening on port " + (app.get('port')) + " in " + app.settings.env + " mode");
  });

  io = io.listen(server);

  io.sockets.on('connection', function(socket) {
    socket.emit('hosts', app.nodes);
    setInterval(function() {
      return socket.emit('hosts', app.nodes);
    }, 3000);
    socket.on('register_node', function(msg) {
      console.log('register', msg);
      if (app.nodes[msg.host]) {
        socket.emit('duplicate_host');
      } else {
        app.nodes[msg.host] = {};
        if (!app.nodes[msg.host][msg.type]) app.nodes[msg.host][msg.type] = [];
        app.nodes[msg.host][msg.type].push({
          id: msg.id,
          name: msg.path
        });
      }
      return socket.on('disconnect', function() {
        return delete app.nodes[msg.hostname];
      });
    });
    return socket.on('disconnect', function() {
      return delete app.clients[socket.id];
    });
  });

}).call(this);
