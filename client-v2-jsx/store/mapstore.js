var MapDispatcher = require('../dispatcher/mapdispatcher');
var EventEmitter = require('events').EventEmitter;
var MapConstants = require('../constants/mapconstants');
var assign = require('object-assign');


var _nodes = [];
var _nodesToCreate = [];

var mapMode = null;

function createFromDrop(drop) {
  // Hand waving here -- not showing how this interacts with XHR or persistent
  // server-side storage.
  // Using the current timestamp + random number in place of a real id.
  var id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);
  _nodesToCreate.push({
    id: id,
    drop: drop
  });
}

function normalize(params){
  var changed = false;
  var node;
  while( node = _nodesToCreate.pop() ) {
    var normalizedNode = {};
    normalizedNode.id = node.id;
    normalizedNode.positionX = (node.drop.left - params.left) / params.width;
    normalizedNode.positionY = (node.drop.top - params.top) / params.height;
    // accept only nodes that are within map canvas
    if( (normalizedNode.positionX > 0 && normalizedNode.positionX < 1)
        && (normalizedNode.positionY > 0 && normalizedNode.positionY < 1) ){
      _nodes.push(normalizedNode);
      changed = true;
    }
  }
  return changed;
}

var MapStore = assign({}, EventEmitter.prototype, {

  getAll: function() {
    return {nodes:_nodes, tocreate:_nodesToCreate, mapMode:mapMode};
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
    default:
      // no op
  }
});

module.exports = MapStore;
