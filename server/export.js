/* Copyright 2014, 2015 Krzysztof Daniel and Scott Weinstein.

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
var fs = require('fs');
var d3 = require('d3'), jsdom = require('jsdom');
var xmldom = require('xmldom');
var _ = require('underscore');


// TODO: 'Created at www.wardleymaps.com'
// TODO: map name
// TODO: map description
// TODO: scope:actions, scope:jsPlumb_DefaultScope



var draw = function(res, filename, map){
	var htmlStub = '<html><head><script></script></head><body><div id="map-container"></div></body></html>';
	
	jsdom.env({
		features : {
			QuerySelector : true
		},
		html : htmlStub,
		done : function(errors, window) {
			
			function pick(key) {
				return function(d) {
					if(typeof d[key] === 'string' && d[key] === 'true'){
						return true;
					}
					if(typeof d[key] === 'string' && d[key] === 'false'){
						return false;
					}
					return d[key];
				};
			}

			function unitify(unit) {
				return function(d) {
					return '' + d + unit;
				};
			}
				
			
			var x = 1280;
			var y = 1024;
			var thumbnailMargin = 20;
			
			var el = window.document.querySelector('#map-container');
			var svgimg = d3.select(el).append('svg:svg').attr('xmlns', 'http://www.w3.org/2000/svg').attr('class', 'map');
			
			var defs = svgimg.append('defs');
			
			var marker = defs.append('marker');
			marker.attr('id', 'arrow');
			marker.attr('orient', 'auto');
			marker.attr('markerWidth', '6');
			marker.attr('markerHeight', '8');
			marker.attr('refX', '0.1');
			marker.attr('refY', '2');
			
			var path = marker.append('path');
			path.attr('d', 'M0,0 V4 L2,2 Z');
			path.attr('fill', 'grey');

			svgimg.append('rect')
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', '100%')
				.attr('height', '100%')
				.attr('fill', 'white')
				.style('stroke-width','0px');
			
			var nodes = _.groupBy(map.nodes, 'componentId');
			var connections = map.connections.map(function(c) {
				return [ nodes[c.pageSourceId][0], nodes[c.pageTargetId][0] ];
			});
			
			 // basic size
			var margin = {top: thumbnailMargin, right: thumbnailMargin, bottom: thumbnailMargin, left: thumbnailMargin};
			var width = x - margin.left - margin.right;
			var height = y - margin.top - margin.bottom;
			
			 // scales
			var x = d3.scale.linear().range([0, width]);
			var y = d3.scale.linear().range([0, height]);
			var line = d3.svg.line()
				.x(_.compose(x, pick('positionX')))
				.y(_.compose(y, pick('positionY')));
			
			
			// setup viz container
			var mapViz = svgimg
				.attr('width', width + margin.left + margin.right)
				.attr('height', height + margin.top + margin.bottom)
				.append('g')
				.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
			
			// x legend
			var legendItems = ['Genesis', 'Custom built', 'Product(or rental)', 'Commodity/Utility'];
			
			var xLegend = d3.scale.ordinal()
				.domain(legendItems)
				.rangeBands([0, width], 0, 0.1);
			
			mapViz.append('g')
				.attr('class', 'x axis')
				.attr('transform', 'translate(0,' + height + ')')
				.call(function(el) {
					el.append('path')
						.attr('d', line([{positionX:0, positionY:0}, {positionX:1, positionY:0}]))
						.style('stroke','grey').style('stroke-width', '2px').style('marker-end', 'url(#arrow)');
					el.selectAll('g.label')
						.data(legendItems)
						.enter()
						.append('g')
						.classed('label', true)
						.attr('transform', function(d) { return 'translate(' + xLegend(d) + ',15)'; })
						.append('text')
						.text(_.identity)
						.style('font','10px sans-serif');;
			});
			
			mapViz.append('g')
				.classed('evolution-marker', true)
				.selectAll('path')
				.data(_.tail(legendItems))
				.enter()
				.append('path')
				.attr('transform', function(d) { return 'translate(' + (xLegend(d) - 40) + ',0)'; })
				.attr('d', line([{positionX:0, positionY:1}, {positionX:0, positionY:0}]))
				.style('stroke','grey').style('stroke-width', '1px').style('stroke-dasharray', '1,5');
			
			// y legend
			mapViz.append('g')
				.attr('class', 'y axis')
				.call(function(el) {
					el.append('path')
					.attr('d', line([{positionX:0, positionY:1}, {positionX:0, positionY:0}]))
					.style('stroke','grey').style('stroke-width', '2px').style('marker-end', 'url(#arrow)');
			});
			
			// connections
			mapViz
				.selectAll('.connection')
				.data(connections)
				.enter()
				.append('path')
				.classed('connection', true)
				.attr('d', line)
				.style('stroke','black').style('stroke-width', '1px');
			
			// nodes
			mapViz
				.append('g')
				.classed('nodes', true)
				.selectAll('node')
				.data(map.nodes)
				.enter()
				.append('g')
				.classed({ node: true, external: pick('external'), userneed: pick('userneed') })
				.call(function(gnode) {
			
			var moveX = _.compose(x, pick('positionX'));
			var moveY = _.compose(y, pick('positionY'));
			
			gnode
				.append('circle')
				.attr({ r: '10px', 'cx': moveX, 'cy': moveY })
				.style('fill','silver').style('stroke','black').style('stroke-width', '2px');
			
			gnode.append('text')
				.attr('transform', function(d) { return 'translate(' + (moveX(d) + 12) + ',' + (moveY(d) - 8) + ')'; })
				.text(pick('name'));
			});
			
			mapViz.selectAll('.userneed > circle').style('stroke-width', '4px');
			mapViz.selectAll('.external > circle').style('fill', 'white');
			
			var svgXML = (new xmldom.XMLSerializer()).serializeToString(el.firstChild); 
			res.setHeader('Content-Type', 'image/svg+xml');
			res.send('<?xml version="1.0" encoding="UTF-8" standalone="no"?>' + svgXML);
		}
	});

}

var createSVG = function(req, res, mapId, filename) {
	var userId = req.user.href;
	mapId = require('./db').toDatabaseId(mapId);
	logger.debug("drawing svg", mapId, "for user", userId);

	db.maps.find({
		"userIdGoogle" : userId,
		"_id" : mapId
	},{
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
			draw(res, mapId, maps[0].history[0], filename);
		}
	});
};

var createThumbnail = function(req, res, mapId) {
	var userId = req.user.href;
	mapId = require('./db').toDatabaseId(mapId);
	logger.debug("drawing thumbnail", mapId, "for user", userId);

	db.maps.find({
		"userIdGoogle" : userId,
		"_id" : mapId
	},{
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
			//empty map
			console.log(maps[0].history[0].nodes);
			if(maps[0].history[0].nodes.length === 0){
				res.redirect('/favicon.svg');
			} else {
				draw(res, mapId, maps[0].history[0]);
			}
		}
	});
};

exports.createSVG = createSVG;
exports.createThumbnail = createThumbnail;
