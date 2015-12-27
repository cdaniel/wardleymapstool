var MapDispatcher = require('../dispatcher/mapdispatcher');
var EventEmitter = require('events').EventEmitter;
var MapConstants = require('../constants/mapconstants');
var assign = require('object-assign');

var sharingDialog = false;
var anonymousShare = false;
var anonymousShareLink = '';

function toggleSharingDialog(){
  sharingDialog = !sharingDialog;
}

var ShareDialogStore = assign({}, EventEmitter.prototype, {

  getSharedDialogState : function(){
    return {
      sharingDialog:sharingDialog,
      anonymousShare:anonymousShare,
      anonymousShareLink:anonymousShareLink
    };
  },

  emitChange: function() {
    this.emit(MapConstants.CHANGE_EVENT);
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
    case MapConstants.MAP_SHARING_DIALOG:
       toggleSharingDialog();
       ShareDialogStore.emitChange();
       break;
    case MapConstants.MAP_TOGGLE_ANONYMOUS_SHARING:
       if(action.url){
          anonymousShare = true;
          anonymousShareLink = action.url;
       } else {
          anonymousShare = false;
       }
       ShareDialogStore.emitChange();
       break;
    case MapConstants.LOAD_MAP_SHARING_STATE:
       if(action.data && action.data.anonymousShare){
         anonymousShare = true;
         anonymousShareLink = action.data.url;
       }
       ShareDialogStore.emitChange();
       break;
    default:
      // no op
  }
});

module.exports = ShareDialogStore;
