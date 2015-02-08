/* Copyright 2015 Krzysztof Daniel

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/

var ProgressHelper = function(){
	var self = this;
	self.maxnumberofsteps = 4;
	self.maxstate = 100;
	self.progress = -1;
	self.refresh = function() {
		$.ajax({
			type : 'GET',
			url : progressURL /* defined in mapeditor.jade */,
			dataType : 'json',
			success : function(data) {
				self.progress = data.progress;
				self.updateUI(data.progress);
			}
		});
	};
	
	self.advance = function(){
		$.ajax({
			type : 'PUT',
			url : progressURL /* defined in mapeditor.jade */,
			dataType : 'json',
			success : function(data) {
				self.progress = data.progress;
				self.updateUI(data.progress);
			}
		});
	};
	
	self.updateUI = function(progress){
		/*progress not tracked for this map*/
		if(progress == -1) return;
		
		for(var i = 0; i < self.maxnumberofsteps; i++){
			var title = $('#mapping-progress-' + i +'> p.progress-title');
			var group = $('#mapping-progress-group-' + i); 
			if(i == progress){
				title.css('text-decoration', '');
				title.css('color', 'black');
				title.css('font-weight', 'bold');
				group.show();
			} else {
				if(i < progress){
					title.css('text-decoration', 'line-through');
					title.css('color', 'silver');
				} else {
					title.css('text-decoration', '');
					title.css('color', 'black');
				}
				title.css('font-weight', 'normal');
				group.hide();
			}
		}
		var progressvalue = progress *10;
		$('#progressprogressbar').attr('aria-valuenow', progressvalue).css('width', '' + progressvalue + '%');
		// there is progress, show the assistant box
		if(progress > -1){
			$('#mapcreationassist').show(100);
		}
		//defined in the mapeditor.jade
		if(map.nodes.length > 0){
			self.makeAdvanceFromUserNeedAvailable();
		}
	};
	
	self.updateNodeAccordingToProgressState = function(node){
		if(self.progress == 0){
			node.setUserNeed(true);
			node.setText('user need');
			self.makeAdvanceFromUserNeedAvailable();
		}
	};
	
	self.makeAdvanceFromUserNeedAvailable = function(){
		$('#mapping-progress-group-' + self.progress +'> button').removeAttr('disabled');
	};
	
	self.limitEndpointsToShow = function(endpoints){
		if(self.progress > 2 || self.progress == -1){
			return endpoints;
		}
		return [endpoints[0]];
	};
};