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
	
	
	$('#exportButton').attr("href", '/api/map/' + mapId + '/export/' + mapId + '.png');
	$('#exportButton').attr("download", mapId + '.png');
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
		        });
		    });
		    //overwrite whatever we have
		    map.nodes = items;
		    map.connections = connections;
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
			},
			error : function(request, error) {
				console.log('An error while getting map list!', error);
			}
		});
	}
}

function drawMap(){
	$('#name').val(map.name);
	$('#description').val(map.description);
	
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
							var connection = jsPlumb.connect({
								source : elem.pageSourceId,
								target : elem.pageTargetId
							}, endpointOptions);
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
	$('#feedbackButton').on("click", function(e){
		e.preventDefault();
		$('#feedbackframe').toggle();
	});
	// TODO:
	// I guess this can be make simpler
	$('#name').on('change', function(){
		if(map != null){
			map.name =$('#name').val();
		}
	});
	$('#description').on('change', function(){
		if(map != null){
			map.description =$('#description').val();
		}
	});
/*	$('#participantAdd').on('click', function() {
		var color = $('#participantColor').val();
		var name = $('#participantName').val();
		if (map !== null) {
			if (typeof map['participants'] === 'undefined') {
				map['participants'] = [];
			}
			map.participants.push({
				color : color,
				name : name
			});
			drawParticipants();
		}
	});*/
}

function init(){
	$( "#context-node-menu" ).menu();
	bindWidgets();
	initializeMapId();
	loadMap();
}


//=======================================
// MAP DRAWING UTILITIES - START
//=======================================
/*
 * remove interactivity
*/
Chart.defaults.global.showTooltips = false;

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
	} ]
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
	self.caption = $('<div>').addClass("itemCaption").attr('id', self.id + 'itemCaption');
	self.internalNode.append(self.caption);
	
	
/*	self.chart = $('<canvas>').addClass('competitorChart').attr('width','10px').attr('height', '10px');
	self.internalNode.append(self.chart);*/
	
	jsPlumb.draggable(self.internalNode, {
		containment : 'parent',
		distance : 5
	});
	
	// accept incoming connections
	jsPlumb.makeTarget(self.internalNode, {
		anchor: 'TopCenter'
	}, endpointOptions);
	
	
	
	self.endpointOut = jsPlumb.addEndpoint(self.internalNode, {
		anchor : "BottomCenter",
		isSource : true
	}, endpointOptions);
	
	self.entered=false;
	
	self.internalNode.on("mouseenter", function(){
		self.entered = true;
		var ps = self.endpointOut.getPaintStyle();
		ps = jQuery.extend({},ps);
		ps.radius = 10;
		self.endpoint= self.endpointOut.setPaintStyle(ps);
	});
	
	self.makeEndpointSmaller = function () {
			self.entered = false;
			var ps = self.endpointOut.getPaintStyle();
			var en = self.endpointOut;
			ps = jQuery.extend({},ps);
			ps.radius = 1;
			setTimeout(function(){
				if(self.entered){
					self.makeEndpointSmaller();
				} else {
					en.setPaintStyle(ps);					
				}
			},500);
	};
	self.internalNode.on("mouseleave", self.makeEndpointSmaller);
	

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
	
	/**
	 * accepts {top,left}
	 */
	self.move = function(newposition,repaint){
		self.internalNode.css(newposition);
		if("" + repaint === 'true'){
			jsPlumb.repaint(self.internalNode);
		}
	};
	
	self.setText = function(text){
		self.name = text;
		self.caption.text(self.name);
	};
	
	self.getText = function(){
		return self.name;
	};
	
	self.remove = function(){
		jsPlumb.deleteEndpoint(self.endpointOut);
		jsPlumb.detachAllConnections(self.internalNode);
		self.internalNode.remove();
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
	
	self.edit = function() {
		var  dialog = $( "#nodeEditDialog" ).dialog({
			autoOpen: false,
			height: 300,
			width: 350,
			modal: true,
			buttons: {
			"Save": function(){
				self.setText($('#nodeName').val());
				dialog.dialog( "close" );
			},
			Cancel: function() {
				dialog.dialog( "close" );
			}
			},
			close: function() {
				dialog.dialog( "close" );
			}
			});
		$('#nodeName').val(self.getText());
		dialog.dialog("open");
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
		}
	});
});

//programatically created connections have menu created during creation,
//but drag and drop must be intercepted.
//
//also, we don't allow self-connect
jsPlumb.bind("beforeDrop", function(connection) {
	if (connection.sourceId == connection.targetId){
		return false;
	 }
	/*prepareConnectionMenu(connection.connection);*/
	return true;
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
        case "edit": node.edit(); break;
        case "delete": node.remove(); break;
    }
  
  });
//=======================================
//MAP DRAWING UTILITIES - END
//=======================================

$(document).ready(init);
