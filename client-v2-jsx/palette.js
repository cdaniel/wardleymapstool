/** @jsx React.DOM */
var React = require('react');
var ButtonGroup = require('react-bootstrap').ButtonGroup;
var Well = require('react-bootstrap').Well;
var Button = require('react-bootstrap').Button;
var MapComponent = require('./mapcomponent');
var ActionPaletteComponent = require('./actionpalettecomponent');
var DraggablePaletteComponent = require('./draggablepalettecomponent');
var MapActions = require('./actions/mapactions');
var MapConstants = require('./constants/mapconstants');

var paletteStyle = {
  minWidth : 150,
  maxWidth : 150,
  height: '100%',
  float: 'left'
};

var Palette = React.createClass({
  getInitialState : function(){
    return {items: this.props.store.getComponentTypes()};
  },
  render: function() {
    var store = this.props.store;
    var components = this.state.items.map(
      function(component){
        var _key = component.key;
        console.log(_key);
        return <DraggablePaletteComponent
          name={component.name}
          store={store}
          key={_key}
          styleOverride={component.styleOverride}/>;
      }
    );
    return (
      <div style={paletteStyle}>
        <h5>Components:</h5>
        <ButtonGroup vertical block>
          {components}
        </ButtonGroup>
        <h5>Actions:</h5>
        <ButtonGroup vertical block>
          <ActionPaletteComponent
            name="Edit"
            toggle={MapConstants.MAP_EDITOR_EDIT_MODE}
            store={store}/>
          <ActionPaletteComponent
            name="Move"
            toggle={MapConstants.MAP_EDITOR_DRAG_MODE}
            store={store}/>
          <ActionPaletteComponent
            name="Connect"
            toggle={MapConstants.MAP_EDITOR_CONNECT_MODE}
            store={store}/>
          <ActionPaletteComponent
            name="Delete"
            toggle={MapConstants.MAP_EDITOR_DELETE_MODE}
            store={store}/>
        </ButtonGroup>
      </div>
    );
  }
});

module.exports = Palette;
