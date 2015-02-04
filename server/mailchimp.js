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
var config = require('./config/mailchimpconfig').mailchimpconfig;

var api = require('mailchimp-api');
var mc_implementation = new api.Mailchimp(config.apiKey);
var logger = require('./util/log.js').log.getLogger('mailchimp');
logger.setLevel('ALL');

function exportToMailChimp(firstName, lastName, email, next) {

	if (!config.enabled) {
		console.log('mailchimp account not configured');
		return;
	}

	var merge_vars = {
		FNAME : firstName,
		LNAME : lastName
	};
/*	mc_implementation.lists.list({},function(data) {
		console.log(data);
		if (next)
			next();
	}, function(error) {
		console.log(error)
		if (next)
			next();
	});*/
	mc_implementation.lists.subscribe({
		id : config.listId,
		email : {
			email : email
		},
		merge_vars : merge_vars,
		double_optin : 'false'
	}, function(data) {
		// gently ignore
		logger.debug(data);
		if (next)
			next();
	}, function(error) {
		logger.error(error)
		if (next)
			next();
	});

}

exports.exportToMailChimp = exportToMailChimp;