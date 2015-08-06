var cdb = require('cartodb.js');
var VisualizationTemplateModel = require('./visualization_template_model');

// TEST -> template code
var TemplateCode = require('./example/template_code_string');

/**
 *  Visualization templates collection
 *
 *  - A bunch of visualization templates
 *
 */

module.exports = Backbone.Collection.extend({

  model: VisualizationTemplateModel,

  url: '/api/v1/templates',

  fetch: function() {
    this.trigger("loading", this);
    return Backbone.Collection.prototype.fetch.apply(this, arguments);
  },

  parse: function(r) {
    return r.items
  }

})