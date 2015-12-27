/** @jsx React.DOM */
var React = require('react');
var Input = require('react-bootstrap').Input;
var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;
var Glyphicon = require('react-bootstrap').Glyphicon;
var MapConstants = require('./../constants/mapconstants');
var MapActions = require('./../actions/mapactions.js');
var $ = require('jquery');

var MapSharingDialog = React.createClass({

  getInitialState : function(){
    return {
      sharingDialog:false,
      anonymousShare:false,
      anonymousShareLink:''
    };
  },

  componentDidMount: function() {
    this.props.store.addChangeListener(this._onChange);
    $.ajax({
        type : 'GET',
        url : '/share/map/' + this.props.mapId,
        dataType : 'json',
        success : function(data) {
            MapActions.loadSharingState(data);
        }
    });
  },

  componentWillUnmount: function() {
    this.props.store.removeChangeListener(this._onChange);
  },

  close : function(){
    MapActions.toggleSharingDialog();
  },

  onSubmit : function(key){
    key.preventDefault();
    key.stopPropagation();
    return false;
  },

  toggleAnonymousSharing : function(){
    if (!this.state.anonymousShare) {
        $.ajax({
            type : 'PUT',
            url : '/share/map/' + this.props.mapId + '/anonymous',
            dataType : 'json',
            success : function(data) {
                MapActions.toggleAnonymousSharing(data.url);
            }
        });
    } else {
        $.ajax({
            type : 'PUT',
            url : '/share/map/' + this.props.mapId + '/unshareanonymous',
            dataType : 'json',
            success : function(data) {
                MapActions.toggleAnonymousSharing(null);
            }
        });
    }
  },

  render: function() {
    var show = this.state.sharingDialog;

    var isNotSharedAnonymously =  ! this.state.anonymousShare;
    var anonymousShareLink = this.state.anonymousShareLink;
    var glyph = <Button><Glyphicon glyph="copy" /></Button>;
    var anonymousShareBlock = function(){
      if(isNotSharedAnonymously === true){
        return null;
      } else {
        return ( <Input type="text" value={anonymousShareLink} /> );
      }
    };
    return (
      <Modal show={show} onHide={this.close}>
        <Modal.Header closeButton>
          <Modal.Title>
            Share your map
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h4>Anonymously</h4>
          <form className="form-horizontal" onSubmit={this.onSubmit}>
          <Input
            type="checkbox"
            label="Share this map to anyone with the link"
            checked={!isNotSharedAnonymously}
            onClick={this.toggleAnonymousSharing}/>
          { anonymousShareBlock() }
        </form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  },
  _onChange : function() {
    this.setState(this.props.store.getSharedDialogState());
  }
});

module.exports = MapSharingDialog;
