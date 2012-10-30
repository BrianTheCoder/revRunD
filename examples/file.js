(function() {
  var File, file, util;

  File = require('../lib/file').File;

  util = require('util');

  file = new File('/Users/wbsmith83/code/bananaphone/mother_brain/log/development.log', {
    watch: true,
    stream: true
  });

  file.every(10, function() {
    return console.log('tick');
  });

  file.on('change', function(file) {
    return console.log('changed!', file);
  });

  file.run();

}).call(this);
