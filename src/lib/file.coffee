util = require 'util'
events = require 'events'
fs = require 'fs'
os = require 'os'
_ = require 'underscore'
io = require 'socket.io-client'
crypto = require 'crypto'

LOG_LINEBREAK = "\n"
HISTORY_LENGTH = 100000
STATUS_INTERVAL = 60 * 1000 # 60 seconds
RECONNECT_INTERVAL = 5 * 1000 # 5 seconds
HEARTBEAT_PERIOD = 20 * 1000 # 20 seconds
HEARTBEAT_FAILS = 3 # Reconnect after 3 missed heartbeats

File = (filePath, options)->
  file = this
  @id = options.id || crypto.createHash('md5').update(filePath).digest("hex")
  @path = filePath
  @options = options
  @connected = false
  @reconnecting = false
  @lastHeartbeat = null
  @hostname = @options.hostname || os.hostname()
  
  events.EventEmitter.call this
          
  @watch = ()->
    fs.watchFile file.path, (curr, prev)->
      # file.emit 'change', file, curr, prev
      if curr.size != prev.size
        file.emit 'change', file
        
        if file.options.stream
          stream = fs.createReadStream filePath,
            start: prev.size
            end: curr.size
            encoding: 'utf8'
    
          stream.on 'data', (data)->
            lines = data.split LOG_LINEBREAK
            _.each lines, (line, i)->
              if i < lines.length - 1
                socket.emit 'stream',
                  hostname: file.hostname
                  id: file.path
                  msg: line
                  type: 'file'
                  path: file.path
                
  @every = (delay, callback)->
    @interval = setInterval ()-> 
      callback(file)
    , delay * 1000

  @history = ()->
    length = HISTORY_LENGTH
    lines = []
    
    try
      stat = fs.statSync file.path
      fd = fs.openSync file.path, 'r'
      text = fs.readSync fd, length, Math.max(0, stat.size - length)
      lines = text[0].split(LOG_LINEBREAK).reverse()
    catch err
      console.log err
      
    socket.emit 'history',
      hostname: file.hostname
      id: file.id
      lines: lines
      type: 'file'
      path: file.path
  
  @connect = ()->
    file.socket = io.connect('http://localhost:5500')

    file.socket.on 'error', (err)->
      console.log 'socket error', err

    file.socket.on 'connect', ()->
      file.socket.emit 'register_node', 
        host: file.hostname
        id: file.id
        type: 'file'
        path: file.path
        
      file.connected = true
      file.reconnecting = false
      file.lastHeartbeat = new Date().getTime()

    # file.socket.on 'duplicate_host', ->
    #   console.error "ERROR: A node of the same hostname is already registered"
    #   console.error "with the log server. Change this harvester's instance_name."
    #   console.error "Exiting."
    #   process.exit 1
      
  @reconnect = (force)->
    if !force && this.reconnecting then return
    file.reconnecting = true
    console.log 'Reconnecting to server...'
    setTimeout ->
      if file.connected then return
      file.connect()
      setTimeout ->
        if !file.connected then file.reconnect(true)
      , RECONNECT_INTERVAL/2
    , RECONNECT_INTERVAL
    
  @run = ()->
    file.connect()
    if file.options.watch
      file.watch()
    # 
    # setInterval ->
    #   delta = (new Date().getTime()) - file.lastHeartbeat
    #   if delta > (HEARTBEAT_PERIOD * HEARTBEAT_FAILS)
    #     console.log "Failed heartbeat check, reconnecting..."
    #     file.connected = false
    #     file.reconnect()
    # , HEARTBEAT_PERIOD
    
  file
    
util.inherits File, events.EventEmitter

exports.File = File