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

/**
 * This module holds Google API Keys useful required to obtain permissions
 * from Google+.
 */
function stormpathconfig() {
	
	this.getApiKeyId = function (){
		var result = "6CONEX0NW160YDOTCY540929S";
		if(result === ""){
			console.error("please obtain stormpath account");
		}
		return result;
	};
	
	this.getApiKeySecret = function (){
		var result = "SkwoCTWHiEIwpTgrGI7DK/NmAW5Ee8KEWeO5XPtf1cA";
		if(result === ""){
			console.error("please obtain stormpath account");
		}
		return result;
	};
	
	this.getSecretKey = function (){
		var result = "EEsrtXb3NXbjpuIzYiCs07rvOB5eabfTkNp1yoL4T4WP8thMj3DbuQ==";
		if(result === ""){
			console.error("please obtain stormpath account");
		}
		return result;
	};
	
	this.getApplication = function (){
		var result = "https://api.stormpath.com/v1/applications/26uUGYkQ4sJYlS34i50yEm";
		if(result === ""){
			console.error("please obtain stormpath account");
		}
		return result;
	};
}

var stormpathconfig = new stormpathconfig();

exports.stormpathconfig = stormpathconfig;