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

function bindDeleteMap(a, mapId){
		a.on('click', function(event){
			event.preventDefault();
			$.ajax({
				url : '/api/map/' + mapId,
				type : 'delete',
				async : 'true',
				success : function(result) {
					window.location.reload();
				},
				error : function(request, error) {
					console.log('deleting a map failed' + error);
					$("#preload").fadeOut(100);
					$("#content").fadeOut(100);
					$("#error").fadeIn(100);
				}
			});
		});
}

function createDeleteOverlay(div, mapId) {
	var overlay = $('<div>').attr('class','deleteoverlay');
	div.append(overlay);
	var link = $('<a>');
	var image = $('<img>').attr('class','deleteoverlayimage');
	image.attr('src','delete.png');
	
	overlay.append(link);
	link.append(image);
	
	bindDeleteMap(link, mapId);
	
	div.mouseover(function() {
		overlay.show();
	});
	div.mouseout(function() {
		overlay.hide();
	});
}

function showAddMapDialog(event) {
	event.preventDefault();
//	$("#newMapFormDialog").dialog({
//		autoOpen : true,
//		height : 300,
//		width : 350,
//		modal : true,
//
//		close : function() {
//			$("#name").val('');
//			$("#description").val('');
//		}
//	});
	var options = {
		    "backdrop" : "static"
		};
	$('#basicModal').modal(options);
}

function createNewMapButton(selectors) {
	var cell = $('<div/>');
	cell.attr('class','col-xs-12 col-sm-6 col-md-3 col-lg-2');
	
	var thumbnail = $('<div/>');
	thumbnail.attr('class','thumbnail');
	
	var link =  $('<a/>');
	link.attr('href','#');
	link.on('click',showAddMapDialog);
	
	var image = $('<img/>');
	image.attr('src', '/new-icon.png');
	image.attr('class','img-thumbnail');
	image.attr('title', 'Click to create a new map.');
	image.attr('width','200px');
	image.attr('height','200px');
	image.attr('opacity', '0.5');
	
	var caption = $('<div/>');
	caption.attr('class','caption');
	
	var captiontitle = $('<h3/>');
	captiontitle.text('New map...');
	
	caption.append(captiontitle);
	
	selectors.append(cell);
	cell.append(thumbnail);
	cell.append(caption);

	thumbnail.append(link);
	link.append(image);
}

function loadListOfMaps() {
	$.ajax({
		url : '/api/maps',
		type : 'get',
		async : 'true',
		success : function(result) {
			console.log(result);
			if (result.status) {
				console.log('something went wrong');
				$("#preload").fadeOut(100);
				$("#error").fadeIn(100);
			} else {
				var selectors = $('#selectors');
				selectors.empty();
				createNewMapButton(selectors);
				
				for ( var mapIndex in result) {
					var aMap = result[mapIndex];
					var cell = $('<div/>');
					cell.attr('class','col-xs-12 col-sm-6 col-md-3 col-lg-2');
					
					var thumbnail = $('<div/>');
					thumbnail.attr('class','thumbnail');
					
					var link =  $('<a/>');
					link.attr('href','/map/'+aMap._id);
					
					var image = $('<img/>');
					image.attr('src','api/map/' + aMap._id + '/thumbnail.png');
					image.attr('class','img-thumbnail');
					image.attr('title', aMap.description);
					
					var caption = $('<div/>');
					caption.attr('class','caption');
					
					var captiontitle = $('<h3/>');
					captiontitle.text(aMap.name);
					
					caption.append(captiontitle);
					
					selectors.append(cell);
					cell.append(thumbnail);
					cell.append(caption);

					thumbnail.append(link);
					link.append(image);
					
					
					createDeleteOverlay(cell, aMap._id);
				}
				
				$("#preload").fadeOut(100);
				$("#content").fadeIn(100);
			}
		},
		error : function(request, error) {
			console.log('An error while getting map list!', error);
			$("#preload").fadeOut(100);
			$("#error").fadeIn(100);
		}
	});
}

function init() {
	loadListOfMaps();
	$(function() {
		$("input,select,textarea").not("[type=submit]").jqBootstrapValidation({
			 submitSuccess: function ($form, event) {
				 window.location.reload();
			}
		});
		
	});
}

$(document).ready(init);

