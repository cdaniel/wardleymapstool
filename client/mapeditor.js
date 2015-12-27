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
var updatePositionLock = false;

function updateSelectionMenus(){
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
	if(selectedNode){

	    $('#node_title').editable('destroy');
	    $('#node_title').text(selectedNode.getText());
        $('#node_title').editable({
            value : selectedNode.getText(),
            success : function(response, newValue) {
                selectedNode.setText(newValue); //update backbone model
                fireDirty();
            },
        });
        $('#node_title').editable('setValue',selectedNode.getText());

		$('#node_userneed').editable('destroy');
		$('#node_userneed').editable({
		    source: { '0' : 'No', '1': 'Yes'},
		    emptytext: 'Not set!',
		    success : function(data, value) {
		    	selectedNode.setUserNeed(value == 1);
				fireDirty();
			}
		});
		if(selectedNode.isUserNeed()){
			$('#node_userneed').editable('setValue',1);
		} else {
			$('#node_userneed').editable('setValue',0);
		}

		$('#node_external').editable('destroy');
		$('#node_external').editable({
		    source: {'0': 'inhouse', '1' : 'outsourced'},
		    emptytext: 'Not set!',
		    success : function(data, value) {
		    	selectedNode.setExternal(value == 1);
				fireDirty();
			}
		});
		if(selectedNode.isExternal()){
			$('#node_external').editable('setValue',1);
		} else {
			$('#node_external').editable('setValue',0);
		}

		$('#nodeMenu').show();
	} else {
		$('#nodeMenu').hide();
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
		c.bind("click", function(conn, event) {
		    c = conn.component || conn;
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
			var overlay = c.getOverlay("menu");
            if (!overlay) {
                c.addOverlay([
                        "Custom",
                        {
                            create : function(component) {
                                return $("<div><button onclick='deleteSelection()' class='btn btn-danger btn-xs'>Delete</button></div>");
                            },
                            location : 0.5,
                            id : "menu"
                        }]);
            } else {
                c.showOverlay("menu");
            }
		} else {
			ps.lineWidth = 2;
			c.hideOverlay("menu");
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
        contentType: 'application/json',
		data : JSON.stringify(map),
		dataType : 'json',
		error : function(request, error) {
		    if(request.status == 401){
		        // served by status code
		        return;
		    }
			console.log('An error while saving a map!', error);
			console.log('error ' + dirtyIndexCopy);
			saving = false;
			$("#servernotresponding").show();
            setTimeout(function() {
                window.location.href = "/";
            }, 5000);
		},
		statusCode : {
		    200 : function(){
		        saving = false;
	            lastSavedIndex = dirtyIndexCopy;
		    },
		    302 : function() {
		        $("#lostsession").show();
                setTimeout(function() {
                    window.location.href = "/";
                }, 5000);
		    },
		    401 : function() {
                $("#lostsession").show();
                setTimeout(function() {
                    window.location.href = "/";
                }, 5000);
            }
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
				source : elem.sourceId,
				scope : scope
			}).get(0);
			var trg = jsPlumb.selectEndpoints({
				target : elem.targetId,
				scope : scope
			}).get(0);
			var connection = jsPlumb.connect({
				source : src,
				target : trg,
				deleteEndpointsOnDetach : false
			});
			console.log(src,trg,connection);
			if(elem.label != null){
				connection.setLabel({label:elem.label,cssClass:'connectionlabel'});
			}
			// restore previously saved id
			connection.id = elem.connectionId;
			jsPlumb.setIdChanged(connection.id, elem.connectionId);

			addConnectionListener(connection);
		});
	};
	jsPlumb.repaintEverything(true);
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

//	$('#mapeditor-preference-clickcreate').checkbox();
	$('[data-toggle="tooltip"]').tooltip();

	drawMap();

	//update the progress helper
	progressHelper.refresh();
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
		outlineColor : "transparent"
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


var passivePaintStyle = {fillStyle: 'transparent', outlineColor:'transparent'};

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

	self.wheelnavid = 'wheelnav' + self.nodeData.componentId;
	self.internalNode.append($('<div>').attr('id', self.wheelnavid));

	// store the object for future use
	$(self.internalNode).data('node', self);
	parentNode.append(self.internalNode);

	//a placeholder for the text
	self.caption = $('<div>').addClass("itemCaption").attr('id',
			self.nodeData.componentId + 'itemCaption');
	self.internalNode.append(self.caption);
	self.caption.text(self.nodeData.name);

	jsPlumb.draggable(self.internalNode, {
		containment : true,
		distance : 5,
		grid:[150,150],
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
		paintStyle:passivePaintStyle,
		deleteEndpointsOnDetach : false,
		uuid : self.nodeData.componentId + jsPlumb.getDefaultScope() + "i"
	});

	self.endpointOut = jsPlumb.addEndpoint(self.internalNode, endpointOptions,
			{
				anchor : "BottomCenter",
				isSource : true,
				scope : jsPlumb.getDefaultScope(),
				deleteEndpointsOnDetach : false,
				paintStyle: passivePaintStyle,
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
				paintStyle:passivePaintStyle,
				deleteEndpointsOnDetach : false,
				uuid : self.nodeData.componentId + "Actions" + "i"
			});

	self.actionEndpointOut = jsPlumb.addEndpoint(self.internalNode,
			actionEndpointOptions, {
				anchor : "Right",
				isSource : true,
				scope : "Actions",
				deleteEndpointsOnDetach : false,
				paintStyle:passivePaintStyle,
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
		var endpoints = progressHelper.limitEndpointsToShow([ self.endpointOut, self.actionEndpointOut ]);
		for (var i = 0; i < endpoints.length; i++) {
			var ps = endpoints[i].getPaintStyle();
			ps = jQuery.extend({}, ps);
			ps.radius = 8;
			ps.fillStyle = '#424242';
			ps.outlineColor = '#424242';
			endpoints[i].setPaintStyle(ps);
		}
		self.internalNode.addClass('itemSelected');


		$('#' + self.wheelnavid).addClass('wheelnav');
		self.myWheelnav = new wheelnav('wheelnav' + self.nodeData.componentId);

		self.myWheelnav.wheelRadius = 100;
		self.myWheelnav.clickModeRotate = false;
		self.myWheelnav.navAngle = -15;

		self.myWheelnav.titleFont= '100 12px Impact, Charcoal, sans-serif';
		self.myWheelnav.colors = ['silver','orange'];

		var custom = new slicePathCustomization();
		custom.minRadiusPercent = 0.2;
		custom.maxRadiusPercent = 1;

		self.myWheelnav.slicePathFunction = function(helper, percent){
		    return slicePath().DonutSlice( helper, percent, custom);
		};

		self.myWheelnav.createWheel(["edit","delete", null,null,null,null,null,null,null,null,null,null]);

		self.myWheelnav.navItems[0].navigateFunction = function(){
		    $('#nodemenudialog').modal('show');
		};
		// delete selection on click
		self.myWheelnav.navItems[1].navigateFunction = function(){deleteSelection();};

		self.myWheelnav.refreshWheel();

		//this throws exception but makes the trick
		try{
		self.myWheelnav.navigateWheel(-1);} catch(e){}
	};

	self.updatePositionData = function() {
		if (!updatePositionLock) {
			self.nodeData.positionX = parseInt(self.internalNode.css("left"),
					10)
					/ parseInt($('#map-container').width(), 10);
			self.nodeData.positionY = parseInt(self.internalNode.css("top"), 10)
					/ parseInt($('#map-container').height(), 10);
		}
	};

	self.blur = function() {
		var endpoints = [ self.endpointOut, self.actionEndpointOut ];
		var styles = [];
		for (var i = 0; i < endpoints.length; i++) {
			var ps = endpoints[i].getPaintStyle();
			var en = endpoints[i];
			ps = jQuery.extend({}, ps);
			ps.radius = 1;
			ps.fillStyle = passivePaintStyle.fillStyle;
            ps.outlineColor = passivePaintStyle.outlineColor;
			styles.push(ps);
		}
		for (var i = 0; i < endpoints.length; i++) {
			endpoints[i].setPaintStyle(styles[i]);
		}
		selectedNode = null;
		self.internalNode.removeClass('itemSelected');
		var wheelnavId = self.myWheelnav.holderId;
		delete self.myWheelnav;
		$('#'+wheelnavId).empty();
		$('#' + self.wheelnavid).removeClass('wheelnav');
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
		}
		for (var j = map.connections.length - 1; j > -1 ; j--) {
			if (self.nodeData.componentId === map.connections[j].sourceId ||
						self.nodeData.componentId === map.connections[j].targetIdId) {
				map.connections.splice(j, 1);
			}
		}
		delete self.nodeData;
		fireDirty();
	};

	self.setUserNeed = function(userneed) {
		if (userneed) {
			self.internalNode.addClass("mapUserNeed");
			self.nodeData.userneed = true;
		} else {
			self.internalNode.removeClass("mapUserNeed");
			self.nodeData.userneed = false;
		}
	};

	self.isUserNeed = function() {
		return self.nodeData.userneed;
	};

	self.setExternal = function(external) {
		if (external) {
			self.internalNode.addClass("mapExternal");
			self.nodeData.external = true;
		} else {
			self.internalNode.removeClass("mapExternal");
			self.nodeData.external = false;
		}
	};

	self.isExternal = function() {
		return self.nodeData.external;
	};

	self.setExternal(self.nodeData.external);
	self.setUserNeed(self.nodeData.userneed);
}

function initalizeJSPlumb() {
	jsPlumb.setContainer($('#map-container'));
	var mapContainer = $('#map-container');
	// create new component/node on click
	mapContainer.off('click').click(function(e) {

		// click on the map, awful comparison but works
		if ($(e.target)[0] == $('#map-container')[0]) {

			// create new node otherwise
		    if(!$('#mapeditor-preference-clickcreate')[0].checked){
                var n = new HTMLMapNode(mapContainer);
                n.move({
                    'top' : e.pageY - e.target.offsetTop,
                    'left' : e.pageX - e.target.offsetLeft
                }, true);
                progressHelper.updateNodeAccordingToProgressState(n);
                n.focus();
                fireDirty();
            } else {
                if (selectedConnection) {
                    toggleConnectionSelectedStyle(selectedConnection, false);
                    selectedConnection = null;
                }
                if (selectedNode) {
                    selectedNode.blur();
                    selectedNode = null;
                }
            }
			updateSelectionMenus();
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
//		console.log('before drop', connection);
	    var scope = connection.connection.getData().scope;

		if (connection.sourceId == connection.targetId) {
			return false;
		}

		var outcomingEndpointId = connection.sourceId + scope + "o";
		var acceptingEndpointId = connection.targetId + scope + "i";

		if(jsPlumb.getConnections({
			  scope:scope,
			  source : connection.sourceId,
			  target : connection.targetId
			}, true).length > 0){
			//connection already exists
			return false;
		}

		if(connection.connection.getData().established) return false;

		var c = jsPlumb.connect({
			uuids : [ outcomingEndpointId, acceptingEndpointId, ],
			deleteEndpointsOnDetach : false
		});
		connection.connection.getData().established = true;
//		console.log('connection established',c);

		var connectionData = {
			connectionId : c.id,
			sourceId : c.sourceId,
			targetId : c.targetId,
			scope : scope
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
//		console.log(connection.dropEndpoint.scope, connection.scope, scope);
		if (connection.dropEndpoint.scope !== scope) {
//			console.log('deleting scope', connection.dropEndpoint);
			jsPlumb.deleteEndpoint(connection.dropEndpoint);
		}
		jsPlumb.repaintEverything();

		fireDirty();
		return false;
	});

	jsPlumb.bind("connectionDragStop", function(info, e) {
//	    console.log(info.getData(), e);
		var sourceId = info.sourceId;
		var targetId = info.targetId;
		var mapContainer = $('#map-container');

		if (info.targetId.indexOf('jsPlumb') === 0) {
			var n = new HTMLMapNode(mapContainer, null);
			n.move({
				'top' : e.pageY - mapContainer.offset().top - NODE_SIZE,
				'left' : e.pageX - mapContainer.offset().left - NODE_SIZE
			}, true);
			targetId = "" + n.nodeData.componentId;

			var outcomingEndpointId = info.sourceId + info.getData().scope + "o";
			var acceptingEndpointId = targetId + info.getData().scope + "i";
			var c = jsPlumb.connect({
				uuids : [ outcomingEndpointId, acceptingEndpointId, ],
				deleteEndpointsOnDetach : false
			});
			info.getData().established = true;
			var connectionData = {
				connectionId : c.id,
				sourceId : c.sourceId,
				targetId : c.targetId,
				scope : info.getData().scope
			};
			addConnectionListener(c);

			map.connections.push(connectionData);
			progressHelper.updateNodeAccordingToProgressState(n);
			n.focus();
			fireDirty();
			updateSelectionMenus();
			$('#nodemenudialog').modal('show');
		}
		jsPlumb.repaintEverything();
	});
	//put scope into connection - no more guessing
	jsPlumb.bind("beforeDrag", function(a, b) {
        return {
            scope : a.endpoint.scope,
            established : false
        };
    });
	jsPlumb.bind("beforeStartDetach", function(a, b) {
        return {
            scope : a.endpoint.scope,
            established : false
        };
    });
	init();
}

// initialize graph drawing
jsPlumb.ready(initalizeJSPlumb);

$( window ).resize(function() {
	updatePositionLock = true;
	jsPlumb.reset();
	if(selectedConnection){
		selectedConnection = null;
	}
	if(selectedNode) {
		selectedNode = null;
	}
	//remove everything except axes
	$('#map-container').children().slice(9/*number of divs making axes*/).remove();
	initalizeJSPlumb();
	updatePositionLock = false;
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
