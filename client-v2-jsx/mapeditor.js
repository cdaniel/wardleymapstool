/** @jsx React.DOM */
var React = require('react');
var Palette = require('./palette');
var MapCanvas = require('./mapcanvas');
var MapStore = require('./store/mapstore');

var mapEditorStyle = {
        minWidth : 800,
        color: 'green',
        minHeight : 600,
        height: 'auto',
        borderStyle: 'dotted',
        position: 'relative'
};




  var MapEditor = React.createClass({
    render: function() {
        return (
            <div style={mapEditorStyle}>
              <Palette store={MapStore}/>
              <MapCanvas ref={
                  function(input){
                    jsPlumb.setContainer(input);
                  }
                } store={MapStore}/>
            </div>
        );
    }
  });

  module.exports = MapEditor;
