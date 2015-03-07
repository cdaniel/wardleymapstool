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

var maps = require('../server/maps');
var db = require('../server/db').database;
var should = require('should');
var sinon = require('sinon');

describe(
		'Maps',
		function() {

			describe(
					'create new map',
					function() {

						it(
								'createNewMap - success - empty map',
								sinon
										.test(function(done) {
											var newMapId = "newmapid";
											// stub empty request
											var req = {
												user : {
													href : "user_abcdef"
												},
												body : {
													name : undefined,
													description : undefined,
													date : undefined
												}
											};
											var res = {
												redirect : function(target){
													should(target).be.equal('/map/' + newMapId);
													done();
												}
											};
											
											var save = this.stub(db.maps, 'save', function(newMapToSave,fn){

												should(newMapToSave).have.property('deleted', false);
												should(newMapToSave).have.property('userIdGoogle', req.user.href);
												should(newMapToSave).have.property('history');
												
												var historyEntry = newMapToSave.history[0];
												should(historyEntry).have.property('name','');
												should(historyEntry).have.property('description','');
												should(historyEntry).have.property('serverDate');

												//no error, an object with id
												fn(null,{_id :  newMapId});
											});
											
											maps.createNewMap(req,res);
										}));
						
						it(
								'createNewMap - success - some data in the map',
								sinon
										.test(function(done) {
											var newMapId = "newmapid";
											// stub empty request
											var req = {
												user : {
													href : "user_abcdef"
												},
												body : {
													name : 'a',
													description : 'b',
													date : '2014'
												}
											};
											var res = {
												redirect : function(target){
													should(target).be.equal('/map/' + newMapId);
													done();
												}
											};
											
											var save = this.stub(db.maps, 'save', function(newMapToSave,fn){

												should(newMapToSave).have.property('deleted', false);
												should(newMapToSave).have.property('userIdGoogle', req.user.href);
												should(newMapToSave).have.property('history');
												
												var historyEntry = newMapToSave.history[0];
												should(historyEntry).have.property('name','a');
												should(historyEntry).have.property('description','b');
												should(historyEntry).have.property('serverDate');
												should(historyEntry).have.property('userDate','2014');

												//no error, an object with id
												fn(null,{_id :  newMapId});
											});
											
											maps.createNewMap(req,res);
										}));
						
						it(
								'createNewMap - error',
								sinon
										.test(function(done) {
											var newMapId = "newmapid";
											// stub empty request
											var req = {
												user : {
													href : "user_abcdef"
												},
												body : {
													name : 'a',
													description : 'b',
													date : '2014'
												}
											};
											//stu response
											var res = {
												_toSend : null,
												redirect : function(target){
													sinon.assert.fail('redirection should not be called here, because we do not handle errors yet');
												},
												setHeader : function(ignored, ignored){
													
												},
												send : function(arg){
													_toSend = arg; //cache the response
												},
												end : function(){
													should(_toSend).be.equal('{"reason":"unexpected"}'); //this is what we expect
													done();
												}
											};
											
											var save = this.stub(db.maps, 'save', function(newMapToSave,fn){

												should(newMapToSave).have.property('deleted', false);
												should(newMapToSave).have.property('userIdGoogle', req.user.href);
												should(newMapToSave).have.property('history');
												
												var historyEntry = newMapToSave.history[0];
												should(historyEntry).have.property('name','a');
												should(historyEntry).have.property('description','b');
												should(historyEntry).have.property('serverDate');
												should(historyEntry).have.property('userDate','2014');

												//no error, an object with id
												fn({reason:'unexpected'},null);
											});
											
											maps.createNewMap(req,res);
										}));
						
						
					});
			
			
			describe(
					'get map',
					function() {

						it(
								'getMap - simple success',
								sinon
										.test(function(done) {
											var mapId = "313233343536373839616263";
											// stub empty request
											var req = {
												user : {
													href : "user_abcdef"
												}
											};
											
											var callback = function(err, maps){
												done();
											}

											var find = this.stub(db.maps, 'find', function(query, projection){
												
												should(query).have.property('deleted', false);
												should(query).have.property('userIdGoogle', req.user.href);
												should(query._id == mapId).be.true;
												
												should(projection).have.property('history');
												var historyQuery = projection.history;
												should(historyQuery).have.property('$slice', -1);
												
												return {
													toArray : function(clbck){
														clbck(null,[{}]);
													}
												};
											});
											
											
											maps.getMap(req,mapId,callback);
										}));
						
						it(
								'getMap - no map found',
								sinon
										.test(function(done) {
											var mapId = "313233343536373839616263";
											// stub empty request
											var req = {
												user : {
													href : "user_abcdef"
												}
											};
											
											var callback = function(maps){
												should.fail('no maps, it should not be called');
											};

											var find = this.stub(db.maps, 'find', function(query, projection){
												
												should(query).have.property('deleted', false);
												should(query).have.property('userIdGoogle', req.user.href);
												should(query._id == mapId).be.true;
												
												should(projection).have.property('history');
												var historyQuery = projection.history;
												should(historyQuery).have.property('$slice', -1);
												
												return {
													toArray : function(clbck){
														clbck(null,[]);
														done();
													}
												};
											});
											
											
											maps.getMap(req,mapId,callback);
										}));
						
						it(
								'getMap - error',
								sinon
										.test(function(done) {
											var mapId = "313233343536373839616263";
											// stub empty request
											var req = {
												user : {
													href : "user_abcdef"
												}
											};
											
											var callback = function(maps){
												should.fail('error, it should not be called');
											};

											var find = this.stub(db.maps, 'find', function(query, projection){
												
												should(query).have.property('deleted', false);
												should(query).have.property('userIdGoogle', req.user.href);
												should(query._id == mapId).be.true;
												
												should(projection).have.property('history');
												var historyQuery = projection.history;
												should(historyQuery).have.property('$slice', -1);
												
												return {
													toArray : function(clbck){
														clbck('error', null);
														done();
													}
												};
											});
											
											
											maps.getMap(req,mapId,callback);
										}));
						
						
					});

		});