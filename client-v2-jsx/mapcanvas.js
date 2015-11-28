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
  id : (+new Date() + Math.floor(Math.random() * 999999)).toString(36),

  componentDidMount: function() {
    this.props.store.addChangeListener(this._onChange);
    this.props.store.addChangeListener(this._normalizeDrop, MapConstants.DROP_EVENT);
    //TODO: maybe react to resize
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
    jsPlumb.setContainer(this.id);
    jsPlumb.bind("beforeDrop", function(connection) {

    	    var scope = connection.connection.getData().scope;

          // no connection to self
          if (connection.sourceId == connection.targetId) {
    			     return false;
    		  }

          // no duplicate connections - TODO: check that in app state
          if(jsPlumb.getConnections({
              scope:scope,
              source : connection.sourceId,
              target : connection.targetId
            }, true).length > 0){
            //connection already exists
            return false;
          };

          MapActions.recordConnection(connection);

     		return true;
    	});
  },

  componentWillUnmount: function() {
    this.props.store.removeChangeListener(this._onChange);
    this.props.store.removeChangeListener(this._normalizeDrop, MapConstants.DROP_EVENT);
  },

  getInitialState : function(){
    return {nodes:[], connections:[], offset : {left : 0, top : 0}};
  },

  render: function() {
    var nodes = this.state.nodes;
    var offset = this.state.offset;
    var size = this.state.size;
    var props = this.props;
    var mapMode = this.state.mapMode;
    var store = this.props.store;
    var id = this.id;

    var components = this.state.nodes.map(
      function(component){
        return <MapComponent
          id={component.id}
          key={component.id}
          styleOverride={component.styleOverride}
          position={component}
          offset={offset}
          canvasSize={size}
          mapMode={mapMode}
          store={store}/>;
      }
    );
    return (
      <div style={mapCanvasStyle} ref="root" id={id}>
        {components}
      </div>
    );
  },

  _onChange: function() {
    this.setState(this.props.store.getAll());
  },

  _normalizeDrop : function(){
      var top = this.state.offset.top;
      var left = this.state.offset.left;
      var width = jquery(this.refs.root).width();
      var height = jquery(this.refs.root).height();
      var root = this.refs.root;
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
