/** @jsx React.DOM */
var React = require('react');
var _ = require('underscore');

var mapComponentStyle = {
  border: '1 solid black',
  backgroundColor: 'silver',
  minHeight: 20,
  minWidth: 20,
  maxWidth: 20,
  maxHeight: 20,
  borderRadius: 10,
  zIndex: 2
};

var inlinedStyle = {
  display: 'inline-block',
  verticalAlign : 'middle'
};

var nonInlinedStyle = {
  position: 'absolute'
};
var counter = 0;
var offset = {top: 0, left : 0};

var MapComponent = React.createClass({
  id : null,

  componentDidUpdate : function ( prevProps,  prevState){
    jsPlumb.draggable(this.id, {
      ignoreZoom:true,
      containment:true
    });
    jsPlumb.setDraggable(this.id, this.props.drag);
  },

  render: function() {
    var that = this;
    var drag = this.props.drag;
    console.log(drag);
    console.log(this.props);
    if(drag === null){
      drag = false;
    }
    if(this.props.inline){
      mapComponentStyle = _.extend(mapComponentStyle, inlinedStyle);
    } else {
      mapComponentStyle = _.extend(mapComponentStyle, nonInlinedStyle);
    }
    if(this.props.offset){
      offset = this.props.offset;
    }
    if(this.props.drop){
      mapComponentStyle.left = this.props.drop.left - offset.left;
      mapComponentStyle.top = this.props.drop.top - offset.top;
    }
    if(!this.props.id){
      this.props.id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);
    }
    return (
      <div
        style={mapComponentStyle}
        id={this.props.id}
        ref={
          function(c){
            if(c){
              that.id = c.id;
            }
          }
        }>
      </div>
    );
  }
});

module.exports = MapComponent;
