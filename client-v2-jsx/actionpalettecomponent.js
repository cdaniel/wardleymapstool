/** @jsx React.DOM */
var React = require('react');
var Button = require('react-bootstrap').Button;
var MapComponent = require('./mapcomponent');
var MapActions = require('./actions/mapactions');

var outerStyle = {
    position: 'relative'
};

var ActionPaletteComponent = React.createClass({
    handleClickMove : function(event){
      MapActions.toggleMode(this.props.toggle);
    },
    render: function() {
      var target_function = this.handleClickMove;
      var store = this.props.store;
      //TODO: toggledState
        return (
            <Button href="#" style={outerStyle} onClick={target_function}>
                <div>
                    {this.props.name}
                </div>
            </Button>
        );
    }

});

module.exports = ActionPaletteComponent;
