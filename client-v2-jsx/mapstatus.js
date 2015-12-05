/** @jsx React.DOM */
var React = require('react');
var ButtonGroup = require('react-bootstrap').ButtonGroup;
var Well = require('react-bootstrap').Well;
var Button = require('react-bootstrap').Button;
var MapComponent = require('./mapcomponent');
var ActionPaletteComponent = require('./actionpalettecomponent');
var DraggablePaletteComponent = require('./draggablepalettecomponent');
var MapActions = require('./actions/mapactions');
var MapConstants = require('./constants/mapconstants');
var InlineEdit = require('react-edit-inline');


var styleToEdit = {
  borderBottom: '1px dashed #999',
  display: 'inline'
};

var MapStatus = React.createClass({
    getInitialState: function() {
      return {state:'Loading...'};
    },
    componentDidMount: function() {
      this.props.store.addChangeListener(this._onChange);
    },
    componentWillUnmount: function() {
      this.props.store.removeChangeListener(this._onChange);
    },
    render: function() {
      if(!this.state.state){
        return null;
      }
      return <Button block disabled bsStyle='success' bsSize="xsmall">{this.state.state}</Button>;
    },
    _onChange : function() {
      this.setState(this.props.store.getStateInfo());
    }
});

module.exports = MapStatus;
