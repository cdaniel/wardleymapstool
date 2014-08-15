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
	
	var stub = {
			name : name,
			description : description,
			userId : userId
		};
	
	
	logger.debug("creating map",stub);
	
	db.maps.save(stub, function(err, saved) {
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
				'Location' : ('/api/map/'+saved._id)
			});
			res.end();
		}
	});
}


function deleteMap(req, res, mapId) {
	var userId = require('./db').toDatabaseId(req.user);
	mapId = require('./db').toDatabaseId(mapId);
	logger.debug("deleting map", mapId, "for user", userId);
	
	db.maps.remove({
		"userId" : userId,
		"_id" : mapId
	}, function(err, map) {
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
	var map = req.body;
	// objectID there, replace
	map._id = mapId;
	map.userId = userId;

	logger.debug('map', map);

	db.maps.findAndModify({
		query : {
			userId : userId,
			_id : mapId
		},
		update : map,
		upsert : true,
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

function getMap(req, res, mapId) {

	var userId = require('./db').toDatabaseId(req.user);
	mapId = require('./db').toDatabaseId(mapId);
	logger.debug("getting map", mapId, "for user", userId);

	db.maps.find({
		"userId" : userId,
		"_id" : mapId
	}).toArray(function(err, maps) {
		res.setHeader('Content-Type', 'application/json');
		if (err !== null) {
			logger.error(err);
			res.statusCode = 500;
			res.send(JSON.stringify(err));
		} else {
			res.send(JSON.stringify(maps[0]));
		}
	});
	
}

function getMaps(req, res) {
	var userId = require('./db').toDatabaseId(req.user);
	logger.debug("getting maps for user", userId);

	db.maps.find({
		"userId" : userId,
	}, {
		name : 1, // fields to return
		description : 1
	}).toArray(function(err, maps) {
		res.setHeader('Content-Type', 'application/json');
		if (err !== null) {
			logger.error(err);
			res.statusCode = 500;
			res.send(JSON.stringify(err));
		} else {
			res.send(JSON.stringify(maps));
		}

	});
}


exports.createNewMap = createNewMap;
exports.deleteMap = deleteMap;
exports.updateMap = updateMap;
/* get single map */
exports.getMap = getMap;
/* get all the maps of the user */
exports.getMaps = getMaps;