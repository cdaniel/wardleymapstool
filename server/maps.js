//#!/bin/env node
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

var logger = require('./util/log.js').getLogger('maps');

var Q = require('q');
Q.longStackSupport = true;

/**
 * validates necessary fields.
 * binds the request to the user sending the request.
 */
function preprocessNewMapRequest(req, res, callback){
    var deferred = Q.defer();
    var userId = req.user.href;
    logger.debug("new map creation requested for user", userId);

    var name = "";
    if (typeof req.body.name !== 'undefined') {
        name = req.body.name;
    }
    var description = "";
    if (typeof req.body.description !== 'undefined') {
        description = req.body.description;
    }

    var date = null;
    if (typeof req.body.description !== 'undefined') {
        date = req.body.date;
    }

    var stub = {
        name : name,
        description : description,
        userDate : date,
        serverDate : new Date(),
        nodes : [],
        connections : []
    };

    var meta = {
        deleted : false,
        userIdGoogle : userId,
        history : [ stub ]
    };

    deferred.resolve({
        req : req,
        res : res,
        meta : meta,
        progress : 0 //init progress here
    });
    return deferred.promise.nodeify(callback);
}

/**
 * validates necessary fields.
 * binds the request to the user sending the request.
 */
function preprocessNewSubMapRequest(req, res, callback){
    var deferred = Q.defer();
    var userId = req.user.href;
    logger.debug("new submap creation requested for user", userId);
    
    var parentmapid = "";
    if (typeof req.body.parentmapid !== 'undefined') {
        parentmapid = req.body.parentmapid;
    }
    
    var parentcomponentid = "";
    if (typeof req.body.parentcomponentid !== 'undefined') {
        parentcomponentid = req.body.parentcomponentid;
    }

    var date = null;
    if (typeof req.body.description !== 'undefined') {
        date = req.body.date;
    }

    var stub = {
        parentid : parentid,
        userDate : date,
        serverDate : new Date(),
        nodes : [],
        connections : []
    };

    var meta = {
        deleted : false,
        userIdGoogle : userId,
        history : [ stub ]
    };

    deferred.resolve({
        req : req,
        res : res,
        meta : meta
    });
    return deferred.promise.nodeify(callback);
}

var mapmodule = function(db, share) {
    
    var _prepareMetadataToClone = function(params, callback){
        var deferred = Q.defer();
        var map = params.mapsNoHistory[0]; //just one map
        
        //strip the id
        delete map._id;
        map.history[0].name = "Clone of \"" + map.history[0].name + "\""; 
        
        params.meta = map;
        
        deferred.resolve(params);
        return deferred.promise.nodeify(callback);
    };
    
    /**
     * params = {req,res,meta},
     * output = {req,res,meta,_id}
     */
    var _saveMetaMap = function(params, callback){
        var deferred = Q.defer();
        db.maps.save(params.meta, function(err, saved) {
            if (err !== null) {
                deferred.reject(err);
            }
            if (saved) {
                logger.debug("new map", saved._id, "created");
                params._id = '' + saved._id;
                deferred.resolve(params);
            }
        });
        return deferred.promise.nodeify(callback);
    };
    /**
     * params = {req,res,meta,_id},
     * output = {req,res,meta,_id,progress}
     */
    var _initProgress = function(params, callback){
        var deferred = Q.defer();
        var defaultProgress = -1;
        if(params.progress) {
            defaultProgress = params.progress;
        }
        db.collection('progress').save({
            mapid : params._id,
            progress : params.progress
        }, function(err, saved) {
            if (err !== null) {
                deferred.reject(err);
            }
            if (saved) {
                params.progress = params.progress;
                deferred.resolve(params);
            }
        });
        return deferred.promise.nodeify(callback);
    };
    
    /**
     * input {mapId, progress}
     * output {mapId, progress}
     */
    var _getProgressNoAccessCheck = function(params, callback){
        var deferred = Q.defer();
        var mapId = '' + params.mapId; //ensure mapid is a string
        db.progress.findOne({
            mapid : mapId
        }, function(err, state) {
            if (err !== null) {
                deferred.reject(err);
            }
            if (state) {
                params.progress = state.progress; //object progress contains state before save
                deferred.resolve(params);
            }
        });
        return deferred.promise.nodeify(callback);
    };
    
    /**
     * input {mapId, progress}
     * output {mapId, progress}
     */
    var _advanceProgressNoAccessCheck = function(params, callback){
        var deferred = Q.defer();
        var mapId = '' + params.mapId; //ensure mapid is a string
        db.progress.findAndModify({
            query : {
                mapid : mapId
            },
            update : {
                $inc : {
                    progress : 1
                }
            }
        }, function(err, object) {
            console.debug(err, object);
            if (err !== null) {
                deferred.reject(err);
            }
            if (object) {
                params.progress = object.progress + 1; //object progress contains state before save
                deferred.resolve(params);
            }
        });
        return deferred.promise.nodeify(callback);
    };
    
    /**
     * params {req, res, mapId,userId }
     * returns {code:403} if not authorized
     */
    var _writeAccessCheck = function(params, callback){
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
    }
    
    var _redirectToMapID = function (params, callback){
        var deferred = Q.defer();
        params.res.redirect('/map/' + params._id);
        deferred.resolve(params);
        return deferred.promise.nodeify(callback);
    };
    
    /**
     * Retrieves maps that were not yet deleted and belong to the user.
     * If mapid is specified, retrieves only one map.
     */
    var _getRawMapsWithoutHistory = function(params, callback){
        var deferred = Q.defer();
        var query = {
                "userIdGoogle" : params.userId,
                deleted : false /* don't return deleted maps */
        };
        if(params.mapId) {
            query._id = params.mapId;
        }
        db.maps.find(query, {
            history : {
                $slice : -1
            }
        }).toArray(function(err, maps) {
            if (err !== null) {
                deferred.reject(err);
            } else {
                params.mapsNoHistory = maps;
                deferred.resolve(params);
            }
        });
        return deferred.promise.nodeify(callback);
    };
    
    /*
     * This should prepare maps to be easily displayable as a list (without nodes and connections, just metadata).
     */
    var _prepareRawMapsForDisplay = function(params, callback){
        var deferred = Q.defer();
        var maps = params.mapsNoHistory;
        var response = [];
        for (var i = 0; i < maps.length; i++) {
            var singleMap = {};
            singleMap._id = maps[i]._id;
            singleMap.name = maps[i].history[0].name;
            singleMap.description = maps[i].history[0].description;
            singleMap.serverDate = maps[i].history[0].serverDate;
            response.push(singleMap);
        }
        params.mapsForDisplay = response;
        deferred.resolve(params);
        return deferred.promise.nodeify(callback);
    };
    
    var _prepareMapToFullDisplay = function(params, callback){
        var deferred = Q.defer();
        var maps = params.mapsNoHistory;

        if (!maps[0].history[0].nodes) {
                maps[0].history[0].nodes = [];
        }
        if (!maps[0].history[0].connections) {
            maps[0].history[0].connections = [];
        }
        if (!maps[0].anonymousShare) {
            maps[0].anonymousShare = false;
        } else {
                //TODO: remove this dependency
            maps[0].anonymousShareLink = share[0].constructSharingURL(params.req, params.mapId);
        }
        if(!maps[0].preciseShare){
            maps[0].preciseShare = [];
        }
        
        params.mapToDisplay = maps[0];
        deferred.resolve(params);
        return deferred.promise.nodeify(callback);
    };
    
    var _preparePartialUpdateHistoryEntry = function(params, callback){
        var deferred = Q.defer();
        var map = params.mapsNoHistory[0];

        // clone last history entry
        var historyEntry = (JSON.parse(JSON.stringify(map.history[0])));
        historyEntry.serverDate = new Date();
        historyEntry[params.load.pk] = params.load.value;
        
        params.historyEntry = historyEntry;
        deferred.resolve(params);
        return deferred.promise.nodeify(callback);
    };
    
    var _saveHistoryEntry = function(params, callback){
        var deferred = Q.defer();
        var map = params.mapsNoHistory[0];

        db.maps.findAndModify({
            query : {
                userIdGoogle : params.userId,
                _id : params.mapId,
                deleted : false
            /* don't modify deleted maps */
            },
            update : {
                $push : {
                    history : params.historyEntry
                }
            },
        }, function(err, object) {
            if (err !== null) {
                logger.error(err);
                deferred.reject(err);
            } else {
                deferred.resolve(params);
            }
        });
        
        return deferred.promise.nodeify(callback);
    };
    
    var  _storeParentMap = function(params, callback){
        var deferred = Q.defer();
        
        var parentMapId = '' + params.mapId;
        var newMapId = '' + params._id;
        
        var relation = {
                type : 'clone',
                clonedSource : parentMapId,
                clonedTarget : newMapId
        };
        db.maprelations.save(relation, function(err, saved) {
            if (err !== null) {
                deferred.reject(err);
            }
            if (saved) {
                logger.debug("new relation", saved._id, "created");
                params.relationid = '' + saved._id;
//                console.log(saved);
                deferred.resolve(params);
            }
        });
        return deferred.promise.nodeify(callback);
    };
    
    var _findRelatedMaps = function(params, callback){
        var deferred = Q.defer();
        var mapId = params.req.params.mapid;

        var query = {
                type : 'clone',
                $or : [
                       {clonedSource : '' + mapId},
                       {clonedTarget : '' + mapId}
                       ]
        };
//        console.log(query);
        db.maprelations.find(query).toArray(function(err, relations) {
//            console.log(relations);
            if (err !== null) {
                deferred.reject(err);
            } else {
                params.relatedMaps = relations;
                deferred.resolve(params);
            }
        });
        return deferred.promise.nodeify(callback);
    };
    
    return {
        createNewMap : function (req, res) {

            preprocessNewMapRequest(req,res)
                .then(_saveMetaMap)
                .then(_initProgress)
                .then(_redirectToMapID)
                .catch(function(err){
                    logger.error.bind(logger)(err);
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 500;
                    res.send(JSON.stringify(err));
                    res.end();
                })
                .done();
        },
        
        cloneMap : function (req, res, mapId) {
            var userId = req.user.href;
            var mapId = db.ObjectId(mapId);
            
            var params = {userId : userId, mapId : mapId, progress : -1, res:res, req:req};
            
            logger.debug("cloning map", mapId, "for user", userId);
            
            _getRawMapsWithoutHistory(params)
                .then(_prepareMetadataToClone)
                .then(_saveMetaMap)
                .then(_initProgress)
                .then(_redirectToMapID)
                .then(_storeParentMap)
                .catch(function(err){
                    logger.error.bind(logger)(err);
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 500;
                    res.send(JSON.stringify(err));
                    res.end();
                })
                .done();
        },
        
        findRelatedMaps : function (req, res) {
            var userId = req.user.href;
            var mapId = req.params.mapid;
            
            var params = {res:res, req:req, mapId : mapId};
            
            logger.debug("finding related maps for map", mapId);
            
            _findRelatedMaps(params)
            .then(function(params){
//                console.log(params);
                res.json(params.relatedMaps);
            })
                .catch(function(err){
                    logger.error.bind(logger)(err);
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 500;
                    res.send(JSON.stringify(err));
                    res.end();
                })
                .done();
        },
        
/*        createNewSubMap : function (req, res) {

            preprocessNewSubMapRequest(req,res)
                .then(_saveMetaMap)
                .then(_initProgress)
                .then(_redirectToMapID)
                .catch(function(err){
                    logger.error.bind(logger)(err);
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 500;
                    res.send(JSON.stringify(err));
                    res.end();
                })
                .done();
        },*/

        deleteMap : function(req, res, mapId, redirect) {

            var userId = req.user.href;

            mapId = db.ObjectId(mapId);
            logger.debug("deleting map", mapId, "for user", userId);

            db.maps.findAndModify({
                query : {
                    userIdGoogle : userId,
                    _id : mapId,
                    deleted : false
                },
                update : {
                    $set : {
                        deleted : true
                    },
                    $push : {
                        // null object in the history
                        history : {
                            serverDate : new Date()
                        }
                    }
                },
                upsert : true,
            }, function(err, object) {
                if (err !== null) {
                    logger.error(err);
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 500;
                    res.send(JSON.stringify(err));
                } else {
                    if (!redirect) {
                        res.writeHead(200, {
                            'content-type' : 'text/html'
                        });
                        res.end();
                    } else {
                        res.redirect(redirect);
                    }
                }
            });

        },

        updateMap : function (req, res, mapId) {
            var userId = req.user.href;

            mapId = db.ObjectId(mapId);
            logger.debug("updating map", mapId, "for user", userId);
            var historyEntry = req.body;
            // objectID there, replace
            historyEntry._id = mapId;
            historyEntry.userId = userId;
            historyEntry.serverDate = new Date();
            

        for (var i = 0; i < historyEntry.nodes.length; i++ ) {
               var node = historyEntry.nodes[i];
                if (node.positionX < 0) {
                    node.positionX = 0;
                } else if (node.positionX > 1) {
                    node.positionX = 1;
                }
                if (node.positionY < 0) {
                    node.positionY = 0;
                } else if (node.positionY > 1) {
                    node.positionY = 1;
                }
            }

            logger.debug('map', historyEntry);

            db.maps.findAndModify({
                query : {
                    userIdGoogle : userId,
                    _id : mapId,
                    deleted : false
                /* don't modify deleted maps */
                },
                update : {
                    $push : {
                        history : historyEntry
                    }
                },
            }, function(err, object) {
                if (err !== null) {
                    logger.error(err);
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 500;
                    res.send(JSON.stringify(err));
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({}));
                    res.end();
                }
            });
        },

        partialMapUpdate : function (req, res, mapId) {
            var userId = req.user.href;
            var mapId = db.ObjectId(mapId);
            var load = req.body;
            var params = {userId : userId, mapId : mapId, load : load};
            
            logger.debug("updating map partially", mapId, "for user", userId, " request" + JSON.stringify(load));
            
            _getRawMapsWithoutHistory(params)
                .then(_preparePartialUpdateHistoryEntry)
                .then(_saveHistoryEntry)
                .then(function(p){
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({}));
                    res.end();
                })
                .catch(function(err){
                    logger.error(err);
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 500;
                    res.send(JSON.stringify(err));
                })
                .done();
        },

        getMap : function (req, mapId, callback) {

            var userId = req.user.href;
            mapId = db.ObjectId(mapId);
            
            var params = {userId : userId, 
                            mapId : mapId,
                            req : req};
            logger.debug("getting map", mapId, "for user", userId);

            _getRawMapsWithoutHistory(params)
                .then(_prepareMapToFullDisplay)
                .then(function(p){
                    callback(p.mapToDisplay);
                })
                .catch(logger.error.bind(logger))
                .done();
        },

        getMaps : function (req, callback) {
            var userId = req.user.href;

            logger.debug("getting maps for user", userId);
            
            var params = {userId : userId};

            _getRawMapsWithoutHistory(params)
                .then(_prepareRawMapsForDisplay)
                .then(function(p){
                    callback(p.mapsForDisplay);
                })
                .catch(function(err){
                    console.log(err);
                })
                .done();
        },

        getProgressState : function(req, mapId, finalCallback) {
            var userId = req.user.href;
            var mapId = db.ObjectId(mapId);
            var params = {userId : userId, mapId : mapId};
            
            _writeAccessCheck(params)
                .then(_getProgressNoAccessCheck)
                .then(finalCallback)
                .catch(function(err){
                    finalCallback(null,err);
                })
                .done();
        },

        advanceProgressState : function(req, mapId, finalCallback) {
            var userId = req.user.href;
            var mapId = db.ObjectId(mapId);
            var params = {userId : userId, mapId : mapId};
            
            _writeAccessCheck(params)
                .then(_advanceProgressNoAccessCheck)
                .then(finalCallback)
                .catch(function(err){
                    finalCallback(null,err);
                })
                .done();
        }
    };
};
module.exports = mapmodule;
