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
          <form className="form-horizontal" >
            <div>
              <EditableShortText
                text={name}
                label="Title:"
                placeholder="EnterTitle"
                parameterName="name"
                onChange={MapActions.changeName}
                updateOnBlur="true"
                labelClassNameOverride="col-xs-2 col-sm-2 col-md-1 col-lg-1"
                wrapperClassNameOverride="col-xs-5 col-sm-4 col-md-3 col-lg-3"/>
            </div>
            <div>
              <small>
                <EditableShortText
                  text={description}
                  label="Description:"
                  placeholder="Enter Description"
                  parameterName="description"
                  onChange={MapActions.changeDescription}
                  updateOnBlur="true"
                  labelClassNameOverride="col-xs-2 col-sm-2 col-md-1 col-lg-1"
                  wrapperClassNameOverride="col-xs-5 col-sm-4 col-md-3 col-lg-3"/>
              </small>
            </div>
          </form>
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
  _customValidateText : function(){
    return true;
  }
});

module.exports = MapTitleDescription;
