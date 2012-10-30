#= require jquery
#= require bootstrap
#= require underscore

$(document).ready ->
  socket = io.connect()
  
  socket.on 'hosts', (hosts)->
    console.log hosts
    
  socket.on 'connect', ->
    console.log 'connected'
    
  $('div.hosts')
    .on 'click', 'h3', (e)->
      $(this).next().slideToggle()
    .on 'click', 'li', ()->
      name = $(this).text()
      type = $(this).closest('ul').prev().text()
      $('div.main').find('h1').html(type + ' <small>' + name + '</small>')