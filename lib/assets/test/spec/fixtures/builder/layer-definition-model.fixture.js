var Backbone = require('backbone');
var _ = require('underscore');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var getConfigModelFixture = require('fixtures/builder/config-model.fixture.js');

function getLayerDefinitionModelFixture (opts) {
  opts = opts || {};
  var configModel = opts.configModel || getConfigModelFixture();
  var type = opts.type || 'CartoDB';
  var id = opts.id || 'layer-A';
  var name = opts.name || 'table_name';
  var letter = opts.letter || 'a';
  var visible = _.isFinite(opts.visible)
    ? opts.visible
    : true;
  var parse = _.isFinite(opts.parse)
    ? opts.parse
    : false;
  var layerDefinitionsCollection = null;
  if (opts.layerDefinitionsCollection) {
    layerDefinitionsCollection = opts.layerDefinitionsCollection;
  } else {
    layerDefinitionsCollection = new Backbone.Collection([]);
    layerDefinitionsCollection.save = jasmine.createSpy('save');
  }

  var model = new LayerDefinitionModel({
    type: type,
    id: id,
    name: name,
    letter: letter,
    visible: visible
  }, {
    parse: parse,
    configModel: configModel,
    collection: layerDefinitionsCollection
  });

  return model;
}

module.exports = getLayerDefinitionModelFixture;
