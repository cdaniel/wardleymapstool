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

module.exports = function(context, authmiddleware, mapsmodule, exporter){
    var module = {};

    module.PRECISE = 'precise';
    module.ANONYMOUS = 'anonymous';

    /**
     * This function creates an url that can be used to share a map.
     * @param req - a request that is used to extract the host of the application running.
     * @param mapId - id of map to share
     * @param precise - true/false value indicating whether the map should be available to selected persons only
     * 
     * @return url to share.
     * 
     * It is actually necessary to rely on req, because otherwise we would not know where the map is located.
     */
    module.constructSharingURL = function (req, mapId, precise) {
        var mode = precise ? module.PRECISE : module.ANONYMOUS;

        var protocol = req.headers.referer ? req.headers.referer.split(':')[0] : 'http';

        var url_mainpart = protocol + '://' + req.headers.host;
        return url_mainpart + '/' + mode + '/' + mapId + '/map.svg';
    };

    module.router = require('express').Router();

    module.router.get('/' + module.ANONYMOUS + '/:mapid/:filename', function(req, res) {
        exporter.createSharedSVG(req, res, req.params.mapid, req.params.name);
    });

    module.router.get('/' + module.PRECISE + '/:mapid/:filename', authmiddleware, function(req, res) {
        exporter.createSharedSVG(req, res, req.params.mapid, req.params.name);
    });

    module.router.put('/:mapid/:mode', authmiddleware, function(req, res) {
        mapsmodule.share(req, req.params.mapid, req.params.mode, function(result) {
            res.json(result);
        });
    });

    return module;
};