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

var logger = require('./util/log.js').getLogger('exportmap');
var fs = require('fs');
var d3 = require('d3');
var jsdom = null;
try {
    jsdom = require('jsdom');
} catch (e){
    logger.error('Could not load jsdom');
}
var xmldom = require('xmldom');
var _ = require('underscore');
var path = require('path');

// TODO: map description
// TODO: action labels
var htmlStub = fs.readFileSync(path.join(__dirname, 'svgtemplate.html'), 'UTF8');

var draw = function(res, filename, map){
    if(!jsdom) {
        res.statusCode = 500;
        res.send('Could not create image');
        return;
    }
	jsdom.env({
		features : {
			QuerySelector : true
		},
		html : htmlStub,
		done : function(errors, window) {

		    var x = 1280;
		    var y = 800;
            var thumbnailMargin = 20;
            var margin = {top: (thumbnailMargin + 50), right: thumbnailMargin, bottom: thumbnailMargin, left: thumbnailMargin};
            var width = x - margin.left - margin.right;
            var height = y - margin.top - margin.bottom;
            var LEGEND = [ {
                positionX : (margin.left + 3.0) / x,
                positionY : (y - margin.bottom - 63.0) / y,
                userneed : true,
                external : false,
                name : 'user need'
            },
            {
                positionX : (margin.left + 3.0) / x,
                positionY : (y - margin.bottom - 33.0) / y,
                userneed : false,
                external : true,
                name : 'outsourced component'
            },
            {
                positionX : (margin.left + 3.0) / x,
                positionY : (y - margin.bottom - 3.0) / y,
                userneed : false,
                external : false,
                name : 'internal component'
            }];
		    
			function pick(key) {
				return function(d) {
					return d[key];
				};
			}

			function unitify(unit) {
				return function(d) {
					return '' + d + unit;
				};
			}


			var el = window.document.querySelector('#svg');
			var svgimg = d3.select(el);


			svgimg.append("text").text(map.name)
			.style('font-weight', 'bold')
			.attr('y', 20)
			.attr('x', 40);

			var nodes = _.groupBy(map.nodes, 'componentId');

			var _dependencyConnections = [];
			var _actionConnections = [];
			for(var i = 0; i < map.connections.length; i++){
				if(map.connections[i].scope === 'Actions'){
					_actionConnections.push(map.connections[i]);
				} else {
					_dependencyConnections.push(map.connections[i]);
				}
			}

			var dependencyConnections = _dependencyConnections.map(function(c) {
				return [ nodes[c.pageSourceId][0], nodes[c.pageTargetId][0] ];
			});

			var actionConnections = _actionConnections.map(function(c) {
				return [ nodes[c.pageSourceId][0], nodes[c.pageTargetId][0] ];
			});


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
						.text(_.identity);
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

			//action connections
			mapViz
				.selectAll('.connection')
				.data(actionConnections)
				.enter()
				.append('path')
				.classed('action', true)
				.attr('d', line)
				.style('stroke','green')
				.style('stroke-width', '2px')
				.style('marker-end', 'url(#actionarrow)');

			// regular dependencies
			mapViz
				.selectAll('.connection')
				.data(dependencyConnections)
				.enter()
				.append('path')
				.classed('connection', true)
				.attr('d', line)
				.style('stroke','grey').style('stroke-width', '2px');

			// nodes
			mapViz
				.append('g')
				.classed('nodes', true)
				.selectAll('node')
				.data(map.nodes.concat(LEGEND))
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
						.style('filter', 'url(#glow);fill:#FFFFFF')
						.attr('transform', function(d) { return 'translate(' + (moveX(d) + 12) + ',' + (moveY(d) - 8) + ')'; })
						.text(pick('name'));
			
			        gnode.append('text')
			            .attr('transform', function(d) { return 'translate(' + (moveX(d) + 12) + ',' + (moveY(d) - 8) + ')'; })
			            .text(pick('name'));
                    });

			mapViz.selectAll('.userneed > circle').style('stroke-width', '4px');
			mapViz.selectAll('.external > circle').style('fill', 'white');
			var svgXML = (new xmldom.XMLSerializer()).serializeToString(el);
			res.setHeader('Content-Type', 'image/svg+xml');
			res.send('<?xml version="1.0" encoding="UTF-8" standalone="no"?>' + svgXML);
		}
	});

};

var export_module = function(db) {
    return {
    createSVG : function(req, res, mapId, filename) {
        var userId = req.user.href;
        mapId = db.ObjectId(mapId);
        logger.debug("drawing svg", mapId, "for user", userId);

        db.maps.find({
            "userIdGoogle" : userId,
            "_id" : mapId
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
                draw(res, mapId, maps[0].history[0], filename);
            }
        });
    },

    createAnonymousSVG : function(req, res, mapId, filename) {
        mapId = db.ObjectId(mapId);
        logger.debug("drawing anonymous svg", mapId);

        db.maps.find({
            "_id" : mapId,
            deleted : false,
            anonymousShare : true
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
                // empty map
                if (maps.length === 0) {
                    res.redirect('/favicon.svg');
                } else {
                    draw(res, mapId, maps[0].history[0], filename);
                }
            }
        });
    },

    createThumbnail : function(req, res, mapId) {
        var userId = req.user.href;
        mapId = db.ObjectId(mapId);
        logger.debug("drawing thumbnail", mapId, "for user", userId);

        db.maps.find({
            "userIdGoogle" : userId,
            "_id" : mapId
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
                // empty map
                if (maps[0].history[0].nodes.length === 0) {
                    res.redirect('/favicon.svg');
                } else {
                    draw(res, mapId, maps[0].history[0]);
                }
            }
        });
    }
    };
};

module.exports = export_module;
