/* Copyright 2014 Krzysztof Daniel

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/


var mongojs = require('mongojs');
var mongodbdata = require('./config/mongodbdata').dbdata;
var log = require('./util/log.js').log;

var logger = log.getLogger("db");

/**
 * default collections that will be used
 */
var DEFAULT_COLLECTIONS = ['users', 'maps'];


// actually connect to the database
var db = mongojs(mongodbdata.getConnectionString(), DEFAULT_COLLECTIONS);
db.collection('users');
db.collection('maps');

db.users.ensureIndex({
	"aggregatedID" : 1
}, {
	unique : true
});

exports.database = db;

/**
 * I hate that but... to perform effective searches by ID passed from JSON you need to convert it to 
 * mongojs Object ID, therefore the helper here.
 */
exports.toDatabaseId = db.ObjectId;