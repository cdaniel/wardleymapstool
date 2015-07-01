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

ZeroClipboard.config( { swfPath: "/3rd/ZeroClipboard.swf" } );

var client = new ZeroClipboard();

var anonymousShareCheckbox = $('#sharedialog-anonymousshare');
var preciseShareCheckbox = $('#sharedialog-preciseshare');

var controls = $('#sharedialog-controls');
var preciseControlsLink = $('#sharedialog-precisecontrolslink');
var preciseControls = $('#sharedialog-precisecontrols');
var button = $('#sharedialog-copybutton');
var precisebutton = $('#sharedialog-precisecopybutton');
var text = $('#sharedialog-linktocopy');
var preciseText = $('#sharedialog-preciselinktocopy');

var preciseShareButton = $('#sharedialog-precisesharebutton');
var preciseShareEmailsText = $('#sharedialog-preciseshareemails');

var copyclient = new ZeroClipboard(button);
var copyclient2 = new ZeroClipboard(precisebutton);

var toggleAnonymousSharing = function() {
    var anonymousShareChecked = anonymousShareCheckbox.is(':checked');
    if (anonymousShareChecked) {
        $.ajax({
            type : 'PUT',
            url : shareURL + 'anonymous' /* defined in mapeditor.jade */,
            dataType : 'json',
            success : function(data) {
                text.text(data.url);
                controls.show();
            }
        });
    } else {
        $.ajax({
            type : 'PUT',
            url : shareURL + 'unshareanonymous' /* defined in mapeditor.jade */,
            dataType : 'json',
            success : function(data) {
                text.text('');
                controls.hide();
            }
        });
    }
};

var updatePreciseSharing = function(){
    var preciseShareChecked = preciseShareCheckbox.is(':checked');

    if (preciseShareChecked) {
        preciseControls.show();
    } else {
        $.ajax({
            type : 'PUT',
            url : shareURL + 'precise?to=' /* defined in mapeditor.jade */,
            dataType : 'json',
            success : function(data) {
                preciseControls.hide();
            }
        });
    }
}

var updatePreciseSharingTargets = function(){
    var emails = preciseShareEmailsText.val();
    if(emails == ''){
        $.ajax({
            type : 'PUT',
            url : shareURL + 'precise?to=' /* defined in mapeditor.jade */,
            dataType : 'json',
            success : function(data) {
                preciseControls.hide();
                preciseShareCheckbox.selected(false);
            }
        });
    }
    emails = encodeURIComponent(emails);
    $.ajax({
        type : 'PUT',
        url : shareURL + 'precise?to=' + emails /* defined in mapeditor.jade */,
        dataType : 'json',
        success : function(data) {
            preciseText.text(data.url);
            preciseControlsLink.show();
        }
    });
}

anonymousShareCheckbox.on('click', toggleAnonymousSharing);
preciseShareCheckbox.on('click', updatePreciseSharing);

preciseShareButton.on('click', updatePreciseSharingTargets);
