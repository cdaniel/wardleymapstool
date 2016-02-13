/* Copyright 2015 and Scott Weinstein and Krzysztof Daniel.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/

var config = {
    userProvider : 'stormpath'
};
try {
    config = require('../config.json');
} catch (ex) {

}

module.exports = function(app) {
    if (config.userProvider === 'stormpath') {
        var stormpathconfig = require('./config/stormpathconfig').stormpathconfig;
        var googleauth = require('./config/googleauth').googleauth;
        var stormpath = require('express-stormpath');
        var user = new require('./user')();

        app.use(stormpath.init(app, {
            debug: 'info, error',
            client: {
                apiKey: {
                  id: stormpathconfig.getApiKeyId(),
                  secret: stormpathconfig.getApiKeySecret()
                }
             },
            application: {
                href: stormpathconfig.getApplication()
            },
            website : true,
            api : true,
            postRegistrationHandler : function(account, req, res, next) {
                user.processLoginInfo(account, res, next);
            },
            socialProviders : {
                google : {
                    enabled : true,
                    clientId : googleauth.getClientID(),
                    clientSecret : googleauth.getClientSecret(),
                    callbackUri : '/callbacks/google',
                    scopes : 'https://www.googleapis.com/auth/userinfo.profile,https://www.googleapis.com/auth/userinfo.profile,https://www.googleapis.com/auth/userinfo.email'
                }
            },
            expand: {
                customData: true,
                providerData : true
            },
            web : {
                login: {
                    view: __dirname + '/../client/views/' + 'login.jade'
                },
                register : {
                    enable: true,
                    view: __dirname + '/../client/views/' + 'register.jade',
                    fields: {
                        givenName: {
                            required: false,
                            enabled: false
                        },
                        surname: {
                            required: false,
                            enabled: false
                        },
                        email : {
                            required: true
                        },
                        password : {
                            required: true
                        },
                        passwordConfirm : {
                            required: true
                        },
                        "tc" : {
                            required: true,
                            type: 'checkbox',
                            name:"tc",
                            placeholder:"I hereby accept terms and conditions"
                        },
                    },
                    fieldOrder: [ "email", "password", "passwordConfirm" ]
                }
            },
            templateContext : {
                toc : config.toc ? config.toc : false,
                tocupdate : config.tocupdate
            }
        }));

        return stormpath;
    }

    if (config.userProvider === 'os') {
        console.log('WARNING : development mode');
        console.log('WARNING : auth disabled');
        function osUserMiddleware(req, res, next) {
            req.user = {
                href : process.env.USER || process.env.USERNAME
            };
            next();
        }
        osUserMiddleware.loginRequired = function(req, res, next) {
            next();
        };
        osUserMiddleware.authenticationRequired = function(req, res, next) {
            next();
        };
        app.use(osUserMiddleware);
        return osUserMiddleware;
    }

    var someOtherProvider = require(config.userProvider);
    app.use(someOtherProvider);
    return someOtherProvider;
};
