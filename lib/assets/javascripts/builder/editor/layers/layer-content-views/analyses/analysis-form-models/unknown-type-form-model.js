var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');

/**
 * A fallback form model in case the type is not supported (yet).
 */
module.exports = BaseAnalysisFormModel.extend({

  validate: function () {
    return true; // always fail, should not be able to save an unknown node
  },

  getTemplate: function () {
    return _.template('<form>Unknown analysis type <%- type %></form>');
  },

  getTemplateData: function () {
    return {type: this.get('type') || ''};
  },

  // Don't allow to update or create an unknown type
  updateNodeDefinition: function () {},
  createNodeDefinition: function () {}

});
