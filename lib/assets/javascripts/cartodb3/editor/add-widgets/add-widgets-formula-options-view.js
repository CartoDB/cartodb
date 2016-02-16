var cdb = require('cartodb.js');

/**
 * View to select formula widget options
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
  },

  render: function () {
    // TODO create & render widget definition options
    this.$el.html(
      '<h1>Widget definition options TBD</h1>' +
      '<br/>Needs to be derived from layers somehow, layers available: <br/><br/>' +
      '<textarea rows="10" cols="100">' + JSON.stringify(this._layerDefinitionsCollection) + '</textarea>');

    return this;
  }
});
