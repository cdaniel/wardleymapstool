/** @jsx React.DOM */
var React = require('react');
var Button = require('react-bootstrap').Button;
var MapComponent = require('./mapcomponent');
var MapActions = require('./actions/mapactions');
var jquery = require('jquery');

var outerStyle = {
    position: 'relative'
};

var ActionPaletteComponent = React.createClass({
    componentDidMount: function() {
      this.props.store.addChangeListener(this._onChange);
    },
    componentWillUnmount: function() {
      this.props.store.removeChangeListener(this._onChange);
    },
    _onChange: function() {
      this.setState(this.props.store.getAll());
    },
    getInitialState : function() {
      return {
        mapMode : null
      };
    },
    handleClickMove : function(event){
      MapActions.toggleMode(this.props.toggle);
    },
    render: function() {
      var target_function = this.handleClickMove;
      var store = this.props.store;
      var active = this.state.mapMode === this.props.toggle;
      var bsStyle = this.state.mapMode === this.props.toggle ? 'info' : 'default';
        return (
            <Button href="#" style={outerStyle} onClick={target_function} ref="button" active={active} bsStyle={bsStyle}>
                <div>
                    {this.props.name}
                </div>
            </Button>
        );
    }

});

module.exports = ActionPaletteComponent;
