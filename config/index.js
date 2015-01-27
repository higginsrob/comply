var mongoose = require('mongoose');

var db_url = process.env.DATABASE_URL || process.env.NODE_ENV === 'test'? 'mongodb://localhost/test' : 'mongodb://localhost/default';

mongoose.connection.on('error', function (err) {
  console.log('Could not connect to mongo server!');
  console.log('Make sure you have a running instance of MongoDB');
  console.log(err);
  process.exit(1);
});

module.exports = {
    db_url: db_url,
    db_connection: mongoose.connect(db_url)
};