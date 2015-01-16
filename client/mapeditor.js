/* Copyright 2014-2015 Krzysztof Daniel

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/

//-this is initialized server side
//var mapURL
//
// real map data, too.
//var map;
"use strict";

var dirtyIndex = 0;
var lastSavedIndex = 0;
var saving = false;

function fireDirty() {
	dirtyIndex++;
}

var NODE_SIZE = 10;
/**
 * This global variable holds a recently selected node.
 */
var selectedNode = null;
var selectedConnection = null;

function updateSelectionMenus(){
	if(selectedNode || selectedConnection){
		$('#deleteButton').removeClass('disabled');
	} else {
		$('#deleteButton').addClass('disabled');
	}
	if(selectedConnection != null && selectedConnection.scope == 'Actions'){
		var connectionData = null;
		for (var i = 0; i < map.connections.length; i++) {
			if(map.connections[i].connectionId === selectedConnection.id){
				connectionData = map.connections[i];
				break;
			}
		}
		$('#actionMenu').show();
		$('#actionlabel').editable('destroy');
		$('#actionlabel').editable({
			type : 'text',
			name : 'actionlabel',
			title : 'Enter connection label',
			success : function(data, value) {
				connectionData.label = value;
				selectedConnection.setLabel({label:value,cssClass:'connectionlabel'});
				fireDirty();
			},
			validate : function(value){
				if(value.length > 19){
					return "The label should be shorten than 20 characters";
				}
			}
		});
		$('#actionlabel').editable('setValue',connectionData.label);

		$('#actionnote').editable('destroy');
		$('#actionnote').editable({
			type : 'textarea',
			name : 'actionnote',
			title : 'Enter connection note',
			value: connectionData.note,
			success : function(data, value) {
				connectionData.note = value;
				fireDirty();
			}
		});
		$('#actionnote').editable('setValue',connectionData.note);
	} else {
		$('#actionMenu').hide();
	}
}

function deleteSelection(){
	if(selectedNode){
		selectedNode.remove();
	}
	if(selectedConnection){
		jsPlumb.detach(selectedConnection);
		for (var i = 0; i < map.connections.length; i++) {
			if(map.connections[i].connectionId === selectedConnection.id){
				map.connections.splice(i,1);
				fireDirty();
				break;
			}
		}
		selectedConnection = null;
	}
	updateSelectionMenus();
}

function addConnectionListener(c) {
	if (c) {
		c.bind("click", function(conn) {
			if (selectedConnection == c) {
				toggleConnectionSelectedStyle(selectedConnection, false);
				selectedConnection = null;
			} else {
				if (selectedNode) {
					selectedNode.blur();
				}
				selectedNode = null;
				toggleConnectionSelectedStyle(selectedConnection, false);
				selectedConnection = c;
				toggleConnectionSelectedStyle(selectedConnection, true);
			}
			updateSelectionMenus();
		});
	}
}

function toggleConnectionSelectedStyle(c, enable) {
	if (c) {
		var ps = c.getPaintStyle();
		ps = jQuery.extend({}, ps);
		if (enable) {
			ps.lineWidth = 6;
		} else {
			ps.lineWidth = 2;
		}
		c.setPaintStyle(ps);
	}
}

function saveMap() {
	saving = true;
	var dirtyIndexCopy = dirtyIndex;
	$.ajax({
		url : mapURL,
		type : 'post',
		async : 'true',
		data : map,
		success : function(result) {
			if (result.status) {
				console.log('something went wrong');
			} else {
				console.log(result);
			}
			saving = false;
			lastSavedIndex = dirtyIndexCopy;
		},
		error : function(request, error) {
			console.log('An error while getting map list!', error);
			console.log('error ' + dirtyIndexCopy);
			saving = false;
		}
	});
}

function drawMap() {
	
	var mapContainer = $('#map-container');
	var width = mapContainer.width();
	var height = mapContainer.height();

	jsPlumb.setSuspendDrawing(true);

	for (var index = 0; index < map.nodes.length; index++) {
		var node = new HTMLMapNode(mapContainer, map.nodes[index]);
		var top = parseInt(map.nodes[index].positionY * height, 10) + 'px';
		var left = parseInt(map.nodes[index].positionX * width, 10) + 'px';
		node.move({
			'top' : top,
			'left' : left
		}, false);
	};
	if (map.connections) {
		$.each(map.connections, function(index, elem) {
			var scope = elem.scope;
			//backward compatibility, no scope defined
			if (scope == undefined) {
				scope = jsPlumb.getDefaultScope();
			}
			var src = jsPlumb.selectEndpoints({
				source : elem.pageSourceId,
				scope : scope
			}).get(0);
			var trg = jsPlumb.selectEndpoints({
				target : elem.pageTargetId,
				scope : scope
			}).get(0);
			var connection = jsPlumb.connect({
				source : src,
				target : trg,
				deleteEndpointsOnDetach : false
			});
			if(elem.label != null){
				connection.setLabel({label:elem.label,cssClass:'connectionlabel'});
			}
			// workaround, id is internal and can't be edited,
			// so we must change the model each time we load it.
			elem.connectionId = connection.id;
			addConnectionListener(connection);
		});
	};
	jsPlumb.setSuspendDrawing(false, true);
}

function init() {
	//turn to inline mode
	$.fn.editable.defaults.mode = 'inline';

	//initialize widgets
	$('#name').editable({
		success : function(data, config) {
			map.name = config;
			// no need to fireDirty as this widget automagically updates the map
			// when this field is changed, but only this field is saved
			//fireDirty();
		}
	});
	$('#description').editable({
		success : function(data, config) {
			map.description = config;
			// no need to fireDirty as this widget automagically updates the map
			// when this field is changed, but only this field is saved
			//fireDirty();
		}
	});

	drawMap();
}

// =======================================
// MAP DRAWING UTILITIES - START
//=======================================

// unlimited connections
jsPlumb.Defaults.MaxConnections = -1;

// endpoint  and connector appearance
var endpointOptions = {
	connector : "Straight",
	connectorStyle : {
		lineWidth : 2,
		strokeStyle : 'silver',
		outlineColor:"transparent",
		outlineWidth:10
	},
	endpoint : [ "Dot", {
		radius : 1
	} ],
	deleteEndpointsOnDetach : false,
	uniqueEndpoints : true
};

var actionEndpointOptions = {
	connector : "Straight",
	connectorStyle : {
		lineWidth : 2,
		strokeStyle : 'green',
		outlineWidth: 10,
		outlineColor : 'rgba(0,0,255,0.2)'
	},
	endpoint : [ "Dot", {
		radius : 1
	} ],
	connectorOverlays : [ [ "Arrow", {
		location : 1.0
	} ] ],
	deleteEndpointsOnDetach : false,
	uniqueEndpoints : true
};

function HTMLMapNode(parentNode, nodeData) {
	var self = this;

	// in case nodeData was not supplied
	if (!nodeData) {
		nodeData = {};
		nodeData.componentId = "" + Date.now();
		nodeData.name = "";
		nodeData.positionX = 0.5;
		nodeData.positionY = 0.5;
		map.nodes.push(nodeData);
	}
	self.nodeData = nodeData;
	nodeData.componentId = "" + nodeData.componentId; 

	// create and append item to the canvas
	self.internalNode = $('<div>').attr('id', self.nodeData.componentId)
			.addClass('item');

	// store the object for future use
	$(self.internalNode).data('node', self);
	parentNode.append(self.internalNode);

	//a placeholder for the text
	self.caption = $('<a>').addClass("itemCaption").attr('id',
			self.nodeData.componentId + 'itemCaption').attr('href', '#');
	self.internalNode.append(self.caption);
	self.caption.attr('data-type', 'text');
	self.caption.attr('data-title', 'Component Name');
	self.caption.text(self.nodeData.name);
	self.caption.editable({
		value : self.nodeData.name,
		success : function(response, newValue) {
			self.nodeData.name = newValue; //update backbone model
			fireDirty();
		},
		unsavedclass : null,
		mode : 'popup'
	});

	jsPlumb.draggable(self.internalNode, {
		containment : 'parent',
		distance : 5,
		drag : function() {
			self.updatePositionData();
			fireDirty();
		}
	});

	// accept incoming connections
	jsPlumb.makeTarget(self.internalNode, {
		scope : "Actions " + jsPlumb.getDefaultScope(),
		deleteEndpointsOnDetach : true
	});

	self.endpointIn = jsPlumb.addEndpoint(self.internalNode, endpointOptions, {
		anchor : "TopCenter",
		isTarget : true,
		scope : jsPlumb.getDefaultScope(),
		dropOptions : {
			scope : jsPlumb.getDefaultScope(),
			tolerance : 'touch'
		},
		deleteEndpointsOnDetach : false,
		uuid : self.nodeData.componentId + jsPlumb.getDefaultScope() + "i"
	});

	self.endpointOut = jsPlumb.addEndpoint(self.internalNode, endpointOptions,
			{
				anchor : "BottomCenter",
				isSource : true,
				scope : jsPlumb.getDefaultScope(),
				deleteEndpointsOnDetach : false,
				dragOptions : {
					scope : "Actions"
				},
				uuid : self.nodeData.componentId + jsPlumb.getDefaultScope() + "o"
			});

	self.actionEndpointIn = jsPlumb.addEndpoint(self.internalNode,
			actionEndpointOptions, {
				anchor : "Left",
				isTarget : true,
				scope : "Actions",
				dropOptions : {
					scope : "Actions",
					tolerance : 'touch'
				},
				deleteEndpointsOnDetach : false,
				uuid : self.nodeData.componentId + "Actions" + "i"
			});

	self.actionEndpointOut = jsPlumb.addEndpoint(self.internalNode,
			actionEndpointOptions, {
				anchor : "Right",
				isSource : true,
				scope : "Actions",
				deleteEndpointsOnDetach : false,
				uuid : self.nodeData.componentId + "Actions" + "o",
				dragOptions : {
					scope : "Actions"
				}
			});

	self.focus = function() {
		if(selectedConnection){
			toggleConnectionSelectedStyle(selectedConnection, false);
			selectedConnection = null;
		}
		if (selectedNode != null) {
			selectedNode.blur();
		}
		selectedNode = self;
		var endpoints = [ self.endpointOut, self.actionEndpointOut ];
		for (var i = 0; i < endpoints.length; i++) {
			var ps = endpoints[i].getPaintStyle();
			ps = jQuery.extend({}, ps);
			ps.radius = 8;
			endpoints[i].setPaintStyle(ps);
		}
		self.internalNode.addClass('itemSelected');
	};

	self.updatePositionData = function() {
		self.nodeData.positionX = parseInt(self.internalNode.css("left"), 10)
				/ parseInt($('#map-container').width(), 10);
		self.nodeData.positionY = parseInt(self.internalNode.css("top"), 10)
				/ parseInt($('#map-container').height(), 10);
	};

	self.blur = function() {
		var endpoints = [ self.endpointOut, self.actionEndpointOut ];
		var styles = [];
		for (var i = 0; i < endpoints.length; i++) {
			var ps = endpoints[i].getPaintStyle();
			var en = endpoints[i];
			ps = jQuery.extend({}, ps);
			ps.radius = 1;
			styles.push(ps);
		}
		for (var i = 0; i < endpoints.length; i++) {
			endpoints[i].setPaintStyle(styles[i]);
		}
		selectedNode = null;
		self.internalNode.removeClass('itemSelected');
	};

	self.internalNode.on("click", function(event) {
		if (selectedNode == self) {
			self.blur();
			updateSelectionMenus();
		} else {
			self.focus();
			updateSelectionMenus();
		}

	});

	/**
	 * accepts {top,left}
	 */
	self.move = function(newposition, repaint) {
		self.internalNode.css(newposition);
		self.updatePositionData();
		if (repaint) {
			jsPlumb.repaintEverything();
		}
	};

	self.setText = function(text) {
		self.nodeData.name = text;
		self.caption.editable('setValue', text);
	};

	self.getText = function() {
		return self.nodeData.name;
	};

	self.remove = function() {

		self.blur();

		jsPlumb.deleteEndpoint(self.endpointOut);
		jsPlumb.deleteEndpoint(self.actionEndpointOut);
		jsPlumb.deleteEndpoint(self.endpointIn);
		jsPlumb.deleteEndpoint(self.actionEndpointIn);
		jsPlumb.detachAllConnections(self.internalNode);
		self.internalNode.remove();
		for (var i = 0; i < map.nodes.length; i++) {
			if (self.nodeData.componentId === map.nodes[i].componentId) {
				map.nodes.splice(i, 1); 
				break;
			}
		};
		for (var j = map.connections.length - 1; j > -1 ; j--) {
			if (self.nodeData.componentId === map.connections[j].pageSourceId
					|| self.nodeData.componentId === map.connections[j].pageTargetId) {
				map.connections.splice(j, 1); 
			}
		};
		delete self.nodeData;
		fireDirty();
	};

	self.setUserNeed = function(userneed) {
		if (userneed) {
			self.internalNode.addClass("mapUserNeed");
		} else {
			self.internalNode.removeClass("mapUserNeed");
		}
	};
}

// initialize graph drawing
jsPlumb.ready(function() {
	jsPlumb.setContainer($('#map-container'));
	var mapContainer = $('#map-container');
	// create new component/node on click
	mapContainer.click(function(e) {

		// click on the map, awful comparison but works		
		if ($(e.target)[0] == $('#map-container')[0]) {

			// create new node otherwise
			var n = new HTMLMapNode(mapContainer);
			n.move({
				'top' : e.pageY - e.target.offsetTop,
				'left' : e.pageX - e.target.offsetLeft
			}, true);
			n.focus();
			updateSelectionMenus();
			fireDirty();
		}
	});
	// programatically created connections have menu created during creation,
	// but drag and drop must be intercepted.
	//
	// also, we don't allow self-connect
	//
	// even more, we don't create any connections via drag and drop. We cancel
	// the drag and drop and recreate connections using connect, because
	// we need to care about using proper endpoints.
	jsPlumb.bind("beforeDrop", function(connection) {
		// console.log('before drop');

		if (connection.sourceId == connection.targetId) {
			return false;
		}
		/* prepareConnectionMenu(connection.connection); */

		var outcomingEndpointId = connection.sourceId + connection.scope + "o";
		var acceptingEndpointId = connection.targetId + connection.scope + "i";

		var c = jsPlumb.connect({
			uuids : [ outcomingEndpointId, acceptingEndpointId, ],
			deleteEndpointsOnDetach : false
		});

		var connectionData = {
			connectionId : c.id,
			pageSourceId : c.sourceId,
			pageTargetId : c.targetId,
			scope : c.scope
		};

		addConnectionListener(c);

		map.connections.push(connectionData);

		// this is a giant hack that cost me 2 weeks of investigation.
		// makeTarget creates endpoints, and we need to remove them,
		// because connect creates their own.
		// but we should not delete the endpoint if the user happens
		// to drop exactly on 1 pixel proper endpoint.
		// since our universal endpoint has two scopes, and proper
		// endpoints have one scope, we use it to determine whether to delete
		// the endpoint or not.
		// console.log(connection.dropEndpoint.scope, connection.scope);
		if (connection.dropEndpoint.scope !== connection.scope) {
			// console.log(connection.dropEndpoint);
			jsPlumb.deleteEndpoint(connection.dropEndpoint);
		}
		jsPlumb.repaintEverything();

		fireDirty();
		return false;
	});

	jsPlumb.bind("connectionDragStop", function(info, e) {
		var sourceId = info.sourceId;
		var targetId = info.targetId;
		var mapContainer = $('#map-container');

		if (info.targetId.indexOf('jsPlumb') === 0) {
			var n = new HTMLMapNode(mapContainer, null);
			n.move({
				'top' : e.clientY - mapContainer.offset().top - NODE_SIZE,
				'left' : e.clientX - mapContainer.offset().left - NODE_SIZE
			}, true);
			targetId = "" + n.nodeData.componentId;

			var outcomingEndpointId = info.sourceId + info.scope + "o";
			var acceptingEndpointId = targetId + info.scope + "i";
			var c = jsPlumb.connect({
				uuids : [ outcomingEndpointId, acceptingEndpointId, ],
				deleteEndpointsOnDetach : false
			});
			var connectionData = {
				connectionId : c.id,
				pageSourceId : c.sourceId,
				pageTargetId : c.targetId,
				scope : c.scope
			};
			addConnectionListener(c);

			map.connections.push(connectionData);
			n.focus();
			fireDirty();
		}
	});
	init();
});

//=======================================
//MAP DRAWING UTILITIES - END
//=======================================
function saveLoop() {
	setTimeout(function() {
		if (lastSavedIndex != dirtyIndex && !saving) {
			saveMap();
		}
		saveLoop();
	}, 1000);
}

saveLoop();