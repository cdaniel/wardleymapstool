/** @jsx React.DOM */
var React = require('react');
var Button = require('react-bootstrap').Button;
var MapComponent = require('./mapcomponent');
var MapActions = require('./actions/mapactions');

var outerStyle = {
    position: 'relative'
};

var DraggablePaletteComponent = React.createClass({
    render: function() {
      var store = this.props.store;
      var props = this.props;
        return (
            <Button href="#" style={outerStyle} bsStyle={null}>
                <div ref={
                    function(input){
                      jsPlumb.draggable(input, {
                          clone : 'true',
                          ignoreZoom:true,
                          grid:['50','50'],
                          containment:true,
                          stop : function(param){
                              var id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);
                              var target = {'top' : param.pos[1], 'left' : param.pos[0], id: id, key:props.key, styleOverride:props.styleOverride};
                              MapActions.createNodeFromDrop(target);
                          }
                      });
                    }
                  }>
                  <MapComponent inline  store={store} styleOverride={props.styleOverride}/>&nbsp; {this.props.name}
                </div>
            </Button>

        );
    }

});

module.exports = DraggablePaletteComponent;
