var MapDispatcher = require('../dispatcher/mapdispatcher');
var EventEmitter = require('events').EventEmitter;
var MapConstants = require('../constants/mapconstants');
var assign = require('object-assign');
var _ = require('underscore');
var jquery = require('jquery');


var _nodes = [];
var _nodesToCreate = [];
var _connections = [];

var mapMode = null; // useful for determing whether to edit or drag nodes

var _map = null;
var _state = null; //message to display to the user
var _nodeBeingEdited = null;

var componentTypes = [
  {key:'userneed', name : 'User need', styleOverride: {border: '3px solid black',
  backgroundColor: 'silver'}},
  {key:'internal', name : 'Internal', styleOverride: {border: '1px solid black',
  backgroundColor: 'silver'}},
  {key:'external', name : 'External', styleOverride: {border: '1px solid black',
  backgroundColor: 'white'}}
];

// wicked logic to fix, because it does select and edit
function selectNodeForEdit(nodeId, newState){
  if(!newState){
    newState = null;
  }
  if(nodeId === null && newState === null){
    _nodeBeingEdited = null; //deselect edit
    return;
  }
  if(nodeId === null && newState !== null){
    if(newState.newName){
      _nodeBeingEdited.name = newState.newName;
    }
    if(newState.newType){
      for(var j = 0; j < componentTypes.length; j++){
        if(newState.newType === componentTypes[j].key){
          _nodeBeingEdited.styleOverride = componentTypes[j].styleOverride;
          if(componentTypes[j].key === 'userneed'){
            _nodeBeingEdited.userneed = true;
            _nodeBeingEdited.external = false;
          } else if(componentTypes[j].key === 'external'){
            _nodeBeingEdited.userneed = false;
            _nodeBeingEdited.external = true;
          } else {
            _nodeBeingEdited.userneed = false;
            _nodeBeingEdited.external = false;
          }
        }
      }
    }
    _nodeBeingEdited = null;
    return;
  }
  for(var i =0; i < _nodes.length; i++){
    if(_nodes[i].id === nodeId){
      _nodeBeingEdited = _nodes[i];
      return;
    }
  }
}


var _sharingDialog = false;


function toggleSharingDialog(){
  _sharingDialog = !_sharingDialog;
}


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
      _nodeBeingEdited = normalizedNode;
      for(var j = 0; j < componentTypes.length; j++){
        if(_nodeBeingEdited.key === componentTypes[j].key){
          _nodeBeingEdited.styleOverride = componentTypes[j].styleOverride;
          if(componentTypes[j].key === 'userneed'){
            _nodeBeingEdited.userneed = true;
            _nodeBeingEdited.external = false;
          } else if(componentTypes[j].key === 'external'){
            _nodeBeingEdited.userneed = false;
            _nodeBeingEdited.external = true;
          } else {
            _nodeBeingEdited.userneed = false;
            _nodeBeingEdited.external = false;
          }
        }
      }
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

function nameChanged(name){
  _map.history[0].name = name;
}

function descriptionChanged(description){
  _map.history[0].description = description;
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
      _nodes[i].styleOverride = componentTypes[0].styleOverride;
      continue;
    }
    if(_nodes[i].external){
      _nodes[i].styleOverride = componentTypes[2].styleOverride;
    } else {
      _nodes[i].styleOverride = componentTypes[1].styleOverride;
    }
  }
  _connections = map.history[0].connections;
  console.log(_map);
}


//TODO: move this to separate module
var dirtyIndex = 0;
var lastSavedIndex = 0;

var saving = false;

function markDirty (){
  dirtyIndex ++;
}

function constructResponse(map){
  var response = {};
  response.name = map.history[0].name;
  response.description = map.history[0].description;

  response.connections = [];
  for(var i = 0; i < map.history[0].connections.length; i++){
    var conn = _.clone(map.history[0].connections[i]);
    delete conn.conn;
    response.connections.push(conn);
  }

  response.nodes =  [];
  for(var j = 0; j < map.history[0].nodes.length; j++){
    var n = _.clone(map.history[0].nodes[j]);
    delete n.styleOverride;
    response.nodes.push(n);
  }

  return response;
}

function saveMap(){
  saving = true;
  var dirtyIndexCopy = dirtyIndex;
  console.log(constructResponse(_map));
  console.log(JSON.stringify(constructResponse(_map)));
  // saving = false;
  // lastSavedIndex = dirtyIndexCopy;
  // return;
  jquery.ajax({
    url : "/api/map/" + _map._id,
    type : 'post',
    async : 'true',
    contentType: 'application/json',
    data : JSON.stringify(constructResponse(_map)),
    dataType : 'json',
    error : function(request, error) {
        if(request.status == 401){
            // served by status code
            return;
        }
      console.log('An error while saving a map!', error);
      console.log('error ' + dirtyIndexCopy);
      saving = false;
      // $("#servernotresponding").show();
      // setTimeout(function() {
      //     window.location.href = "/";
      // }, 5000);
    },
    statusCode : {
        200 : function(){
            saving = false;
            lastSavedIndex = dirtyIndexCopy;
        }
        // ,
        // 302 : function() {
        //     $("#lostsession").show();
        //     setTimeout(function() {
        //         window.location.href = "/";
        //     }, 5000);
        // },
        // 401 : function() {
        //     $("#lostsession").show();
        //     setTimeout(function() {
        //         window.location.href = "/";
        //     }, 5000);
        // }
    }
  });
}

function saveLoop() {
	setTimeout(function() {
		if (lastSavedIndex != dirtyIndex && !saving) {
			saveMap();
		}
		saveLoop();
	}, 1000);
}

saveLoop();
//--end of TODO
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

  getMap : function(){
    return _map;
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
      return {
        name : '',
        description : ''
      };
    }
  },

  getSharedDialogState : function(){
    var anonymousShare = _map !== null ? _map.anonymousShare : false;
    var anonymousShareLink = _map !== null ? _map.anonymousShareLink : '';
    return {sharingDialog:_sharingDialog,
            anonymousShare:anonymousShare,
          anonymousShareLink:anonymousShareLink};
  },

  getStateInfo : function() {
    return {state:_state};
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
  },

  getComponentTypes : function(){
    return componentTypes;
  },

  getNodeBeingEdited : function(){
    return _nodeBeingEdited;
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
            markDirty();
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
        markDirty();
        break;
   case MapConstants.MAP_RECORD_CONNECTION:
        recordConnection(action.connection);
        MapStore.emitChange();
        markDirty();
        break;
   case MapConstants.MAP_DELETE_CONNECTION:
        deleteConnection(action.connection);
        MapStore.emitChange();
        markDirty();
        break;
   case MapConstants.MAP_NODE_DRAGSTOP:
        nodeDragged(action.drag);
        MapStore.emitChange();
        markDirty();
        break;
   case MapConstants.MAP_RETRIEVED:
        mapRetrieved(action.map);
        MapStore.emitChange();
        break;
  case MapConstants.MAP_CHANGE_NAME:
       nameChanged(action.name);
       MapStore.emitChange();
       markDirty();
       break;
  case MapConstants.MAP_CHANGE_DESCRIPTION:
       descriptionChanged(action.description);
       MapStore.emitChange();
       markDirty();
       break;
  case MapConstants.MAP_SHARING_DIALOG:
       toggleSharingDialog();
       MapStore.emitChange();
       break;
  case MapConstants.MAP_TOGGLE_ANONYMOUS_SHARING:
       if(action.url){
          _map.anonymousShare = true;
          _map.anonymousShareLink = action.url;
       } else {
         _map.anonymousShare = false;
       }
       MapStore.emitChange();
       markDirty();
       break;
  case MapConstants.MAP_EDIT_NODE:
       selectNodeForEdit(action.nodeId, action.newState);
       MapStore.emitChange();
       markDirty();
       break;
  case MapConstants.ERROR:
       _state = action.error;
       MapStore.emitChange();
       break;
    default:
      // no op
  }
});

module.exports = MapStore;
