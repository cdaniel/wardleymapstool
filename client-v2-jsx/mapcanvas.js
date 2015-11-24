/** @jsx React.DOM */
var React = require('react');
var MapStore = require('./store/mapstore');
var MapComponent = require('./mapcomponent');
var MapConstants = require('./constants/mapconstants');
var MapActions = require('./actions/mapactions');
var jquery = require('jquery');

var mapCanvasStyle = {
  width: 'auto',
  left: 150,
  right: 0,
  color: 'green',
  height: '100%',
  float: 'left',
  borderStyle: 'dotted',
  position: 'absolute'
};

var MapCanvas = React.createClass({

  componentDidMount: function() {
    this.props.store.addChangeListener(this._onChange);
    this.props.store.addChangeListener(this._normalizeDrop, MapConstants.DROP_EVENT);
    //TODO: react to resize
    this.setState(
      {offset : {
        top : this.refs.root.offsetTop,
        left : this.refs.root.offsetLeft
      },
      size : {
        width : jquery(this.refs.root).width(),
        height: jquery(this.refs.root).height()
      }
      }
    );
  },

  componentWillUnmount: function() {
    this.props.store.removeChangeListener(this._onChange);
    this.props.store.removeChangeListener(this._normalizeDrop, MapConstants.DROP_EVENT);
  },

  getInitialState : function(){
    return {nodes:[], offset : {left : 0, top : 0}};
  },

  render: function() {
    var nodes = this.state.nodes;
    var offset = this.state.offset;
    var size = this.state.size;
    var props = this.props;
    var mapMode = this.state.mapMode;
    var store = this.props.store;
    var components = this.state.nodes.map(
      function(component){
        return <MapComponent
          id={component.id}
          position={component}
          offset={offset}
          canvasSize={size}
          mapMode={mapMode}
          store={store}/>;
      }
    );
    return (
      <div style={mapCanvasStyle} ref="root">
        {components}
      </div>
    );
  },

  _onChange: function() {
    this.setState(this.props.store.getAll());
  },

  _normalizeDrop : function(){
    //TODO: safety check, maybe some parallel handling, maybe more events in one call
      var top = this.state.offset.top;
      var left = this.state.offset.left;
      var width = jquery(this.refs.root).width();
      var height = jquery(this.refs.root).height();
      setTimeout(function(){
        MapActions.normalize({
          left : left,
          top : top,
          width : width,
          height : height
        });
      });
  }
});

module.exports = MapCanvas;
