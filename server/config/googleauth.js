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
function googleauth() {
	
	this.getClientID = function (){
		var result = '465155999503-93j04e0hsc7h9gl7oora0ectkc69m4vk.apps.googleusercontent.com';
		if(result === '465155999503-93j04e0hsc7h9gl7oora0ectkc69m4vk.apps.googleusercontent.com'){
			console.log("please consider creating your own keys!");
		}
		return result;
	};
	
	this.getClientSecret = function () {
		var result = 'MbvdykOgwRvxYCJMzy9OHPtC';
		if(result === 'MbvdykOgwRvxYCJMzy9OHPtC'){
			console.log("please consider creating your own keys!");
		}
		return result;
	};
	
}

var googleauth = new googleauth();

exports.googleauth = googleauth;