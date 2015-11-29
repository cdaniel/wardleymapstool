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
  relatedConnections : [],
  relatedConnectionListeners : [],

  /**
  * each map component has to manage all the connections that are starting from it.
  * This is due to the fact that jsPlumb is not modularized and does plenty of
  * things on its own and therefore we cannot have React component for connections.
  * (at least not from the very begginning - in theory it could be possible to
  * intercept connection even and create it in the React first - TODO:)
  */
  componentWillUpdate : function (nextProps, nextState){
    var _this = this;
    var connections = nextProps.store.getAll().connections;
    _this.relatedConnections = [];
    for(var i = 0; i < connections.length; i++){
      if(connections[i].sourceId === _this.id){
        _this.relatedConnections.push(connections[i]);
      }
    }
  },
  connectionDelete : function(_conn){
    jsPlumb.detach(_conn); //remove from jsPlumb
    MapActions.deleteConnection(_conn); //update the state
  },
  componentDidUpdate : function ( prevProps,  prevState){

    if(this.props.mapMode === MapConstants.MAP_EDITOR_DRAG_MODE){
      var _this = this;
      jsPlumb.draggable(this.id, {
        ignoreZoom:true,
        containment:true,
        grid: [50,50],
        stop : function(params){
          MapActions.nodeDragged(
            {
                id:_this.id,
                pos: {
                  left : params.pos[0] / _this.props.canvasSize.width,
                  top : params.pos[1] / _this.props.canvasSize.height,

                }
            });
        }
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
    if(this.props.mapMode === MapConstants.MAP_EDITOR_DELETE_MODE){
      for(var i = 0; i < this.relatedConnections.length; i++){
        var conn =  this.relatedConnections[i].conn.connection;
        conn.bind('click', this.connectionDelete);
      }
    } else {
      for(var j = 0; j < this.relatedConnections.length; j++){
        this.relatedConnections[j].conn.connection.unbind('click');
      }
    }
    //TODO: check if all connections exist and reconcile them
  },

  delete : function(){
    jsPlumb.detachAllConnections(this.id);
    jsPlumb.removeAllEndpoints(this.id);
    jsPlumb.detach(this.id);
    MapActions.deleteNode(this.id);
  },

  render: function() {
    var that = this;

    var styleToSet = _.clone(mapComponentStyle);
    if(that.props.inline){
      styleToSet = _.extend(styleToSet, inlinedStyle);
    } else {
      styleToSet = _.extend(styleToSet, nonInlinedStyle);
    }
    styleToSet = _.extend(styleToSet, that.props.styleOverride);

    if(that.props.position){
      this.left = this.props.position.positionX * this.props.canvasSize.width;
      styleToSet.left = this.left;
      this.top = this.props.position.positionY * this.props.canvasSize.height;
      styleToSet.top = this.top;
      this.positioned = true;
    }

    that.id = this.props.id;

    return (
      <div
        style={styleToSet}
        id={this.props.id}
        onClick={this.props.mapMode === MapConstants.MAP_EDITOR_DELETE_MODE ? this.delete : null}
        >
      </div>
    );
  }
});

module.exports = MapComponent;
