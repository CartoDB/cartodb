const Backbone = require('backbone');
const LayersCollection = require('dashboard/data/layers-collection');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

const MapModel = Backbone.Model.extend({
  urlRoot: '/api/v1/maps',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this.bind('change:id', this._fetchLayers, this);

    this.layers = new LayersCollection(null, { configModel: this._configModel });
    this.layers.map = this;
  },

  // fetch related layers
  _fetchLayers: function () {
    this.layers.fetch();
  }
});

module.exports = MapModel;
