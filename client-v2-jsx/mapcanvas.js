/** @jsx React.DOM */
var React = require('react');
var MapStore = require('./store/mapstore');
var MapComponent = require('./mapcomponent');
var MapConstants = require('./constants/mapconstants');
var MapActions = require('./actions/mapactions');
var jquery = require('jquery');
var _ = require('underscore');

var mapCanvasStyle = {
  position: 'absolute',
  top: 0,
  left : '2%',
  bottom : '2%',
  right : 0,
  backgroundImage: 'transparent url(1x1_transparent.png) repeat center top'
};

var outerStyle = {
  width: 'auto',
  left: 150,
  right: 0,
  height: '100%',
  float: 'left',
  position: 'absolute'
};


var axisSupport = {
    position: 'absolute',
    borderWidth: 1,
    top: '3%',
    bottom: '2%',
    border: '1px dashed silver',
    zIndex: '1'
};

//TODO: align this properly (relative to the canvas)
var axisSupport1 = _.extend(_.clone(axisSupport), {left: '25.5%'});
var axisSupport2 = _.extend(_.clone(axisSupport), {left: '51%'});
var axisSupport3 = _.extend(_.clone(axisSupport), {left: '76.5%'});


var axisX = {
	position: 'absolute',
	bottom: '2%',
	height: 1,
	left: '2%',
	right: '2%',
	border: '1px solid gray',
  marginRight: 0,
  marginLeft: 0,
};

var arrowX = {
	position: 'absolute',
    width: 0,
    height: 0,
    borderTop: '4px solid transparent',
    borderBottom: '2px solid transparent',
    borderLeft: '10px solid gray',
    right: '2%',
    bottom: '2%'
};

var axisY = {
  position: 'absolute',
  width: 1,
  borderWidth: 1,
  top: '2%',
  bottom: '2%',
  left: '2%',
  border: '1px solid gray'
};

var arrowY = {
  position: 'absolute',
  width: 0,
  height: 0,
  left: '2%',
  top: '2%',
  borderLeft: '2px solid transparent',
  borderRight: '4px solid transparent',
  borderBottom: '10px solid gray'
};

var valueCaption = {
    position: 'absolute',
    zIndex: 1,
    fontSize: 'smaller',
    top: '3%',
    left: '3%'
};

var evolutionCaption = {
    position: 'absolute',
    zIndex: 1,
    fontSize: 'smaller',
    bottom: '3%',
    right: '3%'
};

var genesisStyle = {fontSize: 'smaller', position:'absolute', left : '5%'};
var customBuiltStyle = {fontSize: 'smaller', position:'absolute', left : '31%'};
var productStyle = {fontSize: 'smaller', position:'absolute', left : '57%'};
var commodityStyle = {fontSize: 'smaller', position:'absolute', left : '81%'};

var MapCanvas = React.createClass({

  id : (+new Date() + Math.floor(Math.random() * 999999)).toString(36),

  _this:this,

  handleResize : function () {
    var newState = {
        offset : {
          top : jquery(this.refs.root).offset().top,
          left : jquery(this.refs.root).offset().left
        },
        size : {
          width : jquery(this.refs.root).width(),
          height: jquery(this.refs.root).height()
        }
    };
    this.setState(newState);
    //anti pattern but jsPlumb does not want to work otherwise with react
    jsPlumb.repaintEverything();
  },

  componentDidMount: function() {
    this.props.store.addChangeListener(this._onChange);
    this.props.store.addChangeListener(this._normalizeDrop, MapConstants.DROP_EVENT);
    //intial size and react to resize
    this.handleResize();
    jquery(window).resize(this.handleResize);

    jsPlumb.setContainer(this.id);
    jsPlumb.bind("beforeDrop", function(connection) {

    	    var scope = connection.connection.getData().scope;

          // no connection to self
          if (connection.sourceId === connection.targetId) {
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
          }

          MapActions.recordConnection(connection);

     		return true;
    	});
  },

  componentWillUnmount: function() {
    this.props.store.removeChangeListener(this._onChange);
    this.props.store.removeChangeListener(this._normalizeDrop, MapConstants.DROP_EVENT);
    jquery(window).off('resize', this.handleResize);
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
      <div style={outerStyle} ref="parentRoot">
        <div style={mapCanvasStyle} ref="root" id={id}>
          {components}
        </div>
        <div style={axisX}>
            <div style={genesisStyle}>Genesis</div>
            <div style={customBuiltStyle}>Custom Built</div>
            <div style={productStyle}>Product or Rental</div>
            <div style={commodityStyle}>Commodity/Utility</div>
        </div>
        <div style={arrowX}/>
        <div style={valueCaption}>Value</div>
        <div style={axisY}/>
        <div style={arrowY}/>
        <div style={evolutionCaption}>Evolution</div>
        <div style={axisSupport1}/>
        <div style={axisSupport2}/>
        <div style={axisSupport3}/>
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
      var data = {
        left : left,
        top : top,
        width : width,
        height : height
      };
      setTimeout(function(){
        MapActions.normalize(data);
      });
  }
});

module.exports = MapCanvas;
