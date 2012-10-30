io = require 'socket.io-client'
os = require 'os'

Client = ()->
  client = this
  @connected = false
  @reconnecting = false
  @lastHeartbeat = null
  @hostname = @options.hostname || os.hostname()
  
  @connect = ()->
    client.socket = io.connect('http://localhost:5500')

    client.socket.on 'error', (err)->
      console.log 'socket error', err

    client.socket.on 'connect', ()->
      client.socket.emit 'register_node', 
        host: client.hostname
        
      client.connected = true
      client.reconnecting = false
      client.lastHeartbeat = new Date().getTime()

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
    
  File = require('./file')
  Process = require('./process')
  
  client