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

describe('Maps', function() {
    var self = this;

    before(function() {
        self.db = new require('../server/db')("127.0.0.1:27017/tests");
        self.maps = new require('../server/maps')(self.db);
        self.exp = new require('../server/export')(self.db);
        self.share = new require('../server/router/share.js')('/share/map',self.db,function(a,b,c){c();},self.maps,self.exp);
    });
    
    it('request without any parameters', function(done){
        var req = {
                user : {
                    href : 'wardleymapper'
                },
                body : {}
        };
        var res = {
                mapid : "",
                redirect : function(arg) {
                    if(arg.substr(0,5) !== '/map/'){
                        done('wrong redirect ' + arg);
                    }
                    res.mapid = arg.substr(5);
                    if(res.mapid.length != 24) {
                        done('weird mapi length ' + res.mapid);
                    }
                    if(res.mapid.indexOf('/') !== -1) {
                        done('mapid contains // ' + res.mapid);
                    }
                    done();
                }
        }
        self.maps.createNewMap(req, res);
    });
    
    it('get a map', function(done){
        var req = {
                user : {
                    href : 'wardleymapper'
                },
                body : {}
        };
        self.maps.getMaps(req, function(response){
            try{
                should(response.length).be.equal(1);
                should(response[0]).have.property('_id');
                
                var mapid = response[0]._id;
                self.maps.getMap(req, mapid, function(map){
                    try{
                        should(map).have.property('history');
                        should(map.history[0]).have.property('nodes');
                        should(map.history[0]).have.property('connections');
                        map.should.have.property('anonymousShare').which.is.equal(false);
                    }catch(e) {
                        done(e);
                    }
                });
            } catch (e) {
                done(e);
                return;
            }
            done();
        });
    });
    
    it('get a map without privileges', function(done){
        var req = {
                user : {
                    href : 'notawardleymapper'
                },
                body : {}
        };
        self.maps.getMaps(req, function(response){
            try{
                should(response.length).be.equal(0);
            } catch (e) {
                done(e);
                return;
            }
            done();
        });
    });
    
    it('get initial progress state', function(done){
        var req = {
                user : {
                    href : 'wardleymapper'
                }
        };
        self.maps.getMaps(req, function(response) {
            try {
                should(response.length).be.equal(1);
                should(response[0]).have.property('_id');

                var mapid = '' + response[0]._id;
                self.maps.getProgressState(req, mapid, function(r){
                    try{
                        should(r.progress).be.equal(0);
                    } catch (e) {
                        done(e);
                        return;
                    }
                    done();
                });
            } catch (e) {
                done(e);
                return;
            }
        });
    });
    
    it('get initial progress state for legacy map without progress', function(done) {
        var req = {
            user : {
                href : 'wardleymapper'
            }
        };

        var mapid = '54cfb4302f93942dca8ce8f5';
        self.maps.getProgressState(req, mapid, function(r) {
            try {
                should(r.progress).be.equal(-1);
            } catch (e) {
                done(e);
                return;
            }
            done();
        });
    });
    
    it('get initial progress state without privileges', function(done){
        var req = {
                user : {
                    href : 'wardleymapper'
                }
        };
        var req2 = {
                user : {
                    href : 'notawardleymapper'
                }
        };
        self.maps.getMaps(req, function(response) {
            try {
                should(response.length).be.equal(1);
                should(response[0]).have.property('_id');

                var mapid = '' + response[0]._id;
                self.maps.getProgressState(req2, mapid, function(r){
                    try{
                        should(r.progress).be.equal(-1);
                    } catch (e) {
                        done(e);
                        return;
                    }
                    done();
                });
            } catch (e) {
                done(e);
                return;
            }
        });
    });

    it('advance progress state without privileges', function(done){
        var req = {
                user : {
                    href : 'wardleymapper'
                }
        };
        var req2 = {
                user : {
                    href : 'notawardleymapper'
                }
        };
        self.maps.getMaps(req, function(response) {
            try {
                should(response.length).be.equal(1);
                should(response[0]).have.property('_id');

                var mapid = '' + response[0]._id;
                self.maps.advanceProgressState(req2, mapid, function(r){
                    try{
                        should(r.progress).be.equal(-1);
                    } catch (e) {
                        done(e);
                        return;
                    }
                    done();
                });
            } catch (e) {
                done(e);
                return;
            }
        });
    });
    
    it('advance progress state nr 1', function(done){
        var req = {
                user : {
                    href : 'wardleymapper'
                }
        };
        self.maps.getMaps(req, function(response) {
            try {
                should(response.length).be.equal(1);
                should(response[0]).have.property('_id');

                var mapid = '' + response[0]._id;
                self.maps.advanceProgressState(req, mapid, function(r){
                    try{
                        should(r.progress).be.equal(1);
                    } catch (e) {
                        done(e);
                        return;
                    }
                    done();
                });
            } catch (e) {
                done(e);
                return;
            }
        });
    });
    
    it('advance progress state nr 2', function(done){
        var req = {
                user : {
                    href : 'wardleymapper'
                }
        };
        self.maps.getMaps(req, function(response) {
            try {
                should(response.length).be.equal(1);
                should(response[0]).have.property('_id');

                var mapid = '' + response[0]._id;
                self.maps.advanceProgressState(req, mapid, function(r){
                    try{
                        should(r.progress).be.equal(2);
                    } catch (e) {
                        done(e);
                        return;
                    }
                    done();
                });
            } catch (e) {
                done(e);
                return;
            }
        });
    });
    
    it('advance progress state without privileges', function(done){
        var req = {
                user : {
                    href : 'wardleymapper'
                }
        };
        var req2 = {
                user : {
                    href : 'notawardleymapper'
                }
        };
        self.maps.getMaps(req, function(response) {
            try {
                should(response.length).be.equal(1);
                should(response[0]).have.property('_id');

                var mapid = '' + response[0]._id;
                self.maps.advanceProgressState(req2, mapid, function(r){
                    try{
                        should(r.progress).be.equal(-1);
                    } catch (e) {
                        done(e);
                        return;
                    }
                    done();
                });
            } catch (e) {
                done(e);
                return;
            }
        });
    });
    
    it('advance progress state nr 3', function(done){
        var req = {
                user : {
                    href : 'wardleymapper'
                }
        };
        self.maps.getMaps(req, function(response) {
            try {
                should(response.length).be.equal(1);
                should(response[0]).have.property('_id');

                var mapid = '' + response[0]._id;
                self.maps.advanceProgressState(req, mapid, function(r){
                    try{
                        should(r.progress).be.equal(3);
                    } catch (e) {
                        done(e);
                        return;
                    }
                    done();
                });
            } catch (e) {
                done(e);
                return;
            }
        });
    });
    
    it('advance progress state nr 4', function(done){
        var req = {
                user : {
                    href : 'wardleymapper'
                }
        };
        self.maps.getMaps(req, function(response) {
            try {
                should(response.length).be.equal(1);
                should(response[0]).have.property('_id');

                var mapid = '' + response[0]._id;
                self.maps.advanceProgressState(req, mapid, function(r){
                    try{
                        should(r.progress).be.equal(4);
                    } catch (e) {
                        done(e);
                        return;
                    }
                    done();
                });
            } catch (e) {
                done(e);
                return;
            }
        });
    });

    it('share a map to all', function(done) {
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
        self.maps.getMaps(req, function(response) {
            try {
                should(response.length).be.equal(1);
                should(response[0]).have.property('_id');

                var mapid = response[0]._id;
                self.share.share(req, req.user.href, self.db.ObjectId(mapid), 'anonymous', function(result) {
                    try {
                        var req2 = {
                            user : {
                                email : ''
                            }
                        };
                        var res2 = {
                            setHeader : function() {
                            },
                            send : function() {
                                done()
                            }
                        };
                        should(result).have.property('url').which.is.equal('http://127.0.0.1:8080/share/map/anonymous/' + mapid + '/map.svg');
                        self.exp.createSharedSVG(req2, res2, mapid, 'map.svg');
                    } catch (e) {
                        done(e);
                    }
                });
            } catch (e) {
                done(e);
                return;
            }
        });
    });
    
    
    it('unshare anonymous map', function(done) {
        var req = {
            user : {
                href : 'wardleymapper'
            },
            body : {}
        };
        self.maps.getMaps(req, function(response) {
            try {
                should(response.length).be.equal(1);
                should(response[0]).have.property('_id');

                var mapid = response[0]._id;
                self.share.share(req, req.user.href, self.db.ObjectId(mapid), 'unshareanonymous', function(result){
                    try {
                        var req2 = {
                            user:{
                                email : ''
                            }
                        };
                        var res2 = {
                            setHeader : function() {
                            },
                            send : function() {
                                done('map should not be rendered');
                            },
                            redirect : function() {
                                done();
                            }
                        };
                        should(result).not.have.property('url');
                        self.exp.createSharedSVG(req2, res2, mapid, 'map.svg');
                    } catch (e) {
                        done(e);
                    }
                });
            } catch (e) {
                done(e);
                return;
            }
        });
    });
    
    it('share a map to b & c', function(done) {
        var req = {
            user : {
                href : 'wardleymapper'
            },
            body : {},
            headers : {
                referer : 'http://127.0.0.1:8080',
                host : '127.0.0.1:8080'
            },
            param : function(key){
                if(key === 'to'){
                    return ['b','c'];
                }
            }
        };
        self.maps.getMaps(req, function(response) {
            try {
                should(response.length).be.equal(1);
                should(response[0]).have.property('_id');

                var mapid = response[0]._id;
                var req2 = {
                        user : {
                            href : 'b',
                            email:'b'
                        }
                };
                self.share.share(req, req.user.href, self.db.ObjectId(mapid), 'precise', function(result) {
                    try {
                        var res2 = {
                            setHeader : function() {
                            },
                            send : function() {
                                done();
                            },
                            redirect : function(){
                                sinon.assert.fail('should have access to the map here');
                            }
                        };
                        should(result).have.property('url').which.is.equal('http://127.0.0.1:8080/share/map/precise/' + mapid + '/map.svg');
                        self.exp.createSharedSVG(req2, res2, mapid, 'map.svg');
                    } catch (e) {
                        done(e);
                    }
                });
            } catch (e) {
                done(e);
                return;
            }
        });
    });

    after(function() {
        self.db.collection('maps').drop();
    });

});
