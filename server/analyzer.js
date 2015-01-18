//#!/bin/env node
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


function composeMissingComponentsMessage() {
	return {
		type : 'panel-warning',
		title : 'Missing components',
		message : 'Your map appears to be empty. I have nothing to analyze.'
	};
}
function composeMissingNamesMessage() {
	return {
		type : 'panel-danger',
		title : 'Missing names',
		message : 'Fill all the component names first. I cannot give you feedback about anonymous components.'
	};
}
function composePotentialDisruption(componentName) {
	var message = 'Your component \''
			+ componentName
			+ '\' appears to be in a sweet spot. Consider delivering it as a utility product';
	return {
		type : 'panel-success',
		title : 'Potential disruption',
		message : message
	};
}


function composeBewareDisruption(componentName) {
	var message = 'Your component \''
			+ componentName
			+ '\' appears to be in a sweet spot where delivering it as a utility product is possible, but you may suffer from inertia, and it is likely that YOU will be disrupted.';
	return {
		type : 'panel-warning',
		title : 'Potential disruption',
		message : message
	};
}

function composeLostChance(componentName) {
	var message = 'Your component \''
			+ componentName
			+ '\' seems to be in a pretty advanced state but it was not offered to anyone although it should be. Consider abandoning it and adopting one of the market alternatives.'
			+ 'There is a small chance your competition made a mistake and did not provide this as a utility product. If that is the case, consider going into that business right now.';
	return {
		type : 'panel-info',
		title : 'Lost chance',
		message : message
	};
}

function composeCreatePlayingField(componentName){
	var message = 'Your rely on \''
		+ componentName
		+ '\' which is pretty mature in evolution and should be delivered as a utility product soon.'
		+ 'Consider looking for new suppliers as it may save you a lot of bucks.';
return {
	type : 'panel-success',
	title : 'Playing field creation opportunity',
	message : message
};
}

function analyse(map) {
	var result = [];
	if(map.history[0].nodes.length == 0){
		result.push(composeMissingComponentsMessage());
		console.error(result);
		return result;
	}
	
	var allnames = true;
	for(var i = 0; i < map.history[0].nodes.length; i++){
		var currentNode = map.history[0].nodes[i];
		currentNode.positionX = parseFloat(currentNode.positionX);
		currentNode.external = 'true' == currentNode.external ? true : false;
		currentNode.userneed = 'true' == currentNode.userneed ? true : false;
		
		if(currentNode.name == ""){
			allnames = false;
			break;
		}
		// potential disruption
		if ((currentNode.positionX > 0.5) && (currentNode.positionX < 0.75)
				&& !currentNode.external && !currentNode.userneed) {
			result.push(composePotentialDisruption(currentNode.name));
		}
		
		if ((currentNode.positionX > 0.5) && (currentNode.positionX < 0.8)
				&& !currentNode.external && currentNode.userneed) {
			result.push(composeBewareDisruption(currentNode.name));
		}
		// reinvented wheel
		if ((currentNode.positionX > 0.75)
				&& !currentNode.external && !currentNode.userneed) {
			result.push(composeLostChance(currentNode.name));
		}
		
		// create playing field
		if ((currentNode.positionX > 0.5) && (currentNode.positionX < 0.75)
				&& currentNode.external) {
			result.push(composeCreatePlayingField(currentNode.name));
		}
		
	}
	if(!allnames){
		result.push(composeMissingNamesMessage());
		console.error(result);
		return result;
	}
	
	
	return result;
}

exports.analyse = analyse;