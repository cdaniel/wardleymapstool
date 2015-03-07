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
                    mapid = arg.substr(5);
                    if(mapid.length != 24) {
                        done('weird mapi length ' + mapid);
                    }
                    if(mapid.indexOf('/') !== -1) {
                        done('mapid contains // ' + mapid);
                    }
                    done();
                }
        }
        self.maps.createNewMap(req, res);
    });

    after(function() {
        self.db.collection('maps').drop();
    });

});
