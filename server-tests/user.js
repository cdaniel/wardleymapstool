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

describe(
		'User',
		function() {

			describe(
					'normalize login info',
					function() {

						it(
								'method fetching stormpath provider data should be called because knowing what is the source of the account is crucial to perform any other logic',
								sinon
										.test(function(done) {

											var fetchStormPathProviderData = sinon
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

					});

		});