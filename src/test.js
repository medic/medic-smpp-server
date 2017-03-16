var conf = require('../config.json'),
    log = require('./log'),
    smpp = require('smpp'),
    str = JSON.stringify;

log('Starting...');


var session = smpp.connect('smpp://' + conf.server.host + ':' + conf.server.port);
session.bind_transceiver({
  system_id: conf.username,
  password: conf.password,
}, function(pdu) {
  log('Bound.  PDU: ' + JSON.stringify(pdu));
  if (pdu.command_status == 0) {
	log('Bind successful.');

	if(conf.test.send_message) {
	  log('Sending to ' + conf.test.destination + '...');
	  session.submit_sm({
	    destination_addr: conf.test.destination,
	    short_message: 'Hello from node at ' + new Date(),
	  }, function(pdu) {
	    if (pdu.command_status == 0) {
		  log('Send succesful.  Message ID: ' + pdu.message_id);
	    }
	  });
	}
  }
});

session.on('connect', function() {
  log('EVENT:connect', 'Connection successfully established.');
});

session.on('secureConnect', function() {
  log('EVENT:secureConnect', 'Handshaking process for a secure connection has successfully completed.');
});

session.on('close', function() {
  log('EVENT:close', 'Connection has been fully closed.');
});

session.on('error', function(error) {
  log('EVENT:error', 'Event occurred.  Close will be called after event handling finishes.', error);
});

session.on('send', function(pdu) {
  log('EVENT:send', 'PDU sent.', str(pdu));
});

session.on('pdu', function(pdu) {
  log('EVENT:pdu', 'PDU received.', str(pdu));
});

session.on('unknown', function(pdu) {
  log('EVENT:unknown', 'Unknown PDU received.', str(pdu));
});

log('If this is the last message, bind probably failed.');
