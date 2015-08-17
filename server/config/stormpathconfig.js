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

/**
 * This module obtains key necessary to store user data in stormpath.
 * Listed variables should be set in the bash environment.
 * 
 * TODO: make it configurable through config.json
 */
function stormpathconfig() {
	
	this.getApiKeyId = function (){
		var result = process.env.WM_STORMPATH_API_KEY_ID || "";
		if(result === ""){
			console.error("please obtain stormpath account");
		}
		return result;
	};
	
	this.getApiKeySecret = function (){
		var result = process.env.WM_STORMPATH_API_KEY_SECRET || "";
		if(result === ""){
			console.error("please obtain stormpath account");
		}
		return result;
	};
	
	this.getSecretKey = function (){
		var result = process.env.WM_STORMPATH_SECRET_KEY || "";
		if(result === ""){
			console.error("please obtain stormpath account");
		}
		return result;
	};
	
	this.getApplication = function (){
	    var result = process.env.WM_STORMPATH_APPLICATION || "";
		if(result === ""){
			console.error("please obtain stormpath account");
		}
		return result;
	};
}

var stormpathconfig = new stormpathconfig();

exports.stormpathconfig = stormpathconfig;