/** @jsx React.DOM */
global.jQuery = require('jquery');

var React = require('react');
var ReactDom = require('react-dom');
var MapEditor = require('./mapeditor.js');
ReactDom.render(<MapEditor/>, document.getElementById('editorplaceholder'));
