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

var MapTitleDescription = React.createClass({
    componentDidMount: function() {
      this.props.store.addChangeListener(this._onChange);
    },
    componentWillUnmount: function() {
      this.props.store.removeChangeListener(this._onChange);
    },
    render: function() {
      if(this.state){
        var name = this.state.name;
        var description = this.state.description;
        return (
          <h4>Title: <span style={styleToEdit}><InlineEdit
                        activeClassName="editing"
                        text={name}
                        paramName="name" /></span>
             <br/>
             <small>Description: <span style={styleToEdit}><InlineEdit
                           activeClassName="editing"
                           text={description}
                           paramName="description" /></span></small>
          </h4>
        );
      } else {
        return (
          <h4>Loading title...
             <br/>
             <small>Loading description</small>
          </h4>
        );
      }
    },
    _onChange : function() {
      this.setState(this.props.store.getNameAndDescription());
    }
});

module.exports = MapTitleDescription;
