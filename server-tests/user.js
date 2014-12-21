/* Copyright 2014 by Krzysztof Daniel

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/

var user = require('../server/user').user;
var should = require('should');


var testUserId = 'long-and-complicated-id' + Date.now();

describe('User', function() {
	describe('createUser', function() {
		
		it('should quit if profile is empty', function (done) {
			var profile = false;
			
			var callback = function (err, id){
				should(err).be.equal(null);
				should(id).not.be.ok;
				done();
			};
			
			user.createOrUpdateLoginInfo(profile, callback);
		});
		
		
		it('should quit if the login provider is unrecognized', function (done) {
			var profile = {
					provider : '\'unknown provider\''
			};
			
			var callback = function (err, id){
				should(err).be.equal(null);
				should(id).not.be.ok;
				done();
			};
			
			user.createOrUpdateLoginInfo(profile, callback);
		});
		
		
		it('should create a user entry if auth granted by google', function (done) {
			
			var test_profile = {
					provider : 'google',
					id : testUserId
			};
			
			var callback = function (err, id){
				should(err).be.equal(null);
				should(id).be.ok;
				done();
			};
			
			user.createOrUpdateLoginInfo(test_profile, callback);
		});
	});
});