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
 * This module holds information about connection to mongo
 */
function mongodbdata() {
	
	this.getConnectionString = function (){
		var result = "127.0.0.1:27017/wardleymaps";
		
		// if OPENSHIFT env variables are present, use the available connection info:
		if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
		  result = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
		  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
		  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
		  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
		  process.env.OPENSHIFT_APP_NAME;
		}
		
		return result;
	};
	
}

var mongodbdata = new mongodbdata();

exports.dbdata = mongodbdata;