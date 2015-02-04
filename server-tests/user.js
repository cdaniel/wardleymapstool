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
var sinon = require('sinon');
var config = require('../server/config/mailchimpconfig').mailchimpconfig;

var mailchimpEnablement;

describe(
		'User',
		function() {
			before(function(){
				mailchimpEnablement = config.enabled; 
				config.enabled=false;
			});
			
			after(function(){
				config.enabled=mailchimpEnablement;
			});
			
			
			describe(
					'post registration handler',
					function() {

						it(
								'method fetching stormpath provider data should be called because knowing what is the source of the account is crucial to perform any other logic',
								sinon
										.test(function(done) {

											var fetchStormPathProviderData = this
													.stub(user,
															'fetchStormPathProviderData');

											var args = [ {}, {}, done ];

											fetchStormPathProviderData
													.withArgs(args[0], args[1],
															args[2])
													.callsArg(2);

											user.normalizeLoginInfo(args[0],
													args[1], args[2]);
										}));
						
						it(
								'fetchStormPathProviderData should choose correct path depending on the dataProvider - error - early quit',
								sinon
										.test(function(done) {
											
											var account = new function () {
												this.href = "testy.test/testtttt"
												this.getProviderData = function(callback){
													callback('test error', 'data');
													done();
												};
											};
											
											user.fetchStormPathProviderData(account, null, should.fail);
										}));
						
						it(
								'fetchStormPathProviderData should choose correct path depending on the dataProvider - no data - early quit',
								sinon
										.test(function(done) {
											
											var account = new function () {
												this.href = "testy.test/testtttt"
												this.getProviderData = function(callback){
													callback(null, null);
													done();
												};
											};
											
											user.fetchStormPathProviderData(account, null, should.fail);
										}));
						
						it(
								'fetchStormPathProviderData should choose correct path depending on the dataProvider - unknown provider - continue',
								sinon
										.test(function(done) {
											
											var account = new function () {
												this.href = "testy.test/testtttt"
												this.getProviderData = function(callback){
													callback(null, {providerId:'provider surprise!'});
												};
											};
											
											user.fetchStormPathProviderData(account, null, done);
										}));
						
						it(
								'fetchStormPathProviderData should choose correct path depending on the dataProvider - google provider - continue to fetching google profile',
								sinon
										.test(function(done) {
											
											var providerData = {providerId:'google', accessToken : "accessToken"};

											var account = new function () {
												this.href = "testy.test/testtttt";
												this.getProviderData = function(callback){
													callback(null, providerData);
												};
											};
											

											var fetchAndStoreGoogleProfile = this
													.stub(user,
															'fetchAndStoreGoogleProfile');
											
											fetchAndStoreGoogleProfile
													.withArgs(account,
															"accessToken", done)
													.callsArg(2);
											
											user.fetchStormPathProviderData(account, null, done);
										}));

					});


		});