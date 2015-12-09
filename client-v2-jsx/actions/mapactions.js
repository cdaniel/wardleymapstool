var MapDispatcher = require('../dispatcher/mapdispatcher');
var MapConstants = require('../constants/mapconstants');

var MapActions = {

  createNodeFromDrop: function(drop) {
    MapDispatcher.dispatch({
     actionType: MapConstants.MAP_CREATE_NODE_FROM_DROP,
     drop: drop
   });
 },

 normalize: function(params){
   MapDispatcher.dispatch({
     actionType: MapConstants.MAP_NEW_NODE,
     params : params
   });
 },

 toggleMode : function(targetAction) {
   MapDispatcher.dispatch({
    actionType: MapConstants.MAP_EDITOR_DRAG_MODE,
    targetAction : targetAction
    });
  },

  deleteNode: function(id){
    MapDispatcher.dispatch({
     actionType: MapConstants.MAP_DELETE_NODE,
     id : id
   });
 },

 recordConnection : function(connection){
   MapDispatcher.dispatch({
    actionType: MapConstants.MAP_RECORD_CONNECTION,
    connection : connection
  });
},

  deleteConnection : function(connection){
    MapDispatcher.dispatch({
      actionType: MapConstants.MAP_DELETE_CONNECTION,
      connection : connection
    });
  },

  nodeDragged : function(drag){
    MapDispatcher.dispatch({
      actionType: MapConstants.MAP_NODE_DRAGSTOP,
      drag : drag
    });
  },

  mapRetrieved : function(map){
    MapDispatcher.dispatch({
      actionType: MapConstants.MAP_RETRIEVED,
      map : map
    });
  },

  changeName : function(name){
    MapDispatcher.dispatch({
      actionType: MapConstants.MAP_CHANGE_NAME,
      name : name
    });
  },

  changeDescription : function(description){
    MapDispatcher.dispatch({
      actionType: MapConstants.MAP_CHANGE_DESCRIPTION,
      description : description
    });
  },

  toggleSharingDialog : function(){
    MapDispatcher.dispatch({
      actionType: MapConstants.MAP_SHARING_DIALOG
    });
  },

  toggleAnonymousSharing : function(url){
    MapDispatcher.dispatch({
      actionType: MapConstants.MAP_TOGGLE_ANONYMOUS_SHARING,
      url : url
    });
  }

};

module.exports = MapActions;
