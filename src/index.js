const conf = require('../config.json'),
    log = require('./log'),
    request = require('request'),
    smpp = require('smpp'),
    uuid = require('uuid/v4'),

    json = JSON.parse,
    str = JSON.stringify,

    store = {
      unsynched_statuses: [],
      wo: {},
      wt: [],
    };

log('Starting...');

let pollMedicApi,
    pollTimer, session;

function post(requestBody) {
  const options = withMethod('POST');
  options.body = requestBody;
  options.json = true;
  options.headers['Content-Type'] = 'application/json';
  return options;
}

function withMethod(method) {
  return {
    url: conf.medic_api.url,
    method: method,
    headers: {
      'Accept': 'application/json',
      'Accept-Charset': 'utf-8',
      'Accept-Encoding': 'gzip',
      'Cache-Control': 'no-cache',
    },
  };
}

(function TEST_MEDIC_API_CONNECTION() {
  log('Testing medic-api connection...');
  request(withMethod('GET'), (err, resp, body) => {
    log('medic-api test result (err, resp, body):', err, resp, body);
    if(err || resp.statusCode >= 300 || !json(body)['medic-gateway']) {
      process.exit(1);
    }
    log('medic-api connection OK!');

    log('If this is the last message, bind probably failed.');
  });
}());

(function MEDIC_API_POLLER() {
  function apiRequestContent() {
    log('apiRequestContent()');

    let m, updates;
    const messages = [];

    while((m = store.wt.pop())) {
      try {
        messages.push({
          id: uuid(),
          from: `+${m.source_addr}`,
          content: m.short_message.message,
        });
      } catch(e) {
        log('Failed to process WT message (err, message):', e, str(m));
      }
    }

    updates = store.unsynched_statuses; // TODO if the response fails, these will be lost forever
    store.unsynched_statuses = [];

    return {
      messages: messages,
      updates: updates,
    };
  }

  function processApiResponse(body) {
    log('processApiResponse(body, str(body)):', body, str(body));

    body.messages.forEach((m) => {
      if(store.wo[m.id]) return;

      const timestamp = new Date();
      store.unsynched_statuses.push({ id:m.id, status:'PENDING' });
      store.wo[m.id] = [{ status:'PENDING', timestamp:timestamp }];

      session.submit_sm({ destination_addr: m.to, short_message: m.content },
          (pdu) => {
            if (pdu.command_status === 0) {
              log('Send succesful.  Message ID: ', pdu.message_id);
              const timestamp = new Date();
              store.unsynched_statuses.push({ id:m.id, status:'SENT' });
              store.wo[m.id].push({ status:'SENT', timestamp:timestamp });
            } else log('Unhandled delivery report pdu:', str(pdu));
          });
    });
  }

  pollMedicApi = () => {
    log('pollMedicApi()', 'store:', str(store));

    const requestContent = apiRequestContent();
    log('pollMedicApi()', 'requestContent:', str(requestContent));

    request(post(requestContent), (err, resp, body) => {
      log('Poll response (err, resp, body):', err, resp, body);
      if(err || resp.statusCode >= 300) return;
      processApiResponse(body);
    });
  };
}());

(function SMPP_SETUP() {
  session = smpp.connect(`smpp://${conf.server.host}:${conf.server.port}`);
  session.bind_transceiver({
      system_id: conf.username,
      password: conf.password,
  }, (pdu) => {
      log('Bound.  PDU: ', str(pdu));
      if (pdu.command_status === 0) {
          log('Bind successful.');

          log('Starting medic-api poller...');
          pollTimer = setInterval(pollMedicApi, conf.medic_api.poll_interval * 1000);
      }
  });
}());

(function EVENT_HANDLERS() {
  session.on('connect', () => log('EVENT:connect', 'Connection successfully established.'));

  session.on('secureConnect', () => log('EVENT:secureConnect', 'Handshaking process for a secure connection has successfully completed.'));

  session.on('close', () => log('EVENT:close', 'Connection has been fully closed.'));

  session.on('error', (error) => log('EVENT:error', 'Event occurred.  Close will be called after event handling finishes.', error));

  session.on('send', (pdu) => log('EVENT:send', 'PDU sent.', str(pdu)));

  session.on('pdu', (pdu) => {
    log('EVENT:pdu', 'PDU received.', str(pdu));

    switch(pdu.command_id) {
      case 5:
        store.wt.push(pdu);
        break;
    }
  });

  session.on('unknown', (pdu) => log('EVENT:unknown', 'Unknown PDU received.', str(pdu)));
}());
