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

var logger = require('./util/log.js').log.getLogger('exportmap');
var db = require('./db').database;
var Canvas = require('canvas')
, Image = Canvas.Image;

var draw = function(res, filename, map){
	var x = 1280;
	var y = 800;
	var canvas = new Canvas(x,y);
	var stream = canvas.pngStream();
	var ctx = canvas.getContext('2d');

	// background
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0,0,x,y);
	
	ctx.fillStyle = "#000000";
	ctx.font = 'bold 12px Impact';
	
	
	var name = ctx.measureText(map.name);
	ctx.fillText(map.name, 30, 15);
	
	ctx.font = '10px Impact';
	var description = ctx.measureText(map.description);
	ctx.fillText(map.description, 30, 30);
	
	var createdAt = 'Created at www.wardleymaps.com';
	var createdAtMeasure = ctx.measureText(createdAt);
	ctx.fillText(createdAt, x - 30 - createdAtMeasure.width, 15);
	
	//TODO: draw axes here (30px from each border)
	
	
	// calculate nodes
	
	var availableWidth = x - 2 * 30;
	var availableHeight = y - 2 * 30;
	
	var calculatedNodes = [];
	for(var index in map.nodes){
		var node = map.nodes[index];
		var cX = Math.floor(node.positionX * availableWidth) + 30;
		var cY = Math.floor(node.positionY * availableHeight) + 30;
		calculatedNodes.push({
			x : cX,
			y : cY,
			name : node.name,
			componentId : node.componentId
		});
	}
	
	//draw connections
	for(var index in map.connections){
		var connection = map.connections[index];
		var source = connection.pageSourceId;
		var target = connection.pageTargetId;
		var start;
		var end;
		for(var nodeIndex in calculatedNodes){
			
			if(calculatedNodes[nodeIndex].componentId == source){
				start = calculatedNodes[nodeIndex];
			}
			if(calculatedNodes[nodeIndex].componentId == target){
				end = calculatedNodes[nodeIndex];
			}
			
		}
		ctx.moveTo(start.x, start.y);
		ctx.lineTo(end.x,end.y);
		ctx.stroke();
	}
	
	//and now draw nodes
	for ( var index in calculatedNodes) {
		ctx.beginPath();
		ctx.arc(calculatedNodes[index].x, calculatedNodes[index].y, 10, 0,
				2 * Math.PI);
		ctx.stroke();
		
		//background
		ctx.fillStyle = 'silver';
		ctx.fill();
		
		ctx.fillStyle = 'black';
		ctx.fillText(calculatedNodes[index].name,
				calculatedNodes[index].x + 10, calculatedNodes[index].y - 10); 
	}
	
	
	res.setHeader('Content-Type', 'image/png');
	stream.on('data', function(chunk){
		  res.write(chunk);
	});
	stream.on('end', function(){
		res.end();
	});
};

var thumbnail_draw = function(res, filename, map){
	var x = 100;
	var y = 100;
	var canvas = new Canvas(x,y);
	var stream = canvas.pngStream();
	var ctx = canvas.getContext('2d');

	// background
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0,0,x,y);
	
	// calculate nodes
	
	var availableWidth = x ;
	var availableHeight = y ;
	
	var calculatedNodes = [];
	for(var index in map.nodes){
		var node = map.nodes[index];
		var cX = Math.floor(node.positionX * availableWidth);
		var cY = Math.floor(node.positionY * availableHeight);
		calculatedNodes.push({
			x : cX,
			y : cY,
			name : node.name,
			componentId : node.componentId
		});
	}
	
	ctx.strokeStyle = 'silver';
	ctx.fillStyle = 'silver';
	
	//draw connections
	for(var index in map.connections){
		var connection = map.connections[index];
		var source = connection.pageSourceId;
		var target = connection.pageTargetId;
		var start;
		var end;
		for(var nodeIndex in calculatedNodes){
			
			if(calculatedNodes[nodeIndex].componentId == source){
				start = calculatedNodes[nodeIndex];
			}
			if(calculatedNodes[nodeIndex].componentId == target){
				end = calculatedNodes[nodeIndex];
			}
			
		}
		ctx.moveTo(start.x, start.y);
		ctx.lineTo(end.x,end.y);
		ctx.stroke();
	}
	
	//and now draw nodes
	for ( var index in calculatedNodes) {
		ctx.beginPath();
		ctx.arc(calculatedNodes[index].x, calculatedNodes[index].y, 1, 0,
				2 * Math.PI);
		ctx.stroke();
		
		//background
		ctx.fill();
	}
	
	
	res.setHeader('Content-Type', 'image/png');
	stream.on('data', function(chunk){
		  res.write(chunk);
	});
	stream.on('end', function(){
		res.end();
	});
};

var exportmap = function(req, res, mapId, filename) {
	var userId = require('./db').toDatabaseId(req.user);
	mapId = require('./db').toDatabaseId(mapId);
	logger.debug("drawing map", mapId, "for user", userId);

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
			draw(res, mapId, maps[0]);
		}
	});
};

var thumbnail = function(req, res, mapId, filename) {
	var userId = require('./db').toDatabaseId(req.user);
	mapId = require('./db').toDatabaseId(mapId);
	logger.debug("drawing thumbnail", mapId, "for user", userId);

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
			thumbnail_draw(res, mapId, maps[0]);
		}
	});
};

exports.exportmap = exportmap;
exports.thumbnail = thumbnail;