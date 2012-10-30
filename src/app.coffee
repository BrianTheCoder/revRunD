# Module dependencies.
express = require 'express'
routes = require './routes'
io = require 'socket.io'
http = require 'http'

app = module.exports = express.createServer()
app.nodes = {}
app.clients = {}

# Configuration
app.configure ->
  app.set 'port', process.env.PORT || 5500
  app.set 'views', "#{__dirname}/views"
  app.set 'view engine', 'jade'
  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use express.favicon()
  app.use express.query()
  app.use express.responseTime()
  app.use app.router
  app.use express.static("#{__dirname}/public")
  app.use require('connect-assets')()

app.configure 'development', ->
  app.use express.errorHandler(dumpExceptions: true, showStack: true)
  app.use express.logger('dev')

app.configure 'production', ->
  app.use express.errorHandler()

# Routes
app.get '/', routes.index

server = http.createServer(app).listen app.get('port'), ->
  console.log "Express server listening on port #{app.get('port')} in #{app.settings.env} mode"

io = io.listen server

io.sockets.on 'connection', (socket)->
  socket.emit 'hosts', app.nodes
  
  setInterval ->
    socket.emit 'hosts', app.nodes
  , 3000
  
  socket.on 'register_node', (msg)->
    console.log 'register', msg
    if app.nodes[msg.host]
      socket.emit 'duplicate_host'
    else
      app.nodes[msg.host] = {}
      if !app.nodes[msg.host][msg.type]
        app.nodes[msg.host][msg.type] = []
      app.nodes[msg.host][msg.type].push 
        id: msg.id
        name: msg.path
    
    socket.on 'disconnect', ->
      delete app.nodes[msg.hostname]
  
  socket.on 'disconnect', ->
    delete app.clients[socket.id]