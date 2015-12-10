/** @jsx React.DOM */
var React = require('react');
var Input = require('react-bootstrap').Input;
var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;
var Glyphicon = require('react-bootstrap').Glyphicon;
var MapConstants = require('./../constants/mapconstants');
var MapActions = require('./../actions/mapactions.js');
var $ = require('jquery');
var EditableShortText = require('./../editableshorttext');

var NodeEditDialog = React.createClass({
  getInitialState : function(){
     return {newName : null, newType : null};
  },
  componentDidMount: function() {
    this.props.store.addChangeListener(this._onChange);
  },
  componentWillUnmount: function() {
    this.props.store.removeChangeListener(this._onChange);
  },
  close : function(){
    MapActions.editNode(null, this.state);
    this.setState({newName : null, newType : null});
  },
  hide : function(){
    MapActions.editNode(null, null);
    this.setState({newName : null, newType : null});
  },
  onNameUpdate : function(value){
    this.setState({newName:value});
  },
  render: function() {
    var editedNode = this.props.store.getNodeBeingEdited();
    var show = editedNode !== null;
    var name = editedNode !== null ? editedNode.name : "";
    if(this.state.newName !== null){
      name = this.state.newName;
    }

    var type = null;
    if(editedNode !== null){
      if(editedNode.userneed){
        type = 'userneed';
      } else if (editedNode.external){
        type = 'external';
      } else {
        type = 'internal';
      }
    }
    if(this.state.newType !== null){
      type = this.state.newType;
    }
    return (
      <Modal show={show} onHide={this.hide}>
        <Modal.Header closeButton>
          <Modal.Title>
            Edit node
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form className="form-horizontal" >
            <EditableShortText
              text={name}
              label="Name"
              placeholder="Enter component name"
              parameterName="name"
              onChange={this.onNameUpdate}/>
            <Input
              type="select"
              label="Type"
              labelClassName="col-xs-2"
              wrapperClassName="col-xs-5"
              value={type}
              ref="typeselect"
              onChange={this._typeEdit}>
              <option value="userneed">
                User Need
              </option>
              <option value="internal">
                Internal
              </option>
              <option value="external">
                External
              </option>
            </Input>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  },
  _typeEdit : function(i){
    this.setState({newType : i.target.value});
  },
  _onChange : function() {
    this.setState(this.props.store.getSharedDialogState());
  }
});

module.exports = NodeEditDialog;
