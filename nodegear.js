var gearmanode = require('gearmanode');
var redis = require("redis");
var xmpp = require('node-xmpp-client');

var gearJob;
var redisSubChan = 'test_channel';
var gearmanJobName = 'reverse';
var jobPayload;
var redisClient;
var xmppClient;
var gearClient;

gearClient = gearmanode.client();

xmppClient = new xmpp.Client({
    jid: '1026645507924',
    password: 'AIzaSyDxf8TTgcl4KLHv-4HsEp8nUmnjENMTt6A',
    port: 5235,
    host: 'gcm.googleapis.com',
    saslmech: 'PLAIN'
});

xmppClient.connection.socket.setTimeout(0)
xmppClient.connection.socket.setKeepAlive(true, 10000)

redisClient = redis.createClient();
redisClient.subscribe(redisSubChan);

redisClient.on("message", function(channel, message) {
    //send the messages to google ccs server via xmpp
});

//receive messages from ccs and give it to PHP workers
//gearJob = gearClient.submitJob('reverse', message, {background: true});

gearJob.on('workData', function(data) {
    console.log('WORK_DATA >>> ' + data);
});

gearJob.on('complete', function() {
    console.log('RESULT >>> ' + gearJob.response);
    gearClient.close();
});

xmppClient.on('connection', function() {
    console.log('online')
});

xmppClient.on('stanza', function(stanza) {
    console.log('Incoming stanza: ', stanza.toString())
});

xmppClient.on('authenticate', function(opts, cb) {
    console.log('AUTH' + opts.jid + ' -> ' + opts.password)
    cb(null);
});