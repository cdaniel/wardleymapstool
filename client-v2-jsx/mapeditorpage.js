/** @jsx React.DOM */
var React = require('react');
var ReactDOM = require('react-dom');

var Grid = require('react-bootstrap').Grid;
var Row = require('react-bootstrap').Row;
var Col = require('react-bootstrap').Col;
var Navbar = require('react-bootstrap').Navbar;
var NavbarHeader = require('react-bootstrap').Navbar.Header;
var NavbarCollapse = require('react-bootstrap').Navbar.Collapse;
var NavbarBrand= require('react-bootstrap').NavbarBrand;
var PageHeader= require('react-bootstrap').PageHeader;
var NavItem = require('react-bootstrap').NavItem;
var Glyphicon = require('react-bootstrap').Glyphicon;
var Nav = require('react-bootstrap').Nav;
var MapEditor = require('./mapeditor');
var RouterMixin = require('react-mini-router').RouterMixin;
var MapStore = require('./store/mapstore');
var ShareDialogStore = require('./store/ShareDialogStore');
var MapTitleDescription = require('./maptitledescription');
var Button = require('react-bootstrap').Button;
var MapStatus = require('./mapstatus');
var EditableShortText = require('./editableshorttext');
var Download = require('./download');
var MapSharingDialog = require('./dialogs/SharingDialog');
var NodeEditDialog = require('./dialogs/NodeEditDialog');
var MapActions = require('./actions/mapactions.js');
var RelatedMaps = require('./relatedmaps.js');

var logoStyle = {
  height : 30,
  marginTop : -5
};

var urllite = require('urllite');
var url = urllite(window.location);
var mapId = url.hash;

//remove # at the beginning
if(mapId) {
  mapId = mapId.substring(1);
}

var origin = url.origin;

  var MapEditorPage = React.createClass({
    MapStore : MapStore,
    ShareDialogStore : ShareDialogStore,
    toggleSharingDialog : function(){
      MapActions.toggleSharingDialog();
    },
    render: function() {
        return (
            <Grid fluid={true}>
              <Row className="show-grid">
                <Col xs={16} md={16}>
                  <Navbar fluid={true}>
                    <NavbarHeader>
                      <NavbarBrand>
                          <a href="/">
                            <img src="/logo.png" alt="Home" style={logoStyle}>
                            </img>
                          </a>
                      </NavbarBrand>
                    </NavbarHeader>
                    <Nav>
                      <Download mapId={mapId} store={this.MapStore}/>
                      <NavItem eventKey={2}
                          onClick={this.toggleSharingDialog}
                          role="toggle">
                        <Glyphicon glyph="share"></Glyphicon>
                        &nbsp;Share...
                      </NavItem>
                      <RelatedMaps mapId={mapId} store={this.MapStore}/>
                    </Nav>
                    <Nav pullRight>
                       <NavItem eventKey={8} href="/profile">
                         <Glyphicon glyph="user"></Glyphicon> My Account
                       </NavItem>
                       <NavItem eventKey={9} href="/logout">
                         <Glyphicon glyph="log-out"></Glyphicon> Logout
                       </NavItem>
                     </Nav>
                  </Navbar>
                </Col>
              </Row>
              <Row className="show-grid">
                <Col xs={10} sm={10} md={10} lg={10}>
                  <MapTitleDescription store={this.MapStore}/>
                </Col>
                <Col xs={2} sm={2} md={2} lg={2}>
                  <MapStatus  store={this.MapStore}/>
                </Col>
              </Row>
              <Row className="show-grid">
                <Col xs={16} md={16}>
                  <MapEditor mapid={mapId} origin={origin} store={this.MapStore}/>
                </Col>
              </Row>
              <MapSharingDialog store={this.ShareDialogStore} mapId={mapId}/>
              <NodeEditDialog store={this.MapStore}/>
            </Grid>
        );
    }
  });

  module.exports = MapEditorPage;
