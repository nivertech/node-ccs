var gearmanode = require('gearmanode');
var redis = require("redis");
var xmpp = require('node-xmpp');

var gearJob;
var redisSubChan = 'test_channel';
var gearmanJobName = 'reverse';
var jobPayload;
var redisClient;
var xmppClient;
var gearClient;

gearClient = gearmanode.client();

var options = {
    type: 'client',
    jid: '1026645507924@gcm.googleapis.com',
    password: 'AIzaSyDxf8TTgcl4KLHv-4HsEp8nUmnjENMTt6A',
    port: 5235,
    host: 'gcm.googleapis.com',
    legacySSL: true,
    preferredSaslMechanism: 'PLAIN'
};

console.log('creating xmpp app');

xmppClient = new xmpp.Client(options);

xmppClient.connection.socket.setTimeout(0)
xmppClient.connection.socket.setKeepAlive(true, 10000)

redisClient = redis.createClient();
redisClient.subscribe(redisSubChan);

redisClient.on("message", function(channel, message) {
    console.log(message);
    //send the messages to google ccs server via xmpp
    var ackToDevice = new xmpp.Element('message').c('gcm', {xmlns: 'google:mobile:data'}).t(JSON.stringify({
        "to": message.to,
        "message_id": message.message_id,
        "data": message.data,
        "time_to_live": message.time_to_live,
        "delay_while_idle": message.delay_while_idle
    }));
    console.log(ackToDevice);
    xmppClient.send(ackToDevice);
});

xmppClient.on('online', function() {
    console.log("online");
});

xmppClient.on('connection', function() {
    console.log('online');
});

xmppClient.on('stanza',
        function(stanza) {
            if (stanza.is('message') && stanza.attrs.type !== 'error') {
                // Best to ignore an error
                console.log("Message received");
                //Message format as per here: https://developer.android.com/google/gcm/ccs.html#upstream
                var messageData = JSON.parse(stanza.getChildText("gcm"));

                if (messageData && messageData.message_type != "ack" && messageData.message_type != "nack") {

                    var ackMsg = new xmpp.Element('message').c('gcm', {xmlns: 'google:mobile:data'}).t(JSON.stringify({
                        "to": messageData.from,
                        "message_id": messageData.message_id,
                        "message_type": "ack"
                    }));
                    //send back the ack.
                    xmppClient.send(ackMsg);
                    console.log("Sent ack");
                    //receive messages from ccs and give it to PHP workers
                    var job = gearClient.submitJob(gearmanJobName, JSON.stringify(messageData), {background: true});
                    job.on('complete', function() {
                        console.log('RESULT: ' + job.response);
                    });
                    console.log(messageData);

                } else {
                    //Need to do something more here for a nack.
                    console.log("message was an ack or nack...discarding");
                }

            } else {
                console.log("error");
                console.log(stanza);
            }

        });

xmppClient.on('authenticate', function(opts, cb) {
    console.log('AUTH' + opts.jid + ' -> ' + opts.password);
    cb(null);
});

xmppClient.on('error', function(e) {
    console.log("Error occured:");
    console.error(e);
    console.error(e.children);
});
