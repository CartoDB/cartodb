var $ = require('jquery');
var reqwest = require('reqwest');
var setupMapBase = require('../../../../src-browserify/geo/layer-definition/map-base');
var setupLayerDefinition = require('../../../../src-browserify/geo/layer-definition/layer-definition');
var setupTiles = require('../../../../src-browserify/api/tiles');

describe('api/tiles', function() {
  beforeEach(function() {
    var SubLayerFactory = {};
    var MapBase = setupMapBase(SubLayerFactory, { jQueryAjax: $.ajax });
    var LayerDefinition = setupLayerDefinition(MapBase, '1.2.3');
    var Tiles = setupTiles(LayerDefinition, reqwest.compat);

    this.tiles = new Tiles({
      sublayers: [],
      user_name: 'pepe'
    });
  });

  it('should create a tiles object', function() {
    expect(this.tiles).toBeDefined();
  });
});
