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

var draw = function(res, filename, map, config){
    if(!jsdom) {
        res.statusCode = 500;
        res.send('Could not create image');
        return;
    }
    if(!config){
        config={};
    };
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
            var LEGEND = (config.legend ? [ {
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
            }] : []);
		    
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


			svgimg.append("text")
			    .text(decodeURIComponent(map.name))
			    .attr('id', 'maptitle')
			    .attr('y', "1%")
			    .attr('x', "2%");
			
			svgimg.append("text")
                .text("created at wardleymaps.com")
                .attr('id', 'createdAt')
                .attr('y', "1%")
                .attr('x', "98%");

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
			var x = d3.scale.linear().range([margin.left, width - margin.right]);
			var y = d3.scale.linear().range([0, height]);
			var line = d3.svg.line()
				.x(_.compose(x, pick('positionX')))
				.y(_.compose(y, pick('positionY')));


			// setup viz container
			var mapViz = svgimg
				.attr('width', width + 2 * margin.left + 2 * margin.right)
				.attr('height', height + margin.top + margin.bottom)
				.append('g')
				.attr('transform', 'translate(' + 0 + ',' + margin.top + ')');

			// x legend
			var legendItems = ['Genesis', 'Custom built', 'Product(or rental)', 'Commodity/Utility'];

			var xLegend = d3.scale.ordinal()
				.domain(legendItems)
				.rangeBands([0, width], 0, 0);

			mapViz.append('g')
				.attr('class', 'x axis')
				.attr('transform', 'translate(0,' + height + ')')
				.call(function(el) {
					el.append('path')
						.attr('d', line([{positionX:0, positionY:0}, {positionX:1, positionY:0}]));
					el.selectAll('g.label')
						.data(legendItems)
						.enter()
						.append('g')
						.classed('label', true)
						.attr('transform', function(d) { return 'translate(' + (xLegend(d)+0.07*width) + ',15)'; })
						.append('text')
						.text(_.identity);
			});

			mapViz.append('g')
				.classed('evolution-marker', true)
				.selectAll('path')
				.data(_.tail(legendItems))
				.enter()
				.append('path')
				.attr('transform', function(d) { return 'translate(' + (xLegend(d)-0.01*width) + ',0)'; })
				.attr('d', line([{positionX:0, positionY:1}, {positionX:0, positionY:0}]));

			// y legend
			mapViz.append('g')
				.attr('class', 'y axis')
				.call(function(el) {
					el.append('path')
					.attr('d', line([{positionX:0, positionY:1}, {positionX:0, positionY:0}]));
			});

			//action connections
			mapViz
				.selectAll('.connection')
				.data(actionConnections)
				.enter()
				.append('path')
				.classed('action', true)
				.attr('d', line);

			// regular dependencies
			mapViz
				.selectAll('.connection')
				.data(dependencyConnections)
				.enter()
				.append('path')
				.classed('connection', true)
				.attr('d', line);

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
						.attr({ r: '10px', 'cx': moveX, 'cy': moveY });

					gnode.append('text')
						.classed('nodeTextShadow', true)
						.attr('transform', function(d) { return 'translate(' + (moveX(d) + 12) + ',' + (moveY(d) - 8) + ')'; })
						.text(pick('name'));
			
			        gnode.append('text')
			            .classed('nodeTex', true)
			            .attr('transform', function(d) { return 'translate(' + (moveX(d) + 12) + ',' + (moveY(d) - 8) + ')'; })
			            .text(pick('name'));
                    });

			
			var svgXML = (new xmldom.XMLSerializer()).serializeToString(el);
			if(config.format === 'svg'){
    			res.setHeader('Content-Type', 'image/svg+xml');
    			res.send('<?xml version="1.0" encoding="UTF-8" standalone="no"?>' + svgXML);
			} else {
                try {
                    var phantom = require('phantom');
                    var atob = require('atob');
                    var tmp = require('temporary');
                    var file = new tmp.File({
                        generator : function() {
                        }
                    });
                    file.renameSync('' + Date.now() + Math.random() + '.png');

                    console.log(file.path);

                    var fileSystem = require('fs');

                    phantom.create(function(ph) {
                        ph.createPage(function(page) {
                            console.log('page created');
                            page.set('content', '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' + svgXML);
                            page.set('viewportSize', {
                                width : 800,
                                height : 600
                            });
                            console.log('rendering');
                            page.render('' + file.path, {
                                mode : 'viewport',
                                onlyViewport : true
                            }, function(cb) {
                                ph.exit();
                            });
                        });
                    }, {
                        onExit : function() {
                            console.log('cleaned up');
                            res.statusCode = 200;
                            res.headers = {
                                'Cache' : 'no-cache',
                                'Content-Type' : 'image/png'
                            };
                            res.sendFile(file.path, function() {
                                file.unlink(function() {
                                });
                            });
                        }
                    });
                } catch (e) {
                    console.log(e);
                    res.statusCode = 500;
                    res.close();
                }
			}
		}
	});

};

var export_module = function(db) {
    return {
    createSVG : function(req, res, mapId, filename, params) {
        var forcedownload = params.forcedownload;
        var format = params.format;
        if(!format){
            format = 'svg';
        }
        
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
                if(forcedownload){
                    res.setHeader('Content-Disposition', 'attachment; filename="' + maps[0].history[0].name + '.' + format + '"');
                }
                draw(res, mapId, maps[0].history[0], {legend:true, format:format});
            }
        });
    },

    createSharedSVG : function(req, res, mapId, filename) {
    	//TODO: move the access check logic to the share router
        mapId = db.ObjectId(mapId);
        logger.debug("drawing anonymous svg", mapId);

        db.maps.find({
            "_id" : mapId,
            deleted : false,
            $or : [{anonymousShare : true},
                 {preciseShare : req.user.email}]
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
                    res.redirect('/android-icon-192x192.png');
                } else {
                    draw(res, mapId, maps[0].history[0], {legend:true, format:'svg'});
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
                draw(res, mapId, maps[0].history[0],{format:'svg'});
            }
        });
    }
    };
};

module.exports = export_module;
