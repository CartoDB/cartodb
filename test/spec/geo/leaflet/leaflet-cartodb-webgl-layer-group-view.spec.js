var _ = require('underscore');
var L = require('leaflet');
var VisModel = require('../../../../src/vis/vis');
var LayersCollection = require('../../../../src/geo/map/layers');
var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');
var CartoDBLayerGroup = require('../../../../src/geo/cartodb-layer-group');
var GeoJSONDataProvider = require('../../../../src/geo/data-providers/geojson/data-provider');
var LeafletCartoDBWebGLLayerGroupView = require('../../../../src/geo/leaflet/leaflet-cartodb-webgl-layer-group-view');

describe('src/geo/leaflet/leaflet-cartodb-webgl-layer-group-view.js', function () {
  beforeEach(function () {
    var container = document.createElement('div');
    container.id = 'map';
    document.body.appendChild(container)
    
    this.leafletMap = L.map('map');
    this.layersCollection = new LayersCollection();
    this.layerGroupModel = new CartoDBLayerGroup({}, {
      layersCollection: this.layersCollection
    });
    this.layerGroupModel.getTileURLTemplates = function () { return [ 'http://carto.com/{z}/{x}/{y}.png' ]; };
    
    this.vis = new VisModel();
    
    this.layer1 = new CartoDBLayer({ id: 'layer1' }, { vis: this.vis });
    this.layer2 = new CartoDBLayer({ id: 'layer2' }, { vis: this.vis });
    
    this.layersCollection.reset([ this.layer1, this.layer2 ]);

  });

  afterEach(function () {
      document.getElementById('map').remove();
  });

  it('should set the styles options when meta changes', function () {

    var view = new LeafletCartoDBWebGLLayerGroupView(this.layerGroupModel, this.leafletMap); // eslint-disable-line
    var self = this;

    setTimeout(function () {
        this.layer1.set('meta', {cartocss: '#layer {polygon-fill: red;}'});
        this.layer2.set('meta', {cartocss: '#layer {polygon-fill: blue;}'});

        expect(view.options.styles).toEqual([ '#layer {polygon-fill: red;}', '#layer {polygon-fill: blue;}' ]);
        done();
    }, 100);
  });

  it('should set the visibility options when visibility changes', function () {

    var view = new LeafletCartoDBWebGLLayerGroupView(this.layerGroupModel, this.leafletMap); // eslint-disable-line
    var self = this;

    setTimeout(function () {
        this.layer1.set('visible', true);
        this.layer2.set('visible', false);

        expect(view.tangram.scene.config.layers.layer1.visible).toBeTruthy();
        expect(view.tangram.scene.config.layers.layer1.visible).toBeFalsy();

        done();
    }, 100);

  });

  // it('should set a new tile template URL when urls change', function () {
  //   var view = new LeafletCartoDBWebGLLayerGroupView(this.layerGroupModel, this.leafletMap); // eslint-disable-line

  //   spyOn(view, 'setUrl');

  //   this.layerGroupModel.getTileURLTemplates = function () {
  //     return [
  //       'http://0.ashbu.cartocdn.com/documentation/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/0/{z}/{x}/{y}.png',
  //       'http://1.ashbu.cartocdn.com/documentation/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/0/{z}/{x}/{y}.png',
  //       'http://2.ashbu.cartocdn.com/documentation/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/0/{z}/{x}/{y}.png',
  //       'http://3.ashbu.cartocdn.com/documentation/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/0/{z}/{x}/{y}.png'
  //     ];
  //   };

  //   this.layerGroupModel.set('urls', { tiles: [ ] });

  //   expect(view).toHaveBeenCalledWith('http://0.ashbu.cartocdn.com/documentation/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/0/{z}/{x}/{y}.png');
  // });
});
