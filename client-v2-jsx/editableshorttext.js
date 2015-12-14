/** @jsx React.DOM */
var React = require('react');
var ButtonGroup = require('react-bootstrap').ButtonGroup;
var Well = require('react-bootstrap').Well;
var Button = require('react-bootstrap').Button;
var Input = require('react-bootstrap').Input;
var FormControls= require('react-bootstrap').FormControls;
var Glyphicon = require('react-bootstrap').Glyphicon;
var MapComponent = require('./mapcomponent');
var ActionPaletteComponent = require('./actionpalettecomponent');
var DraggablePaletteComponent = require('./draggablepalettecomponent');
var MapActions = require('./actions/mapactions');
var MapConstants = require('./constants/mapconstants');
var InlineEdit = require('react-edit-inline');
var ReactDOM = require('react-dom');

var styleToEdit = {
  borderBottom: '1px dashed #999',
  display: 'inline'
};


/**
* params:
* text to display
placeholder
label
* onChange - method to call
*/
var EditableShortText = React.createClass({
  getInitialState: function() {
    return {state:'text', newValue:null}; //also availabe 'hover' & 'edit'
  },
  componendDidMount : function(){
    if(this.refs.input){
      var domnode =  ReactDOM.findDOMNode(this.refs.input);
      if(domnode){
        domnode.onkeyup=this._keyListener;
        domnode.focus();
      }
    }
  },
  componentDidUpdate : function(){
    if(this.refs.input){
      var domnode = this.refs.input.getInputDOMNode();
      if(domnode){
        domnode.onkeyup=this._keyListener;
        var _this=this;
        domnode.onblur=function(){
          if(_this.props.updateOnBlur === 'true'){
            var _newValue = _this.state.newValue;
            _this.setState({state:'text', newValue: null});
            _this.props.onChange(_newValue);
          } else {
              _this.setState({state:'text', newValue : null});
          }
        };
        domnode.focus();
      }
    }
  },
  render: function() {
    var textToDisplay = this.state.newValue !== null ? this.state.newValue : this.props.text;
    if(this.state.state === 'text'){
      return (
        <FormControls.Static
          type="text"
          onMouseOver={this._onHover}
          value={textToDisplay}
          placeholder={this.props.placeholder}
          label={this.props.label}
          labelClassName="col-xs-2 col-sm-2 col-md-1 col-lg-1"
          wrapperClassName="col-xs-5 col-sm-4 col-md-3 col-lg-3"
          />
      );
    }
    if(this.state.state === 'hover'){
      var glyph  = (
        <Glyphicon glyph="edit">
        </Glyphicon>
      );
      return <FormControls.Static
        type="text"
        onMouseOut={this._onMouseOut}
        onClick={this._startEdit}
        value={textToDisplay}
        placeholder={this.props.placeholder}
        label={this.props.label}
        labelClassName="col-xs-2 col-sm-2 col-md-1 col-lg-1"
        wrapperClassName="col-xs-5 col-sm-4 col-md-3 col-lg-3"
        feedbackIcon={glyph}
        hasFeedback
        inline
        />;
    }
    if(this.state.state === 'edit'){
      var _this = this;
      return <Input
        type="text"
        value={textToDisplay}
        placeholder={this.props.placeholder}
        label={this.props.label}
        labelClassName="col-xs-2 col-sm-2 col-md-1 col-lg-1"
        wrapperClassName="col-xs-5 col-sm-4 col-md-3 col-lg-3"
        onChange={this._onEdit}
        ref="input"
        inline
        />;
    }
  },
  _onChange : function() {
    this.setState(this.props.store.getStateInfo());
  },
  _onHover : function(){
    this.setState({state:'hover'});
  },
  _onMouseOut : function(){
    this.setState({state:'text'});
  },
  _startEdit : function(){
    this.setState({state:'edit'});
  },
  _onEdit : function(i){
    this.setState({newValue : i.target.value});
  },
  _keyListener : function(key){
    if(key.keyCode === 27){ //esc
      this.setState({state:'text', newValue : null});
    }
    if(key.keyCode === 13){ //enter
      var _newValue = this.state.newValue;
      this.setState({state:'text', newValue: null});
      this.props.onChange(_newValue);
    }
  }
});

module.exports = EditableShortText;
