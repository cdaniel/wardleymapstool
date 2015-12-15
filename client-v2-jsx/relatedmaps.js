/** @jsx React.DOM */
var React = require('react');
var MapActions = require('./actions/mapactions');
var MapConstants = require('./constants/mapconstants');
var Glyphicon = require('react-bootstrap').Glyphicon;
var Dropdown = require('react-bootstrap').Dropdown;
var MenuItem = require('react-bootstrap').MenuItem;
var Badge = require('react-bootstrap').Badge;
var jquery = require('jquery');
var _async = require('async');

var RelatedMaps = React.createClass({
  _tempRelated : [],
  getInitialState : function(){
    return {related:[]};
  },
  componentDidMount: function() {
    var url = '/api/map/related/' + this.props.mapId;
    jquery.get(url, function(result) {
      this._tempRelated = result;
      this.fetchNames();
    }.bind(this));
  },
  fetchNames : function (){
    var _this = this;
    // for each prefetched map relation
    _async.map(_this._tempRelated, function(arg, clbck){
      // find out which map we need to fetch
      var interestingMapId = arg.clonedSource;
      if(arg.clonedSource === _this.props.mapId){
        interestingMapId = arg.clonedTarget;
      }
      // store a link to the 'other map'
      arg.link = "/map/" + interestingMapId;
      //fetch the 'other' map and get the name
      var url = "/api/map/" + interestingMapId;
      jquery.get(url, function(result) {
        arg.name = result.history[0].name;
        clbck(null, arg);
      });
    }, function(err){
      _this.setState({related:_this._tempRelated});
    });
  },
  render: function() {
    if(this.state.related.length === 0) {
      return null;
    }
    var _this = this;
    return (
      <Dropdown componentClass="li">
        <Dropdown.Toggle useAnchor>
          <Glyphicon glyph="duplicate"/> &nbsp;Map Variants
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {(function(){
              return _this.state.related.map(function(arg){
                return (
                  <MenuItem key={arg.link} href={arg.link}>
                    {arg.name}
                  </MenuItem>
                );
              });
            })()}
          </Dropdown.Menu>
        </Dropdown>
      );
    }
  });

  module.exports = RelatedMaps;
