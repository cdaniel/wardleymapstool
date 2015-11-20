 var MapDispatcher = require('../dispatcher/mapdispatcher');
var EventEmitter = require('events').EventEmitter;
var MapConstants = require('../constants/mapconstants');
var assign = require('object-assign');

var CHANGE_EVENT = 'change';
var DROP_EVENT = 'drop';

var _nodes = [];
var drag = false;

function createFromDrop(drop) {
  // Hand waving here -- not showing how this interacts with XHR or persistent
  // server-side storage.
  // Using the current timestamp + random number in place of a real id.
  var id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);
  _nodes.push({
    id: id,
    drop: drop
  });
}

var MapStore = assign({}, EventEmitter.prototype, {

  getAll: function() {
    return {nodes:_nodes, drag:drag};
  },

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});

MapDispatcher.register(function(action) {

  switch(action.actionType) {
    case MapConstants.MAP_CREATE_NODE_FROM_DROP:
      if (action.drop !== null) {
        createFromDrop(action.drop);
        MapStore.emitChange();
      }
      break;
   case MapConstants.MAP_EDITOR_TOGGLE_DRAG:
          drag = !drag;
          MapStore.emitChange();
        break;
    default:
      // no op
  }
});

module.exports = MapStore;
