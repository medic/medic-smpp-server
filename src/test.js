const conf = require('../config.json'),
    log = require('./log'),
    smpp = require('smpp'),
    str = JSON.stringify;

log('Starting...');


const session = smpp.connect(`smpp://${conf.server.host}:${conf.server.port}`);
session.bind_transceiver({
  system_id: conf.username,
  password: conf.password,
}, (pdu) => {
  log(`Bound.  PDU: ${str(pdu)}`);
  if (pdu.command_status === 0) {
    log('Bind successful.');

    if(conf.test.send_message) {
      log(`Sending to ${conf.test.destination}...`);
      session.submit_sm({
        destination_addr: conf.test.destination,
        short_message: `Hello from node at ${new Date()}`,
      }, (pdu) => {
        if (pdu.command_status === 0) {
          log(`Send succesful.  Message ID: ${pdu.message_id}`);
        }
      });
    }
  }
});

session.on('connect', () => log('EVENT:connect', 'Connection successfully established.'));

session.on('secureConnect', () => log('EVENT:secureConnect', 'Handshaking process for a secure connection has successfully completed.'));

session.on('close', () => log('EVENT:close', 'Connection has been fully closed.'));

session.on('error', (error) => log('EVENT:error', 'Event occurred.  Close will be called after event handling finishes.', error));

session.on('send', (pdu) => log('EVENT:send', 'PDU sent.', str(pdu)));

session.on('pdu', (pdu) => log('EVENT:pdu', 'PDU received.', str(pdu)));

session.on('unknown', (pdu) => log('EVENT:unknown', 'Unknown PDU received.', str(pdu)));

log('If this is the last message, bind probably failed.');
