var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({

  initialize: function (models, opts) {
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');
    this.url = opts.visDefinitionModel.mapcapsURL();
  }
});
