/** @jsx React.DOM */
var React = require('react');
var MapStore = require('./store/mapstore');
var MapComponent = require('./mapcomponent');
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
    //TODO: react to resize
    this.setState(
      {offset : {
        top : this.refs.root.offsetTop,
        left : this.refs.root.offsetLeft
      }}
    );
  },

  componentWillUnmount: function() {
    this.props.store.removeChangeListener(this._onChange);
  },

  getInitialState : function(){
    return {nodes:[], offset : {left : 0, top : 0}};
  },

  render: function() {
    var nodes = this.state.nodes;
    var offset = this.state.offset;
    var props = this.props;
    var drag = this.state.drag;
    var store = this.props.store;
    var components = this.state.nodes.map(
      function(component){
        return <MapComponent
          id={component.id}
          drop={component.drop}
          offset={offset}
          drag={drag}
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
  }
});

module.exports = MapCanvas;
