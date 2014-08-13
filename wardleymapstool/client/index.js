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
				}
			});
		});
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
			} else {
				var table = $('#listOfMaps');
				table.empty();

				var row = "";
				for ( var mapIndex in result) {
					var aMap = result[mapIndex];
					var row = $('<tr>');

					var cell = $('<td>');
					cell.text(aMap.name);
					row.append(cell);

					cell = $('<td>');
					cell.text(aMap.description);
					row.append(cell);
					
					cell = $('<td>');
					var link = $('<a>').attr('href','/map/'+aMap._id);
					link.text('Edit');
					cell.append(link);
					row.append(cell);
					
					cell = $('<td>');
					link = $('<a>').attr('href', '#');
					bindDeleteMap(link, aMap._id);
					link.text('Delete');
					cell.append(link);
					row.append(cell);

					table.append(row);
				}

			}
		},
		error : function(request, error) {
			console.log('An error while getting map list!', error);
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
