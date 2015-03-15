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

var shareCheckbox = $('#sharedialog-anonymousshare');
var controls = $('#sharedialog-controls');
var button = $('#sharedialog-copybutton');
var text = $('#sharedialog-linktocopy');

var copyclient = new ZeroClipboard(button);

var toggleSharing = function() {
    var checked = shareCheckbox.is(':checked');
    if (checked) {
        $.ajax({
            type : 'PUT',
            url : anonymousshareURL + 'anonymous' /* defined in mapeditor.jade */,
            dataType : 'json',
            success : function(data) {
                text.text(data.url);
                controls.show();
            }
        });
    } else {
        $.ajax({
            type : 'PUT',
            url : anonymousshareURL + 'none' /* defined in mapeditor.jade */,
            dataType : 'json',
            success : function(data) {
                text.text('');
                controls.hide();
            }
        });
    }
};

shareCheckbox.on('click', toggleSharing);
