/** @jsx React.DOM */
var React = require('react');
var MapActions = require('./actions/mapactions');
var MapConstants = require('./constants/mapconstants');
var Glyphicon = require('react-bootstrap').Glyphicon;
var Dropdown = require('react-bootstrap').Dropdown;
var MenuItem = require('react-bootstrap').MenuItem;
var Badge = require('react-bootstrap').Badge;

var Download = React.createClass({
  getDownloadName : function(type){
    if(!this.props.store.getNameAndDescription()){
      return "notinitialized";
    }
    return this.props.store.getNameAndDescription().name + "." + type;
  },
  getDownloadLink : function(type){
    return "/api/" + type+"forcedownload/" + this.props.mapId + "/" + this.props.mapId + "." + type;
  },
  componentDidMount: function() {
    this.props.store.addChangeListener(this._onChange);
  },
  componentWillUnmount: function() {
    this.props.store.removeChangeListener(this._onChange);
  },
  _onChange : function() {
    this.forceUpdate();
  },
  render: function() {
    var _this = this;
    return (
      <Dropdown componentClass="li">
        <Dropdown.Toggle useAnchor>
          <Glyphicon glyph="download-alt"/> &nbsp;Download
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <MenuItem
              href={_this.getDownloadLink('svg')}
              download={_this.getDownloadName('svg')}>
              As SVG
            </MenuItem>
            <MenuItem
              href={_this.getDownloadLink('png')}
              download={_this.getDownloadName('png')}>
              As PNG <Badge>beta</Badge>
          </MenuItem>
        </Dropdown.Menu>
      </Dropdown>
    );
  }
});

module.exports = Download;
