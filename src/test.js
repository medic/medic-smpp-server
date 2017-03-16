var smpp = require('smpp'),
    conf = require('../config.json');

function log() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift("LOG");
  console.log.call(console.log, args.join(' '));
}

log('Starting...');


var session = smpp.connect('smpp://' + conf.server.host + ':' + conf.server.port);
session.bind_transceiver({
    system_id: conf.username,
    password: conf.password,
}, function(pdu) {
    log('Bound.  PDU: ' + JSON.stringify(pdu));
    if (pdu.command_status == 0) {
	log('Bind successful.');
	log('Sending to Bishwas...');
        session.submit_sm({
            destination_addr: conf.test.destination,
            short_message: 'Hello from node at ' + new Date(),
        }, function(pdu) {
            if (pdu.command_status == 0) {
                log('Send succesful.  Message ID: ' + pdu.message_id);
            }
        });
    }
});

log('Finished.');
