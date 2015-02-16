var config = {
    userProvider: 'stormpath'
};
try {
     config = require('../config.json');
 } catch(ex) {

 }

 module.exports = function(app) {
    if (config.userProvider === 'stormpath') {
        var stormpathconfig = require('./config/stormpathconfig').stormpathconfig;
        var googleauth = require('./config/googleauth').googleauth;
        var stormpath = require('express-stormpath');

        return  stormpath
                .init(
                        app,
                        {
                            apiKeyId : stormpathconfig.getApiKeyId(),
                            apiKeySecret : stormpathconfig
                                    .getApiKeySecret(),
                            secretKey : stormpathconfig.getSecretKey(),
                            application : stormpathconfig
                                    .getApplication(),
                            postRegistrationHandler : function(account,
                                    res, next) {
                                user.normalizeLoginInfo(account, res,
                                        next);
                            },
                            enableGoogle : true,
                            social : {
                                google : {
                                    clientId : googleauth.getClientID(),
                                    clientSecret : googleauth.getClientSecret(),
                                },
                            },
                            expandProviderData : true,
                            expandCustomData : true
                        });
    }

    if (config.userProvider === 'os') {
        function osUserMiddleware(req, res, next) {
            req.user = {href: process.env.USER || process.env.USERNAME};
            next();
        }
        osUserMiddleware.loginRequired = function(req, res, next) {
            next();
        }
        return osUserMiddleware;
    }

    return require(config.userProvider);
 }
