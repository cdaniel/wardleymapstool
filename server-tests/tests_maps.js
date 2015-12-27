/* Copyright 2014, 2015 by Krzysztof Daniel

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/

var should = require('should');
var sinon = require('sinon');
var Q = require('q');
Q.longStackSupport = true;



describe('Maps', function() {
    var self = this;

    before(function() {
        self.db = new require('../server/db')("127.0.0.1:27017/tests");
        self.maps = new require('../server/maps')(self.db);
        self.exp = new require('../server/export')(self.db);
        self.share = new require('../server/router/share.js')('/share/map',self.db,function(a,b,c){c();},self.maps,self.exp);
    });

    function _createMap(params, callback){
        var deferred = Q.defer();
        var req = null;
        if(params && params.req){
            req = params.req;
        } else {
            req = {
                    user : {
                        href : 'wardleymapper'
                    },
                    body : {}
            };
            if(!params) {
                params = {};
            }
            params.req = req;
        }
        var res = {
                mapid : "",
                redirect : function(arg) {
                    if(arg.substr(0,5) !== '/map/'){
                        deferred.reject(new Error('wrong redirect ' + arg));
                    }
                    res.mapid = arg.substr(5);
                    if(res.mapid.length !== 24) {
                        deferred.reject(new Error('weird mapi length ' + res.mapid));
                    }
                    if(res.mapid.indexOf('/') !== -1) {
                        deferred.reject(new Error('mapid contains // ' + res.mapid));
                    }
                    params.mapid = res.mapid;
                    deferred.resolve(params);
                }
        };
        self.maps.createNewMap(req, res);
        return deferred.promise.nodeify(callback);
    }

    function _findMaps(params, callback){
        var deferred = Q.defer();
        var req = null;
        if(params && params.req){
            req = params.req;
        } else {
            req = {
                    user : {
                        href : 'wardleymapper'
                    },
                    body : {}
            };
            if(!params) {
                params = {};
            }
            params.req = req;
        }
        self.maps.getMaps(req, function(response){
            params.maps = response;
            deferred.resolve(params);
        });
        return deferred.promise.nodeify(callback);
    }

    function _getMap(params, callback){
        var deferred = Q.defer();
        var req = null;
        if(params && params.req){
            req = params.req;
        } else {
            req = {
                    user : {
                        href : 'wardleymapper'
                    },
                    body : {}
            };
            if(!params) {
                params = {};
            }
            params.req = req;
        }
        self.maps.getMap(req, params.mapid, function(map){
            if(map.code === 404){
                deferred.reject(map);
                return deferred.promise.nodeify(callback);
            }
          try{
              should(map).have.property('history');
              should(map.history[0]).have.property('nodes');
              should(map.history[0]).have.property('connections');
          }catch(e) {
              deferred.reject(e);
          }
          params.map = map;
          deferred.resolve(params);
        });
        return deferred.promise.nodeify(callback);
    }

    function _getProgress(params, callback){
        var deferred = Q.defer();
        var req = null;
        if(params && params.req){
            req = params.req;
        } else {
            req = {
                    user : {
                        href : 'wardleymapper'
                    },
                    body : {}
            };
            if(!params) {
                params = {};
            }
            params.req = req;
        }
        self.maps.getProgressState(req, params.mapid, function(r,err){
            if(err){
                var err2 = new Error();
                err2.code = err.code;
                deferred.reject(err2);
                return;
            }
            params.progress = r.progress;
            deferred.resolve(params);
        });
        return deferred.promise.nodeify(callback);
    }

    function _advanceProgress(params, callback){
        var deferred = Q.defer();
        var req = null;
        if(params && params.req){
            req = params.req;
        } else {
            req = {
                    user : {
                        href : 'wardleymapper'
                    },
                    body : {}
            };
            if(!params) {
                params = {};
            }
            params.req = req;
        }
        self.maps.advanceProgressState(req, params.mapid, function(r,err){
            if(err){
                var err2 = new Error();
                err2.code = err.code;
                deferred.reject(err2);
                return;
            }
            params.progress = r.progress;
            deferred.resolve(params);
        });
        return deferred.promise.nodeify(callback);
    }

    var _assertProgress = function(expectedProgress) {
        return function(params){
            return Q.Promise(function(resolve, reject, notify) {
                try {
                    should(params.progress).be.equal(expectedProgress);
                } catch (e){
                    reject(e);
                }
                resolve(params);
            });
        };
    };

    it('create a map', function(done){
        _createMap(null)
            .then (function (v) { done();  })
            .catch(function (e) { done(e); })
            .done();
    });

    it('verify map creation (create/list/get))', function(done){
        _createMap(null)
            .then(_findMaps)
            .then(function(params){
                return Q.Promise(function(resolve, reject, notify) {
                    var maps = params.maps;
                    should(maps.length).be.equal(1);
                    should(maps[0]).have.property('_id');
                    params.mapid = maps[0]._id;
                    resolve(params);
                });
            })
            .then(_getMap)
            .then (function (v) { done();  })
            .catch(function (e) { done(e); })
            .done();
    });

    it('list a map of another user', function(done){
        _createMap(null)
            .then(function(params){
                return Q.Promise(function(resolve, reject, notify) {
                    params.req.user.href = 'notawardleymapper';
                    resolve(params);
                });
            })
            .then(_findMaps)
            .then(function(params){
                return Q.Promise(function(resolve, reject, notify) {
                    var maps = params.maps;
                    should(maps.length).be.equal(0);
                    resolve(params);
                });
            })
            .then (function (v) { done();  })
            .catch(function (e) { done(e); })
            .done();
    });

    it('get a map of another user', function(done){
        _createMap(null)
            .then(function(params){
                return Q.Promise(function(resolve, reject, notify) {
                    params.req.user.href = 'notawardleymapper';
                    resolve(params);
                });
            })
            .then(_getMap)
            .then (function (v) {
                done(new Error('CAN GET A MAP OF ANOTHER USER'));
             })
            .catch(function (e) {
                if(e.code === 404){
                    done();
                } else {
                    done(e);
                }
            })
            .done();
    });

    it('get initial progress state for legacy map without progress', function(done) {
        var req = {
            user : {
                href : 'wardleymapper'
            }
        };

        var mapid = '54cfb4302f93942dca8ce8f5';
        self.maps.getProgressState(req, mapid, function(r,err) {
            try {
                should.exist(err);
                should.not.exist(r);
            } catch (e) {
                done(e);
                return;
            }
            done();
        });
    });

    it('get initial progress state', function(done){
        _createMap(null)
            .then(_findMaps)
            .then(function(params){
                return Q.Promise(function(resolve, reject, notify) {
                    var maps = params.maps;
                    should(maps.length).be.equal(1);
                    should(maps[0]).have.property('_id');
                    params.mapid = maps[0]._id;
                    resolve(params);
                });
            })
            .then(_getProgress)
            .then(_assertProgress(0))
            .then (function (v) { done();  })
            .catch(function (e) { done(e); })
            .done();
    });


    it('get initial progress state of another user map', function(done){
        _createMap(null)
        .then(_findMaps)
        .then(function(params){
            return Q.Promise(function(resolve, reject, notify) {
                var maps = params.maps;
                should(maps.length).be.equal(1);
                should(maps[0]).have.property('_id');
                params.mapid = maps[0]._id;
                resolve(params);
            });
        })
        .then(function(params){
                return Q.Promise(function(resolve, reject, notify) {
                    params.req.user.href = 'notawardleymapper';
                    resolve(params);
                });
            })
        .then(_getProgress)
        .then(_assertProgress(0))
        .then (function (v) { done(new Error('CAN GET A MAP PROGRESS OF ANOTHER USER'));  })
        .catch(function (e) {
            if(e.code === 403){
                done();
            } else {
                done(e);
            }})
        .done();
    });

    it('advance progress of other user map', function(done){
        _createMap(null)
        .then(_findMaps)
        .then(function(params){
            return Q.Promise(function(resolve, reject, notify) {
                var maps = params.maps;
                should(maps.length).be.equal(1);
                should(maps[0]).have.property('_id');
                params.mapid = maps[0]._id;
                resolve(params);
            });
        })
        .then(function(params){
                return Q.Promise(function(resolve, reject, notify) {
                    params.req.user.href = 'notawardleymapper';
                    resolve(params);
                });
            })
        .then(_advanceProgress)
        .then (function (v) { done(new Error('CAN UPDATE A MAP PROGRESS OF ANOTHER USER'));  })
        .catch(function (e) {
            if(e.code === 403){
                done();
            } else {
                done(e);
            }})
        .done();
    });



    it('test advancing progress state', function(done){
        _createMap(null)
        .then(_findMaps)
        .then(function(params){
            return Q.Promise(function(resolve, reject, notify) {
                var maps = params.maps;
                should(maps.length).be.equal(1);
                should(maps[0]).have.property('_id');
                params.mapid = maps[0]._id;
                resolve(params);
            });
        })
        .then(_getProgress)
        .then(_assertProgress(0))

        .then(_advanceProgress)
        .then(_getProgress)
        .then(_assertProgress(1))

        .then(_advanceProgress)
        .then(_getProgress)
        .then(_assertProgress(2))

        .then(_advanceProgress)
        .then(_getProgress)
        .then(_assertProgress(3))


        .then(_advanceProgress)
        .then(_getProgress)
        .then(_assertProgress(4))

        .then (function (v) { done();  })
        .catch(function (e) { done(e); })

        .done();
    });


    it('anonymous sharing', function(done) {
        var req = {
            user : {
                href : 'wardleymapper'
            },
            body : {},
            headers : {
                referer : 'http://127.0.0.1:8080',
                host : '127.0.0.1:8080'
            }
        };
        var params = {req:req};

        _createMap(params)
        .then(_findMaps)
        .then(function(params){
            return Q.Promise(function(resolve, reject, notify) {
                var maps = params.maps;
                should(maps.length).be.equal(1);
                should(maps[0]).have.property('_id');
                params.mapid = maps[0]._id;
                resolve(params);
            });
        })
        //share anonymous
        .then(function(params){
            return Q.Promise(function(resolve, reject, notify) {
                self.share.share(params.req, params.res, params.req.user.href, self.db.ObjectId(params.mapid), 'anonymous', function(result, err) {
                    params.shareResult = result.shareResult;
                    resolve(params);
                });
            });
        })
        .then(function(params){
            return Q.Promise(function(resolve, reject, notify) {
                try {
                    var req2 = {
                            user : {
                                email : ''
                            }
                        };
                        var res2 = {
                            setHeader : function(header,value) {
                                //TODO: verify that each header is set just once.
                                params.svgShareHeader = {header:header,value:value};
                            },
                            send : function(arg) {
//                                console.log(arg); TODO: verify
                                params.svgShareSent = arg;
                                resolve(params);
                            }
                        };
                    should(params.shareResult).have.property('url').which.is.equal('http://127.0.0.1:8080/share/map/anonymous/' + params.mapid + '/map.svg');
                    self.exp.createSharedSVG(req2, res2, params.mapid, 'map.svg');
                } catch(e){
                    reject(e);
                }
            });
        })

        //unshare anonymous
        .then(function(params){
            return Q.Promise(function(resolve, reject, notify) {
                self.share.share(params.req, params.res, params.req.user.href, self.db.ObjectId(params.mapid), 'unshareanonymous', function(result) {
                    params.shareResult = result;
                    resolve(params);
                });
            });
        })
        .then(function(params){
            return Q.Promise(function(resolve, reject, notify) {
                try {
                    var req2 = {
                            user : {
                                email : ''
                            },
                            params : {
                              mapid : params.mapid
                            }
                        };
                        var res2 = {
                            setHeader : function(header,value) {
                                //TODO: verify that each header is set just once.
//                                params.svgShareHeader = {header:header,value:value};
                            },
                            send : function(arg) {
//                                console.log(arg); TODO: verify
//                                params.svgShareSent = arg;
                                if(arg.anonymousShare){
                                  reject(new Error('Map should not be rendered when it is not shared'));
                                } else {
                                  resolve(params);
                                }
                            },
                            json : function(arg) {
//                                console.log(arg); TODO: verify
//                                params.svgShareSent = arg;
                                if(arg.anonymousShare){
                                  reject(new Error('Map should not be rendered when it is not shared'));
                                } else {
                                  resolve(params);
                                }
                            },
                            redirect : function(target) {
//                                console.log(target);
                                resolve(params);
                            }
                        };
                        self.share.getInfo(req2,res2,'', params.mapid);
                    // self.exp.createSharedSVG(req2, res2, params.mapid, 'map.svg');
                } catch(e){
                    reject(e);
                }
            });
        })

        .then (function (v) { done();  })
        .catch(function (e) { done(e); })

        .done();

    });


//     it('precise share', function(done) {
//         var req = {
//             user : {
//                 href : 'wardleymapper'
//             },
//             body : {},
//             headers : {
//                 referer : 'http://127.0.0.1:8080',
//                 host : '127.0.0.1:8080'
//             },
//             param : function(key){
//                 if(key === 'to'){
//                     return ['b','c'];
//                 }
//             }
//         };
//         var params = {req:req};
//
//         _createMap(params)
//         .then(_findMaps)
//         .then(function(params){
//             return Q.Promise(function(resolve, reject, notify) {
//                 var maps = params.maps;
//                 should(maps.length).be.equal(1);
//                 should(maps[0]).have.property('_id');
//                 params.mapid = maps[0]._id;
//                 resolve(params);
//             });
//         })
//         //share to b & c
//         .then(function(params){
//             return Q.Promise(function(resolve, reject, notify) {
//                 self.share.share(params.req, params.req.user.href, self.db.ObjectId(params.mapid), 'precise', function(result) {
//                     params.shareResult = result;
//                     resolve(params);
//                 });
//             });
//         })
//         // verify b has access
//         .then(function(params){
//             return Q.Promise(function(resolve, reject, notify) {
//                 try {
//                     var req2 = {
//                             user : {
//                                 href : 'b',
//                                 email:'b'
//                             }
//                     };
//                     var res2 = {
//                          setHeader : function(header,value) {
//                                //TODO: verify that each header is set just once.
//                                 params.svgShareHeader = {header:header,value:value};
//                          },
//                          send : function(arg) {
// //                                console.log(arg); TODO: verify
//                                 params.svgShareSent = arg;
//                                 resolve(params);
//                          },
//                          redirect : function(){
//                              sinon.assert.fail('should have access to the map here');
//                          }
//                     };
//                     should(params.shareResult).have.property('url').which.is.equal('http://127.0.0.1:8080/share/map/precise/' + params.mapid + '/map.svg');
//                     self.exp.createSharedSVG(req2, res2, params.mapid, 'map.svg');
//                 } catch(e){
//                     reject(e);
//                 }
//             });
//         })
//
//         // verify c has access
//         .then(function(params){
//             return Q.Promise(function(resolve, reject, notify) {
//                 try {
//                     var req2 = {
//                             user : {
//                                 href : 'c',
//                                 email:'c'
//                             }
//                     };
//                     var res2 = {
//                          setHeader : function(header,value) {
//                                //TODO: verify that each header is set just once.
//                                 params.svgShareHeader = {header:header,value:value};
//                          },
//                          send : function(arg) {
// //                                console.log(arg); TODO: verify
//                                 params.svgShareSent = arg;
//                                 resolve(params);
//                          },
//                          redirect : function(){
//                              sinon.assert.fail('should have access to the map here');
//                          }
//                     };
//                     should(params.shareResult).have.property('url').which.is.equal('http://127.0.0.1:8080/share/map/precise/' + params.mapid + '/map.svg');
//                     self.exp.createSharedSVG(req2, res2, params.mapid, 'map.svg');
//                 } catch(e){
//                     reject(e);
//                 }
//             });
//         })
//
//         // verify d has no access
//         .then(function(params){
//             return Q.Promise(function(resolve, reject, notify) {
//                 try {
//                     var req2 = {
//                             user : {
//                                 href : 'd',
//                                 email:'d'
//                             }
//                     };
//                     var res2 = {
//                          setHeader : function(header,value) {
//                                //TODO: verify that each header is set just once.
//                                 params.svgShareHeader = {header:header,value:value};
//                          },
//                          send : function(arg) {
//                                 sinon.assert.fail('should have access to the map here');
//                          },
//                          redirect : function(){
//                              resolve(params);
//                          }
//                     };
//                     should(params.shareResult).have.property('url').which.is.equal('http://127.0.0.1:8080/share/map/precise/' + params.mapid + '/map.svg');
//                     self.exp.createSharedSVG(req2, res2, params.mapid, 'map.svg');
//                 } catch(e){
//                     reject(e);
//                 }
//             });
//         })
//
//         .then (function (v) { done();  })
//         .catch(function (e) { done(e); })
//
//         .done();
//     });


    it('map cloning', function(done){
        _createMap(null)
        .then(_findMaps)
        .then(function(params){
            return Q.Promise(function(resolve, reject, notify) {
                var maps = params.maps;
                should(maps.length).be.equal(1);
                should(maps[0]).have.property('_id');
                params.mapid = maps[0]._id;
                resolve(params);
            });
        })
        //clone the map
        .then(function(params){
            return Q.Promise(function(resolve, reject, notify) {
                var res = {
                        redirect : function(url){
                            // the last arg /map/561013b770184042513e307c
                            var clonedMapId = url.split('/')[2];
                            params.clonedMapId = clonedMapId;
                            resolve(params);
                        }
                };
                self.maps.cloneMap(params.req, res, params.mapid);
            });
        })

        .then(_findMaps)
        // verify there are two maps
        .then(function(params){
            return Q.Promise(function(resolve, reject, notify) {
                try{
                    var maps = params.maps;
                    should(maps.length).be.equal(2);
                    should(maps[0]).have.property('_id');
                    should(maps[1]).have.property('_id');
                    resolve(params);
                }catch(e){
                    reject(e);
                }
            });
        })

        //verify maps are related
        .then(function(params){
            return Q.Promise(function(resolve, reject, notify) {
                try{
                    params.req.params = {mapid:params.mapid}; //set the map to query
                    var res = {
                            json : function(data){
                                var relation = data[0];
                                should(relation).have.property('type').which.is.equal('clone');
                                should(relation).have.property('clonedSource').which.is.equal(''+params.mapid);
                                should(relation).have.property('clonedTarget').which.is.equal(''+params.clonedMapId);
                                resolve(params);
                            }
                    };
                    self.maps.findRelatedMaps(params.req, res);
                }catch(e){
                    reject(e);
                }
            });
        })
        //verify maps are related both ways
        .then(function(params){
            return Q.Promise(function(resolve, reject, notify) {
                try{
                    params.req.params = {mapid:params.clonedMapId}; //set the map to query
                    var res = {
                            json : function(data){
                                var relation = data[0];
                                should(relation).have.property('type').which.is.equal('clone');
                                should(relation).have.property('clonedSource').which.is.equal(''+params.mapid);
                                should(relation).have.property('clonedTarget').which.is.equal(''+params.clonedMapId);
                                resolve(params);
                            }
                    };
                    self.maps.findRelatedMaps(params.req, res);
                }catch(e){
                    reject(e);
                }
            });
        })

         //delete a map
        .then(function(params){
            return Q.Promise(function(resolve, reject, notify) {
                try{
                    var res = {
                        send : function(arg){
                            sinon.assert.fail('error while deleting a map');
                        },
                        writeHead : function(){
                            //noop
                        },
                        end : function(){
                            //deletion successful
                            resolve(params);
                        }
                    };
                    self.maps.deleteMap(params.req, res, params.clonedMapId);
                    params.req.params = {mapid:params.clonedMapId}; //set the map to query
                    var res = {
                            json : function(data){
                                var relation = data[0];
                                should(relation).have.property('type').which.is.equal('clone');
                                should(relation).have.property('clonedSource').which.is.equal(''+params.mapid);
                                should(relation).have.property('clonedTarget').which.is.equal(''+params.clonedMapId);
                                resolve(params);
                            }
                    };
                    self.maps.findRelatedMaps(params.req, res);
                }catch(e){
                    reject(e);
                }
            });
        })
         // verify there is no relation
        .then(function(params){
            return Q.Promise(function(resolve, reject, notify) {
                    params.req.params = {mapid:params.mapid}; // set the map
                                                                // to query
                    var res = {
                            json : function(data){
                                try{
                                should(data).have.property('length').which.is.equal(0);
                                resolve(params);
                                }catch(e){
                                    reject(e);
                                }
                            },
                            setHeader : function(arg){
                                 // reject(new Error(arg); //this happens only in case of error
                            }
                    };
                    self.maps.findRelatedMaps(params.req, res);
            });
        })

        .then (function (v) { done();  })
        .catch(function (e) { done(e); })

        .done();

    });

    afterEach(function(done){
        self.db.dropDatabase(function(){
            done();
        });
    });
    after(function() {
        self.db.dropDatabase();
    });

});
