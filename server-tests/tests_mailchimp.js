/* Copyright 2015 by Krzysztof Daniel

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/

var mailchimp = require('../server/mailchimp');
var should = require('should');
var sinon = require('sinon');

describe('Mailchimp', function() {

    describe('check integration', function() {

        it('subscribe', sinon.test(function(done) {
            mailchimp.exportToMailChimp('a', 'b', 'aaa@aa.a', done);
        }));

        it('check present', sinon.test(function(done) {
            mailchimp.isPresent('aaa@aa.a', function(found, error) {
                if (found) {
                    done();
                } else {
                    done(error);
                }
            });
        }));

        it('unsubscribe', sinon.test(function(done) {
            mailchimp.removeFromMailchimp('aaa@aa.a', done);
        }));

        it('check not present', sinon.test(function(done) {
            mailchimp.isPresent('aaa@aa.a', function(found, error) {
                if (!found && !error) {
                    done();
                } else {
                    done(error);
                }
            });
        }));
    });

});
