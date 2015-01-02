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

var mapId = "";

/**
 * This object holds a real map (just data) that is totally UI abstract.
 */
var map = null;


var dirtyIndex = 0;
var lastSavedIndex = 0;
var saving = false;

function fireDirty(){
	dirtyIndex ++; 
}
/**
 * This global variable holds a recently selected node.
 */
var selectedNode = null;

function calculateDownloadURL(size){
	return '/api/map/' + mapId + '/export/' + size + '/' + mapId + '.png';
}

function calculatePartialUpdateURL(){
	return '/api/map/partial/' + mapId;
}
/**
 * The map editor link usually has a format of:
 * http://127.0.0.1:8080/map/53e663580f1a83730329e6e5.
 * 
 * Do you see the long sequence of letters and digits? This is mapId,
 * used to find and identify a map in the database. Will also serve
 * as a sharing link in the future.
 */
function initializeMapId(){
	var pathname = $(location).attr('pathname');
	var segments = pathname.split('/');
	/* last segment of the url */
	mapId = segments[segments.length - 1];
	
	// populate exports link in the editor
	$('#exportsmall').attr("href", calculateDownloadURL(/*default size, the smallest one*/1));
	$('#exportsmall').attr("download", mapId + '.png');
	
	$('#exportmedium').attr("href", calculateDownloadURL(2));
	$('#exportmedium').attr("download", mapId + '.png');
	
	$('#exportlarge').attr("href", calculateDownloadURL(3));
	$('#exportlarge').attr("download", mapId + '.png');
}

function loadMap() {
	$.ajax({
		url : '/api/map/' + mapId,
		type : 'get',
		async : 'true',
		success : function(result) {
			if (result.status) {
				console.log('something went wrong');
			} else {
				console.log(result);
				map = result;
				drawMap();
			}
		},
		error : function(request, error) {
			console.log('An error while getting map list!', error);
		}
	});
}

function saveMap() {
	if (map != null) {
		 var items = [];
		 
		 //this is very ugly. I could see something like a listener on a jsPlumb updating the model directly
		 //during changes.
		    $(".item").each(function (idx, elem) {
		        var $elem = $(elem);
		        var endpoints = jsPlumb.getEndpoints($elem.attr('id'));
		            items.push({
		                componentId: $elem.attr('id'),
		                /* position needs to be represented as 0-1 float to make sure we can fit it on every screen*/
		                positionX: parseInt($elem.css("left"), 10)/parseInt($('#map-container').width(), 10),
		                positionY: parseInt($elem.css("top"), 10)/parseInt($('#map-container').height(), 10),
		                name: $elem.data('node').name
		            });
		        });
		    var connections = [];
		    
		    $.each(jsPlumb.getAllConnections(), function (idx, connection) {
		    	connections.push({
		    		connectionId: connection.id,
		    		pageSourceId: connection.sourceId,
		    		pageTargetId: connection.targetId,
		    		scope: connection.scope
		        });
		    });
		    //overwrite whatever we have
		    map.nodes = items;
		    map.connections = connections;
		saving = true;
		var dirtyIndexCopy = dirtyIndex;
		$.ajax({
			url : '/api/map/' + mapId,
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
}

function drawMap(){
	$('#name').val(map.name);
	$('#name').text(map.name);
	$('#name').attr('data-pk', 'name');
	$('#name').attr('data-url', calculatePartialUpdateURL());
	$('#name').editable({
		success: function(data, config){
			map.name = config;
			fireDirty();
		}
	});
	$('#description').val(map.description);
	$('#description').text(map.description);
	$('#description').attr('data-pk', 'description');
	$('#description').attr('data-url', calculatePartialUpdateURL());
	$('#description').editable({
		success: function(data, config){
			map.description = config;
			fireDirty();
		}
	});
	
	var mapContainer = $('#map-container');
	var width = mapContainer.width();
	var height = mapContainer.height();
	
	
	jsPlumb.setSuspendDrawing(true);
	
	
	for(var index in map.nodes){
		var node = new Node(mapContainer, map.nodes[index].componentId);
		var top = parseInt(map.nodes[index].positionY * height,10)+'px';
		var left = parseInt(map.nodes[index].positionX * width,10)+'px';
		
		node.move({
			'top' : top,
			'left' : left
		},false);
		
		node.setText(map.nodes[index].name);
		
	}
	if (map.connections) {
		$
				.each(
						map.connections,
						function(index, elem) {
							var scope = elem.scope;
							//backward compatibility, no scope defined
							if(scope == undefined){
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
								deleteEndpointsOnDetach:false
							});	
							// this was used to prepare hover menus
							// on connections.
							/*prepareConnectionMenu(connection);*/
						});
	}
	jsPlumb.setSuspendDrawing(false, true);
}

/**
 * unused right now.
 */
function drawParticipants(){
	var table = $('#listOfParticipants');
	table.empty();
	
	var row = "";
	for ( var pIndex in map.participants) {
		var aParticipant = map.participants[pIndex];
		var row = $('<tr>');

		var cell = $('<td>');
		cell.text(aParticipant.name);
		cell.css('color', aParticipant.color);
		row.append(cell);

		
		cell = $('<td>');
		var link = $('<a>').attr('href', '#');
		/** deleting participants binding should be here*/
		link.text('Delete');
		cell.append(link);
		row.append(cell);

		table.append(row);
	}
}

function bindWidgets(){
	$('#saveButton').on("click", function(e){
		e.preventDefault();
		saveMap();
	});
}

function init(){
	//turn to inline mode
	$.fn.editable.defaults.mode = 'inline';
	
	$( "#context-node-menu" ).menu();
	bindWidgets();
	initializeMapId();
	loadMap();
}


//=======================================
// MAP DRAWING UTILITIES - START
//=======================================

// unlimited connections
jsPlumb.Defaults.MaxConnections = -1;

// endpoint  and connector appearance
var endpointOptions = {
	connector : "Straight",
	connectorStyle : {
		lineWidth : 2,
		strokeStyle : 'silver'
	},
	endpoint : [ "Dot", {
		radius : 1
	} ],
	deleteEndpointsOnDetach:false, 
	uniqueEndpoints: true
};

var actionEndpointOptions = {
		connector : "Straight",
		connectorStyle : {
			lineWidth : 2,
			strokeStyle : 'green'
		},
		endpoint : [ "Dot", {
			radius : 1
		} ],
		connectorOverlays: [ [ "Arrow", { location:1.0 } ] ],
		deleteEndpointsOnDetach:false,
		uniqueEndpoints: true
	};

function Node(parentNode, id) {
	var self = this;
	
	// in case id was not supplied
	if(typeof id === 'undefined'){
		id = Date.now();
	}
	self.id = id;
	
	/**
	 * just initialize
	 */
	self.name = "";
	
	// create and append item to the canvas
	self.internalNode = $('<div>').attr('id', self.id).addClass('item');
	
	// store the object for future use
	$(self.internalNode).data('node',self);
	parentNode.append(self.internalNode);
	
	//a placeholder for the text
	self.caption = $('<a>').addClass("itemCaption").attr('id', self.id + 'itemCaption').attr('href','#');
	self.internalNode.append(self.caption);
	self.caption.attr('data-type', 'text');
	self.caption.attr('data-title', 'Component Name');
	self.caption.text(self.name);
	self.caption.editable({
		 value : self.name,
		 success: function(response, newValue) {
			 self.name = newValue; //update backbone model
			 fireDirty();
		},
		unsavedclass : null,
		mode : 'popup'
	});
	
	
	jsPlumb.draggable(self.internalNode, {
		containment : 'parent',
		distance : 5,
		drag : function(){
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
			tolerance:'touch'
		},
		deleteEndpointsOnDetach : false,
		uuid : self.id + jsPlumb.getDefaultScope() +"i"
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
				uuid : self.id + jsPlumb.getDefaultScope() +"o"
			});

	self.actionEndpointIn = jsPlumb.addEndpoint(self.internalNode,
			actionEndpointOptions, {
				anchor : "Left",
				isTarget : true,
				scope : "Actions",
				dropOptions : {
					scope : "Actions",
					tolerance:'touch'
				},
				deleteEndpointsOnDetach : false,
				uuid : self.id + "Actions" +"i"
			});

	self.actionEndpointOut = jsPlumb.addEndpoint(self.internalNode, actionEndpointOptions,{
		anchor : "Right",
		isSource : true,
		scope : "Actions",
		deleteEndpointsOnDetach : false,
		uuid : self.id + "Actions" +"o",
		dragOptions : {
			scope : "Actions"
		}
	});
	
	

	self.focus = function() {
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
	

	self.internalNode.on("contextmenu", function(event) {
		// Avoid the real one
	    event.preventDefault();
	    
	    $("#context-node-menu").data("node", self);
	    
	    // Show contextmenu
	    if(!$('#context-node-menu').is(':visible')){
	    	$("#context-node-menu").show(100);
	    }
	    
	    // In the right position (the mouse)
	    $("#context-node-menu").css({
	    	top: event.currentTarget.offsetTop,
	        left: event.pageX
	    });
	});
	

	self.internalNode.on("click", function(event) {
		// Hide contextmenu if still visible.
	    if($('#context-node-menu').is(':visible')){
	    	$("#context-node-menu").hide(100);
	    }
	    
	    if(selectedNode == self) {
	    	self.blur();
	    } else {
	    	self.focus();
	    }
	    
	});
	
	/**
	 * accepts {top,left}
	 */
	self.move = function(newposition,repaint){
		self.internalNode.css(newposition);
		if("" + repaint === 'true'){
			jsPlumb.repaintEverything();
		}
	};
	
	self.setText = function(text){
		self.name = text;
		self.caption.editable('setValue', text);
	};
	
	self.getText = function(){
		return self.name;
	};
	
	self.remove = function(){
		
		self.blur();
		
		jsPlumb.deleteEndpoint(self.endpointOut);
		jsPlumb.deleteEndpoint(self.actionEndpointOut);
		jsPlumb.deleteEndpoint(self.endpointIn);
		jsPlumb.deleteEndpoint(self.actionEndpointIn);
		jsPlumb.detachAllConnections(self.internalNode);
		self.internalNode.remove();
		fireDirty();
		// TODO: remove from a map, if it will be stored there
		delete self;
	};
	
	self.setUserNeed = function(userneed) {
		if ("" + userneed === 'true') {
			self.internalNode.addClass("mapUserNeed");
		} else {
			self.internalNode.removeClass("mapUserNeed");
		}
	};
}

jsPlumb.setContainer($('#map-container'));
// initialize graph drawing
jsPlumb.ready(function() {
	var mapContainer = $('#map-container');
	// create new component/node on click
	mapContainer.click(function(e) {
		
		// click on the map, awful comparison but works		
		if($(e.target)[0]== $('#map-container')[0]){
			
			// if the node context menu is visible, hide it
			if($('#context-node-menu').is(':visible')){
				$("#context-node-menu").hide(100);
				return;
			}
			
			// create new node otherwise
			var n = new Node(mapContainer);
			n.move({
				'top' : e.pageY - e.target.offsetTop,
				'left' : e.pageX - e.target.offsetLeft
			}, true);
			n.focus();
			fireDirty();
		}
	});
});


jsPlumb.bind("contextmenu", function(component, event) {
	// Avoid the real one
    event.preventDefault();
    
    $("#context-node-menu").data("node", $(component.getElement()).data('node'));
    
    // Show contextmenu
    if(!$('#context-node-menu').is(':visible')){
    	$("#context-node-menu").show(100);
    }
    
    // In the right position (the mouse)
    $("#context-node-menu").css({
    	top: event.currentTarget.offsetTop,
        left: event.pageX
    });
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

jsPlumb
		.bind(
				"connectionDragStop",
				function(info, e) {
					// console.log('dragstop', info.sourceId, info.targetId);

					var sourceId = info.sourceId;
					var targetId = info.targetId;
					var mapContainer = $('#map-container');

					if (info.targetId.indexOf('jsPlumb') === 0) {
						// console.log('wrong target, creating node',
						// info.targetId);
						var n = new Node(mapContainer);
						n
								.move(
										{
											'top' : e.clientY
													- mapContainer.offset().top
													- 10 /* node size */,
											'left' : e.clientX
													- mapContainer.offset().left
													- 10/* node size */
										}, true);
						targetId = "" + n.id;

						var outcomingEndpointId = info.sourceId + info.scope
								+ "o";
						var acceptingEndpointId = targetId + info.scope + "i";

						var c = jsPlumb
								.connect({
									uuids : [ outcomingEndpointId,
											acceptingEndpointId, ],
									deleteEndpointsOnDetach : false
								});
						n.focus();
						fireDirty();
					}
				});


$("#context-node-menu > li").click(function(){
    
	$("#context-node-menu").hide(100);

	var node = $(this).parent().data('node');
	
    if(typeof node === 'undefined'){
    	console.log('no node!');
    	return;
    }
    
    // This is the triggered action name
    switch($(this).attr("data-action")) {
        // A case for each action. Your actions here
        case "delete": node.remove(); break;
    }
  
  });
//=======================================
//MAP DRAWING UTILITIES - END
//=======================================
function saveLoop(){
	setTimeout(function(){
		if(lastSavedIndex != dirtyIndex && !saving){
			saveMap();
		}
		saveLoop();
	}, 1000);
}

$(document).ready(init);
saveLoop();