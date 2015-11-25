/** @jsx React.DOM */
/** globals jsPlumb: false */

var React = require('react');
var _ = require('underscore');
var MapConstants = require('./constants/mapconstants');
var MapActions= require('./actions/mapactions');

var mapComponentStyle = {
  minHeight: 20,
  minWidth: 20,
  maxWidth: 20,
  maxHeight: 20,
  borderRadius: 10,
  zIndex: 2
};

var inlinedStyle = {
  display: 'inline-block',
  verticalAlign : 'middle'
};

var endpointOptions = {
        paintStyle:{ fillStyle:"transparent", outlineColor:'transparent' },
        allowLoopback:false,
        connector : "Straight",
        connectorStyle : {
          lineWidth : 2,
          strokeStyle : 'silver',
          outlineColor:"transparent",
          outlineWidth:10
        },
        endpoint : [ "Dot", {
          radius : 1
        } ],
        deleteEndpointsOnDetach : false,
        uniqueEndpoints : true
};


var nonInlinedStyle = {
  position: 'absolute'
};

var MapComponent = React.createClass({
  id : null,
  left : 0,
  top : 0,
  positioned : false,

  componentDidUpdate : function ( prevProps,  prevState){
    if(this.props.mapMode === MapConstants.MAP_EDITOR_DRAG_MODE){
      jsPlumb.draggable(this.id, {
        ignoreZoom:true,
        containment:true,
        grid: [50,50]
      });
      jsPlumb.setDraggable(this.id, true);
    } else {
      jsPlumb.setDraggable(this.id, false);
    }
    if(this.props.mapMode === MapConstants.MAP_EDITOR_CONNECT_MODE){
      jsPlumb.makeTarget(this.id, endpointOptions, {anchor: "TopCenter"});
      jsPlumb.makeSource(this.id, endpointOptions, {anchor : "BottomCenter"});
    } else {
      jsPlumb.unmakeSource(this.id);
      jsPlumb.unmakeTarget(this.id);
    }
  },

  delete : function(){
    jsPlumb.detachAllConnections(this.id);
    jsPlumb.removeAllEndpoints(this.id);
    jsPlumb.detach(this.id);
    MapActions.deleteNode(this.id);
  },

  render: function() {
    var that = this;

    if(that.props.inline){
      mapComponentStyle = _.extend(mapComponentStyle, inlinedStyle);
    } else {
      mapComponentStyle = _.extend(mapComponentStyle, nonInlinedStyle);
    }
    mapComponentStyle = _.extend(mapComponentStyle, that.props.styleOverride);

    if(that.props.position){
      this.left = this.props.position.positionX * this.props.canvasSize.width;
      mapComponentStyle.left = this.left;
      this.top = this.props.position.positionY * this.props.canvasSize.height;
      mapComponentStyle.top = this.top;
      this.positioned = true;
    }

    that.id = this.props.id;

    return (
      <div
        style={mapComponentStyle}
        id={this.props.id}
        onClick={this.props.mapMode === MapConstants.MAP_EDITOR_DELETE_MODE ? this.delete : null}
        >
      </div>
    );
  }
});

module.exports = MapComponent;
