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
logger.setLevel('ALL');
/**
 * default collections that will be used
 */
var DEFAULT_COLLECTIONS = ['users', 'maps', 'progress'];


// actually connect to the database
var db = mongojs(mongodbdata.getConnectionString(), DEFAULT_COLLECTIONS);
db.collection('users');
db.collection('maps');
db.collection('progress');

exports.database = db;

function migrate(){
	db.maps.find()
	.toArray(function(err, maps) {
		if (err !== null) {
			logger.error(err);
		} else {
			for (var i = 0; i < maps.length; i++) {
				var changed = false;
				var singleMap = maps[i];
				
				for(var j = 0; j < singleMap.history.length; j++){
					var historyEntry = singleMap.history[j];
					
					for (var k = 0; k < historyEntry.nodes.length; k++){
						var node = historyEntry.nodes[k];
						for(var field in node){
							if(node[field] === 'true'){
								changed = true;
								node[field] = true;
								logger.debug('changed ', field, node[field]);
							} else if(node[field] === 'false'){
								changed = true;
								node[field] = false;
								logger.debug('changed ', field, node[field]);
							} 
						}
					}
				}
				if(changed){
					db.maps.save(singleMap);
					logger.log('changed ', singleMap);
				}
			}
		}
	});
}

migrate();
/**
 * I hate that but... to perform effective searches by ID passed from JSON you need to convert it to 
 * mongojs Object ID, therefore the helper here.
 */
exports.toDatabaseId = db.ObjectId;