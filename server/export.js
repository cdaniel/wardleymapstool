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

var arrow = [
             [ 2, 0 ],
             [ -10, -4 ],
             [ -10, 4]
         ];

function drawFilledPolygon(ctx, shape) {
    ctx.beginPath();
    ctx.moveTo(shape[0][0],shape[0][1]);

    for(p in shape)
        if (p > 0) ctx.lineTo(shape[p][0],shape[p][1]);

    ctx.lineTo(shape[0][0],shape[0][1]);
    ctx.fill();
};

function translateShape(shape,x,y) {
    var rv = [];
    for(p in shape)
        rv.push([ shape[p][0] + x, shape[p][1] + y ]);
    return rv;
};

function rotateShape(shape,ang) {
    var rv = [];
    for(p in shape)
        rv.push(rotatePoint(ang,shape[p][0],shape[p][1]));
    return rv;
};
function rotatePoint(ang,x,y) {
    return [
        (x * Math.cos(ang)) - (y * Math.sin(ang)),
        (x * Math.sin(ang)) + (y * Math.cos(ang))
    ];
};

function drawLineArrow(ctx, x1,y1,x2,y2) {
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
    var ang = Math.atan2(y2-y1,x2-x1);
    drawFilledPolygon(ctx, translateShape(rotateShape(arrow,ang),x2,y2));
};

var draw = function(res, filename, map, x, y){
	var canvas = new Canvas(x,y);
	var stream = canvas.pngStream();
	var ctx = canvas.getContext('2d');

	// background
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0,0,x,y);
	
	ctx.strokeStyle = "#000000";
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
	drawLineArrow(ctx, 30, y - 30, 30, 40);
	drawLineArrow(ctx, 30, y - 30, x - 30, y - 30); 
	
	ctx.fillText('Ubiquity', x - 60, y - 15);
	ctx.fillText('Value', 33, 60);
	
	
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
	ctx.stroke();
	
	//draw connections
	for(var index in map.connections){
		var connection = map.connections[index];
		var source = connection.pageSourceId;
		var target = connection.pageTargetId;
		var scope = connection.scope;
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
		if(scope == "jsPlumb_DefaultScope"){
			ctx.strokeStyle = 'silver';
			ctx.moveTo(start.x, start.y);
			ctx.lineTo(end.x,end.y);
			ctx.stroke();			
		}
		if(scope == "Actions"){
			ctx.strokeStyle = 'green';
			var lineLength = Math.sqrt((start.x - end.x)*(start.x - end.x) + (start.y - end.y)*(start.y - end.y));
			var deltaX = 10 * (start.x - end.x) / lineLength;
			var deltaY = 10 * (start.y - end.y) / lineLength;
			drawLineArrow(ctx, start.x, start.y, end.x + deltaX, end.y + deltaY);
		}
	}
	
	ctx.strokeStyle = 'black';
	//and now draw nodes
	for ( var index in calculatedNodes) {
		ctx.beginPath();
		ctx.arc(calculatedNodes[index].x, calculatedNodes[index].y, 10, 0,
				2 * Math.PI);
		
		//background
		ctx.fillStyle = 'silver';
		ctx.fill();
		ctx.stroke();
	}
	
	for ( var index in calculatedNodes) {
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'white';
		
		ctx.fillStyle = 'black';
		ctx.shadowColor = 'white';
		ctx.shadowBlur = 2;
		ctx.shadowOffsetX = 2;
		ctx.shadowOffsetY = 2;
		
		var words = calculatedNodes[index].name.split(' ');
		for(var wordIndex in words) {
			ctx.fillText(words[wordIndex],
				calculatedNodes[index].x + 11, calculatedNodes[index].y - 10 + wordIndex * 11);
			//intentionally copied over to make the shadow blur more visible
			ctx.fillText(words[wordIndex],
					calculatedNodes[index].x + 11, calculatedNodes[index].y - 10 + wordIndex * 11);
			ctx.fillText(words[wordIndex],
					calculatedNodes[index].x + 11, calculatedNodes[index].y - 10 + wordIndex * 11);
			ctx.fillText(words[wordIndex],
					calculatedNodes[index].x + 11, calculatedNodes[index].y - 10 + wordIndex * 11);
		}
		ctx.stroke();
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
		if(start == undefined || end == undefined){
			logger.error('found connection' + connection + ' without nodes');
		} else {
			ctx.moveTo(start.x, start.y);
			ctx.lineTo(end.x,end.y);
			ctx.stroke();
		}
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

var exportmap = function(req, res, mapId, filename, scale) {
	var userId = require('./db').toDatabaseId(req.user);
	mapId = require('./db').toDatabaseId(mapId);
	logger.debug("drawing map", mapId, "for user", userId);

	var x = 1280;
	var y = 800;
	if(scale == 1){
		x = 640;
		y = 480;
	} else if (scale == 2) {
		x = 800;
		y = 600;
	} else if (scale == 3) {
		x = 1024;
		y = 768;
	} else if (scale == 4) {
		x = 1280;
		y = 800;
	}
	
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
			draw(res, mapId, maps[0],x,y);
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