var MapDispatcher = require('../dispatcher/mapdispatcher');
var MapConstants = require('../constants/mapconstants');

var MapActions = {

  createNodeFromDrop: function(drop) {
    MapDispatcher.dispatch({
     actionType: MapConstants.MAP_CREATE_NODE_FROM_DROP,
     drop: drop
   });
 },

 toggleDrop : function() {
   MapDispatcher.dispatch({
    actionType: MapConstants.MAP_EDITOR_TOGGLE_DRAG
  });
 }

};

module.exports = MapActions;
