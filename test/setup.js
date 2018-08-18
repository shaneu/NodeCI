jest.setTimeout(30000);
const mongoose = require('mongoose');
const keys = require('../config/keys');
require('../models/User');

mongoose.Promise = Promise;
mongoose.connect(keys.mongoURI, { useMongoClient: true })