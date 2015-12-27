//#!/bin/env node
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

var logger = require('./log.js').getLogger('Access');
var Q = require('q');
Q.longStackSupport = true;

module.exports = function(db) {
	var module = {};

  /**
    * params {req, res, mapId, userId }
    * returns {code:403} if not authorized
    */
  module.writeAccessCheck = function(params, callback){
          var deferred = Q.defer();
          db.maps.find({
              "userIdGoogle" : params.userId, /* only if user id matches */
              "_id" : params.mapId, /* only if map id matches */
              deleted : false /* don't return deleted maps */
          }).toArray(function(err, maps) {
              if (err || !maps || maps.length !== 1) {
                  deferred.reject(err || {code:403});
              }
              if (maps.length === 1) {
                  deferred.resolve(params);
              }
          });
          return deferred.promise.nodeify(callback);
  };

	return module;
};
