var cdb = require('cartodb.js');
var VisualizationTemplatesCollection = require('./visualization_templates_collection');

/**
 *  Templated workflows model
 *
 *
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    step: 0,
    current_template_id: ''
  },

  initialize: function(attrs, opts) {
    this.availableTemplates = new VisualizationTemplatesCollection();
    this._initBinds();
    this.availableTemplates.fetch();
  },

  _initBinds: function() {
    this.availableTemplates.bind('loading', function() {
      this.trigger('loadingTemplates', this);
    }, this);
    this.availableTemplates.bind('reset', function() {
      this.trigger('resetTemplates', this);
    }, this);
    this.availableTemplates.bind('error', function() {
      this.trigger('errorTemplates', this);
    }, this);
  },

  getAvailableTemplates: function() {
    return this.availableTemplates // Uhm... toJSON?, pass the whole collection?
  },

  getStep: function() {
    return this.get('step')
  },

  nextStep: function() {

  },

  previousStep: function() {

  },

  clean: function() {
    this.availableTemplates.unbind(null, null, this);
    this.elder('clean');
  }

})