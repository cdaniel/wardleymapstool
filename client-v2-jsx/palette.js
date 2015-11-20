/** @jsx React.DOM */
var React = require('react');
var ButtonGroup = require('react-bootstrap').ButtonGroup;
var Button = require('react-bootstrap').Button;
var MapComponent = require('./mapcomponent');
var PaletteComponent = require('./palettecomponent');
var MapActions = require('./actions/mapactions');

var paletteStyle = {
  minWidth : 150,
  maxWidth : 150,
  height: '100%',
  float: 'left'
};

var Palette = React.createClass({
  getInitialState : function(){
    return {items:[
      {key:'userneed', name : 'User need'},
      {key:'internalcomponent', name : 'Internal Component'},
      {key:'externalcomponent', name : 'External Component'}
    ]
  };
},
render: function() {
  var store = this.props.store;
  var components = this.state.items.map(
    function(component){
      return <PaletteComponent name={component.name}  store={store}/>;
    }
  );
  return (
    <div style={paletteStyle}>
      <ButtonGroup vertical block>
        {components}
        <PaletteComponent name="Move" toggle="toggle" store={store}/>
      </ButtonGroup>
    </div>
  );
}
});

module.exports = Palette;
