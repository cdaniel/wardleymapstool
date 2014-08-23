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
	$("#newMapFormDialog").dialog({
		autoOpen : true,
		height : 300,
		width : 350,
		modal : true,

		close : function() {
			$("#name").val('');
			$("#description").val('');
		}
	});
}

function createNewMapButton(selectors) {
	var cell = $('<div>').attr('class','mapselector');
	
	cell.attr('title', 'Click to create a new map.');

	var caption = $('<div>');
	caption.text('New map...');
	
	var link =  $('<a>');
	link.attr('href','#');
	link.on('click',showAddMapDialog);
	
	var image = $('<img>');
	image.attr('src','/new-icon.png');
	image.attr('class','mapselectorimage');
	image.css('opacity','0.5');
	
	selectors.append(cell);
	link.append(image);
	cell.append(link);
	cell.append(caption);
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

				
				for ( var mapIndex in result) {
					var aMap = result[mapIndex];
					var cell = $('<div>').attr('class','mapselector');
					
					cell.attr('title', aMap.description);

					var caption = $('<div>');
					caption.text(aMap.name);
					
					var link =  $('<a>');
					link.attr('href','/map/'+aMap._id);
					
					var image = $('<img>');
					image.attr('src','api/map/' + aMap._id + '/thumbnail.png');
					image.attr('class','mapselectorimage');
					
					selectors.append(cell);
					link.append(image);
					cell.append(link);
					cell.append(caption);
					
					createDeleteOverlay(cell, aMap._id);
				}
				createNewMapButton(selectors);
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

function init(){
	loadListOfMaps();
	$('#newMapCreationForm').ajaxForm(function() { 
		window.location.reload();
    });
}

$(document).ready(init);
