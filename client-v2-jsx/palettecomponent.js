/** @jsx React.DOM */
var React = require('react');
var Button = require('react-bootstrap').Button;
var MapComponent = require('./mapcomponent');
var MapActions = require('./actions/mapactions');

var outerStyle = {
    position: 'relative'
};

var PaletteComponent = React.createClass({
  handleClickMove : function(event){
    MapActions.toggleDrop();
  },
    render: function() {
      var toggle = this.props.toggle;
      if(toggle){
        toggle = this.handleClickMove;
      }
      var store = this.props.store;
        return (
            <Button href="#" style={outerStyle} onClick={toggle}>
                <div ref={
                    function(input){
                      jsPlumb.draggable(input, {
                          clone : 'true',
                          ignoreZoom:true,
                          grid:['50','50'],
                          stop : function(param){
                              //TODO: check whether drop has a valid target
                              var target = {'top' : param.pos[1], 'left' : param.pos[0]};
                              MapActions.createNodeFromDrop(target);
                          }
                      });
                    }
                  }>
                    <MapComponent inline  store={store} />&nbsp; {this.props.name}
                </div>
            </Button>

        );
    }

});

module.exports = PaletteComponent;
