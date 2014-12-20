//#!/bin/env node
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

var db = require('./db').database;
var logger = require('./util/log.js').log.getLogger('maps');
var qs = require('querystring');
var fs = require('fs');
var tv4 = require('tv4').tv4;

fs.readFile('server/api-map.json', 'utf8', function(err, data) {
	
	if (err) {
		console.log('Error: ' + err);
		return;
	}
	data = JSON.parse(data);
	logger.debug(data);
	tv4.addSchema(data);
});

function createNewMap(req, res){
	
	var userId = require('./db').toDatabaseId(req.user);
	logger.debug("new map creation requested for user", userId);
	
	
	var name = "";
	if(typeof req.body.name !== 'undefined'){
		name = req.body.name;
	}
	var description = "";
	if(typeof req.body.description !== 'undefined'){
		description = req.body.description;
	}
	
	var date = null;
	if(typeof req.body.description !== 'undefined'){
		date = req.body.date;
	}
	
	var stub = {
			name : name,
			description : description,
			userDate : date,
			serverDate : new Date()
	};
	
	var meta = {
			deleted : false,
			userId : userId,
			history : [stub]
	}
	
	
	logger.debug("creating map", meta);
	
	db.maps.save(meta, function(err, saved) {
		if (err !== null) {
			logger.error(err);
			res.setHeader('Content-Type', 'application/json');
			res.statusCode = 500;
			res.send(JSON.stringify(err));
			res.end();
		}
		if(saved) {
			logger.debug("new map", saved._id, "created for user", userId);
			res.writeHead(302, {
				// TODO: this may be a hack
				// I do not like the fact that the UI index UI is driven from here,
				// but it is an extremely easy way to change what page is visible in the browser 
				'Location' : ('/map/'+saved._id)
			});
			res.end();
		}
	});
}


function deleteMap(req, res, mapId) {
	var userId = require('./db').toDatabaseId(req.user);
	mapId = require('./db').toDatabaseId(mapId);
	logger.debug("deleting map", mapId, "for user", userId);
	
	var userDate = null; //TODO: if I will ever care what time was in the client when a map was deleted.
	
	db.maps.findAndModify({
		query : {
			userId : userId,
			_id : mapId,
			deleted : false
		},
		update : {
			$set : {
				deleted : true
			},
			$push : {
				// null object in the history
				history : {
					userDate : userDate,
					serverDate : new Date()
				}
			}
		},
		upsert : true,
	}, function(err, object) {
		if (err !== null) {
			logger.error(err);
			res.setHeader('Content-Type', 'application/json');
			res.statusCode = 500;
			res.send(JSON.stringify(err));
		} else {
			res.writeHead(200, {'content-type':'text/html'});
			res.end();
		}
	});

}


function updateMap(req, res, mapId) {
	var userId = require('./db').toDatabaseId(req.user);
	mapId = require('./db').toDatabaseId(mapId);
	logger.debug("updating map", mapId, "for user", userId);
	var historyEntry = req.body;
	// objectID there, replace
	historyEntry._id = mapId;
	historyEntry.userId = userId;
	historyEntry.serverDate = new Date();

	logger.debug('map', historyEntry);

	db.maps.findAndModify({
		query : {
			userId : userId,
			_id : mapId,
			deleted : false /* don't modify deleted maps */
		},
		update : {
			$push : {
				history : historyEntry
			}
		},
	}, function(err, object) {
		if (err !== null) {
			logger.error(err);
			res.setHeader('Content-Type', 'application/json');
			res.statusCode = 500;
			res.send(JSON.stringify(err));
		} else {
			res.writeHead(200, {
				'content-type' : 'text/html'
			});
			res.end();
		}
	});
}

function partialMapUpdate(req, res, mapId) {
	var userId = require('./db').toDatabaseId(req.user);
	mapId = require('./db').toDatabaseId(mapId);
	var load = req.body;
	logger.debug("updating map partially", mapId, "for user", userId,
			" request" + JSON.stringify(load));

	db.maps.find({
		"userId" : userId,
		"_id" : mapId,
		deleted : false
	/* don't return deleted maps */
	}, {
		history : {
			$slice : -1
		}
	}).toArray(function(err, map) {
		res.setHeader('Content-Type', 'application/json');
		if (err !== null) {
			logger.error(err);
			res.statusCode = 500;
			res.send(JSON.stringify(err));
		} else {
			// clone last history entry
			var historyEntry = (JSON.parse(JSON.stringify(map[0].history[0])));
			historyEntry.serverDate = new Date();
			historyEntry[load.pk] = load.value;

			db.maps.findAndModify({
				query : {
					userId : userId,
					_id : mapId,
					deleted : false
				/* don't modify deleted maps */
				},
				update : {
					$push : {
						history : historyEntry
					}
				},
			}, function(err, object) {
				if (err !== null) {
					logger.error(err);
					res.setHeader('Content-Type', 'application/json');
					res.statusCode = 500;
					res.send(JSON.stringify(err));
				} else {
					res.writeHead(200, {
						'content-type' : 'text/html'
					});
					res.end();
				}
			});
		}
	});
}

function getMap(req, res, mapId) {

	var userId = require('./db').toDatabaseId(req.user);
	mapId = require('./db').toDatabaseId(mapId);
	logger.debug("getting map", mapId, "for user", userId);

	db.maps.find({
		"userId" : userId,
		"_id" : mapId,
		deleted : false
	/* don't return deleted maps */
	}, {
		history : {
			$slice : -1
		}
	}).toArray(function(err, maps) {
		res.setHeader('Content-Type', 'application/json');
		if (err !== null) {
			logger.error(err);
			res.statusCode = 500;
			res.send(JSON.stringify(err));
		} else {
			res.send(JSON.stringify(maps[0].history[0]));
		}
	});
	
}

function getMaps(req, res) {
	var userId = require('./db').toDatabaseId(req.user);
	logger.debug("getting maps for user", userId);
	                   	
	db.maps.find({
		"userId" : userId,
		deleted : false
	/* don't return deleted maps */
	}, {
		history : {
			$slice : -1
		}
	}).toArray(function(err, maps) {
		res.setHeader('Content-Type', 'application/json');
		if (err !== null) {
			logger.error(err);
			res.statusCode = 500;
			res.send(JSON.stringify(err));
		} else {
			//limit what goes with generic maps
			var response = [];
			for (var i = 0; i < maps.length; i++) {
				var singleMap = {};
				singleMap._id = maps[i]._id;
				singleMap.name = maps[i].history[0].name;
				singleMap.description = maps[i].history[0].description;
				singleMap.userDate = maps[i].history[0].userDate;
				singleMap.serverDate = maps[i].history[0].serverDate;
				response.push(singleMap);
			}
			res.send(JSON.stringify(response));
		}
	});
}


exports.createNewMap = createNewMap;
exports.deleteMap = deleteMap;
exports.updateMap = updateMap;
exports.partialMapUpdate = partialMapUpdate;
/* get single map */
exports.getMap = getMap;
/* get all the maps of the user */
exports.getMaps = getMaps;