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

module.exports = function(maps, exportmap){
    var module = {};

    
    module.router = require('express').Router();

    //create a map
    module.router.post('/map/' , function(req, res) {
    	maps.createNewMap(req, res);
    });
    
    //create a map
    module.router.post('/map/partial/:mapid' , function(req, res) {
    	maps.partialMapUpdate(req, res, req.params.mapid);
    });
    
	// 2b. update a map
    module.router.post('/map/:mapid', function(req, res) {
		maps.updateMap(req, res, req.params.mapid);
	});

	// 4. delete a map
	module.router.delete('/map/:mapid', function(req, res) {
		maps.deleteMap(req, res, req.params.mapid);
	});

	// 4a. delete a map
	// workaround for the lack of get from the link
	// we operate with this as with a regular delete, and we perform
	// redirection to home.
	module.router.get('/map/delete/:mapid', function(req, res) {
		maps.deleteMap(req, res, req.params.mapid, "/");
	});

	module.router.get('/map/:mapid', function(req, res) {
		maps.getMap(req, req.params.mapid, res.send.bind(res));
	});


	// progress
	module.router.get('/map/:mapid/progressstate', function(req, res) {
		maps.getProgressState(req, req.params.mapid, function(progress) {
			res.json(progress);
		});
	});

	// progress
	module.router.put('/map/:mapid/progressstate', function(req, res) {
		maps.advanceProgressState(req, req.params.mapid, function(progress, err) {
		    if(err){
		        res.json({progress:-1});
		    } else {
		        res.json(progress);
		    }
		});
	});
	
	// 6. export
	module.router.get('/svg/:mapid/:name', function(req,
			res) {
		exportmap.createSVG(req, res, req.params.mapid, req.params.name, {format:'svg'});
	});
	
	module.router.get('/svgforcedownload/:mapid/:name', function(req,
            res) {
        exportmap.createSVG(req, res, req.params.mapid, req.params.name, {forcedownload:true, format:'svg'});
    });
	
	module.router.get('/pngforcedownload/:mapid/:name', function(req,
            res) {
        exportmap.createSVG(req, res, req.params.mapid, req.params.name, {forcedownload:true, format:'png'});
    });

	module.router.get('/thumbnail/:mapid', function(req,
			res) {
		exportmap.createThumbnail(req, res, req.params.mapid);
	});

    return module;
};