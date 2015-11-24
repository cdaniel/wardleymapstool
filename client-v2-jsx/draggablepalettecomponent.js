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
        return (
            <Button href="#" style={outerStyle}>
                <div ref={
                    function(input){
                      jsPlumb.draggable(input, {
                          clone : 'true',
                          ignoreZoom:true,
                          grid:['50','50'],
                          containment:true,
                          stop : function(param){
                              //TODO: check whether drop has a valid target
                              var id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);
                              var target = {'top' : param.pos[1], 'left' : param.pos[0], id: id};
                              MapActions.createNodeFromDrop(target);
                          }
                      });
                    }
                  }>
                  <MapComponent inline  store={store}/>&nbsp; {this.props.name}
                </div>
            </Button>

        );
    }

});

module.exports = DraggablePaletteComponent;
