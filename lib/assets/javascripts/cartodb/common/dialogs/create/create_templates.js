var cdb = require('cartodb.js');
var Backbone = require('backbone');
var _ = require('underscore');
var MapTemplates = require('../../map_templates');
var TemplateItem = require('./templates/template_item');

/**
 *  Create templates view
 *
 *  It will display all template options for creating
 *  a new map.
 *
 */

module.exports = cdb.core.View.extend({

  className: 'CreateDialog-templates',

  events: {
    'click .js-new_map': '_createNewMap'
  },

  initialize: function() {
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('common/views/create/create_templates');
    this.mapTemplates = new Backbone.Collection();
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(this.template());
    this.mapTemplates.reset(MapTemplates);
    return this;
  },

  _initBinds: function() {
    this.mapTemplates.bind('reset', this._renderTemplates, this);
    this.add_related_model(this.mapTemplates);
  },

  _renderTemplates: function() {
    this.mapTemplates.each(this._addTemplate, this);
  },

  _addTemplate: function(mdl) {
    var templateItem = new TemplateItem({ model: mdl });
    this.$('.CreateDialog-templatesList').append(templateItem.render().el);
    templateItem.bind('selected', this._onTemplateSelected, this);
    this.addView(templateItem);
  },

  _onTemplateSelected: function(mdl) {
    if (!_.isEmpty(mdl)) this.model.setMapTemplate(mdl)
    cdb.god.trigger('onTemplateSelected', this);
  },

  _createNewMap: function() {
    this.model.set('option', 'listing');
  }

});
