/** @jsx React.DOM */
var React = require('react');
var ButtonGroup = require('react-bootstrap').ButtonGroup;
var Well = require('react-bootstrap').Well;
var Button = require('react-bootstrap').Button;
var form = require('react-bootstrap').Form;
var MapComponent = require('./mapcomponent');
var ActionPaletteComponent = require('./actionpalettecomponent');
var DraggablePaletteComponent = require('./draggablepalettecomponent');
var MapActions = require('./actions/mapactions');
var MapConstants = require('./constants/mapconstants');
var EditableShortText = require('./editableshorttext');

var styleToEdit = {
  borderBottom: '1px dashed #999',
  display: 'inline'
};
var formStyle = {
  margin:'-15px -240px'
};
var MapTitleDescription = React.createClass({
  editablename : null,
  editabledescription : null,
  componentDidMount: function() {
    this.props.store.addChangeListener(this._onChange);

  },
  componentWillUnmount: function() {
    this.props.store.removeChangeListener(this._onChange);
  },
  componentDidUpdate : function() {
    if(this.editabledescription){
      $(this.editabledescription).editable();
    }
  },
  render: function() {
    if(this.state){
      var name = this.state.name;
      var description = this.state.description;
      var _this = this;
      return (
        <h4>
          <form className="form-horizontal" >
            <div style={formStyle}>
              <EditableShortText
                text={name}
                label="Title:"
                placeholder="EnterTitle"
                parameterName="name"
                onChange={MapActions.changeName}
                updateOnBlur="true"/>
            </div>
            <div style={formStyle}>
              <small>
                <EditableShortText
                  text={description}
                  label="Description:"
                  placeholder="Enter Description"
                  parameterName="description"
                  onChange={MapActions.changeDescription}
                  updateOnBlur="true"/>
              </small>
            </div>
          </form>
        </h4>
      );
    } else {
      return (
        <h4>Loading title & description </h4>
      );
    }
  },
  _onChange : function() {
    this.setState(this.props.store.getNameAndDescription());
  },
  _dataChanged : function(a,b,c){
    console.log(a,b,c);
  },
  _customValidateText : function(){
    return true;
  }
});

module.exports = MapTitleDescription;
