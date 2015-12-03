var MapDispatcher = require('../dispatcher/mapdispatcher');
var EventEmitter = require('events').EventEmitter;
var MapConstants = require('../constants/mapconstants');
var assign = require('object-assign');
var _ = require('underscore');


var _nodes = [];
var _nodesToCreate = [];
var _connections = [];

var mapMode = null;

var _map = null;

function createFromDrop(drop) {
  // Hand waving here -- not showing how this interacts with XHR or persistent
  // server-side storage.
  // Using the current timestamp + random number in place of a real id.
  var id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);
  _nodesToCreate.push({
    id: id,
    drop: drop
  });
  mapMode = null;
}

function normalize(params){
  var changed = false;
  var node;
  /* jshint -W084 */
  while( node = _nodesToCreate.pop() ) {
  /* jshint +W084 */
    var normalizedNode = {};
    normalizedNode.id = node.id;
    normalizedNode.key = node.drop.key;
    normalizedNode.styleOverride = node.drop.styleOverride;
    normalizedNode.positionX = (node.drop.left - params.left) / params.width;
    normalizedNode.positionY = (node.drop.top - params.top) / params.height;
    // accept only nodes that are within map canvas
    if( (normalizedNode.positionX > 0 && normalizedNode.positionX < 1) &&
        (normalizedNode.positionY > 0 && normalizedNode.positionY < 1) ){
      _nodes.push(normalizedNode);
      changed = true;
    }
  }
  return changed;
}

function deleteNode(id){
  for(var i =0; i < _nodes.length; i++){
    if(_nodes[i].id === id){
      _nodes.splice(i,1);
      return;
    }
  }
}

function recordConnection(connection){
    var sourceId = connection.sourceId;
    var targetId = connection.targetId;
    var scope = connection.scope;
    //may or may not be needed, we'll see
    var jsPlumbConnection = connection.connection;
    var id = jsPlumbConnection.id;


    _connections.push({
      scope:scope,
      sourceId : sourceId,
      targetId : targetId,
      conn : jsPlumbConnection,
      id: id
    });
}

function deleteConnection(connection){
    for(var i = 0; i < _connections.length; i++){
      if(_connections[i].conn === connection){
        _connections.splice(i,1);
        return;
      }
    }
}

function mapRetrieved(map){
  _map = map;
  _nodes = map.history[0].nodes;
  //backward compatibility
  for(var i = 0; i < _nodes.length; i++){
    if(_nodes[i].componentId){
      _nodes[i].id = _nodes[i].componentId;
      delete _nodes[i].componentId;
    }
    if(_nodes[i].userneed){
      _nodes[i].styleOverride = {border: '2px solid black',
      backgroundColor: 'silver'};
      continue;
    }
    if(_nodes[i].external){
      _nodes[i].styleOverride = {border: '1px solid black',
      backgroundColor: 'white'};
    } else {
      _nodes[i].styleOverride = {border: '1px solid black',
      backgroundColor: 'silver'};
    }
  }

  _connections = map.history[0].connections;
  for(var j = 0; j < _connections.length; j++){
    if(_connections[j].pageSourceId){
        _connections[j].sourceId = _connections[j].pageSourceId;
        delete _connections[j].pageSourceId;
    }
    if(_connections[j].pageTargetId){
      _connections[j].targetId = _connections[j].pageTargetId;
      delete _connections[j].pageTargetId;
    }
  }
}

/**
just update the node, as actual dragging is performed by jsPlumb.
we need to discover the change and update the model to prevent next redraw
(f.e. after resize) from overriding changes */
function nodeDragged(drag){
  var node = _.findWhere(_nodes, {id:drag.id});
  node.positionX = drag.pos.left;
  node.positionY = drag.pos.top;
}
var MapStore = assign({}, EventEmitter.prototype, {

  getAll: function() {
    return {nodes:_nodes, connections:_connections, mapMode:mapMode};
  },

  getNameAndDescription : function () {
    var name = '';
    var description = '';
    if(_map && _map.history && _map.history[0]){
      name = _map.history[0].name;
      description = _map.history[0].description;
      return {
        name : name,
        description : description
      };
    } else {
      return null;
    }
  },

  emitChange: function() {
    this.emit(MapConstants.CHANGE_EVENT);
  },

  emitDrop: function(){
    this.emit(MapConstants.DROP_EVENT);
  },

  addChangeListener: function(callback, event) {
    if(!event) {
        event = MapConstants.CHANGE_EVENT;
    }
    this.on(event, callback);
  },

  removeChangeListener: function(callback, event) {
    if(!event) {
        event = MapConstants.CHANGE_EVENT;
    }
    this.removeListener(event, callback);
  }
});

MapDispatcher.register(function(action) {

  switch(action.actionType) {
    case MapConstants.MAP_CREATE_NODE_FROM_DROP:
        if (action.drop !== null) {
          createFromDrop(action.drop);
          MapStore.emitDrop();
        }
        break;
   case MapConstants.MAP_NEW_NODE:
        if( normalize(action.params) ){
            MapStore.emitChange();
        }
        break;
   case MapConstants.MAP_EDITOR_DRAG_MODE:
        if( mapMode === action.targetAction){
            mapMode = null;
        } else {
            mapMode = action.targetAction;
        }
        MapStore.emitChange();
        break;
   case MapConstants.MAP_DELETE_NODE:
        deleteNode(action.id);
        MapStore.emitChange();
        break;
   case MapConstants.MAP_RECORD_CONNECTION:
        recordConnection(action.connection);
        MapStore.emitChange();
        break;
   case MapConstants.MAP_DELETE_CONNECTION:
        deleteConnection(action.connection);
        MapStore.emitChange();
        break;
   case MapConstants.MAP_NODE_DRAGSTOP:
        nodeDragged(action.drag);
        MapStore.emitChange();
        break;
   case MapConstants.MAP_RETRIEVED:
        mapRetrieved(action.map);
        MapStore.emitChange();
        break;
    default:
      // no op
  }
});

module.exports = MapStore;
