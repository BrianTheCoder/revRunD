forever = require 'forever'
util = require 'util'
events = require 'events'

Process = (command, options)->
  @id = options.id || crypto.createHash('md5').update(command).digest("hex")
  
  events.EventEmitter.call this
  
  @every = (delay, callback)->
    @interval = setInterval ()-> 
      callback(file)
    , delay * 1000
    
  @start = ->
    console.log 'start'
    
  @restart = ->
    console.log 'restart'
  
  @stop = ->
    console.log 'stop'
    
util.inherits Process, events.EventEmitter

exports.File = Process