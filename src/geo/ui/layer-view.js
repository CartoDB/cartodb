var _ = require('underscore');
var templates = require('cdb.templates');
var View = require('../../core/view');

/**
 *  View for each CartoDB layer
 *  - It needs a model to make it work.
 *
 *  var layerView = new LayerView({
 *    model: layer_model,
 *    layer_definition: layer_definition
 *  });
 */
var LayerView = View.extend({

  tagName: "li",

  defaults: {
    template: '\
      <a class="layer" href="#/change-layer"><%- layerName %></a>\
      <a href="#switch" class="right <%- visible ? "enabled" : "disabled" %> switch"><span class="handle"></span></a>\
    '
  },

  events: {
    "click": '_onSwitchClick'
  },

  initialize: function() {

    if (!this.model.has('visible')) this.model.set('visible', false);

    this.model.bind("change:visible", this._onSwitchSelected, this);

    this.add_related_model(this.model);

    this._onSwitchSelected();

    // Template
    this.template = this.options.template ? templates.getTemplate(this.options.template) : _.template(this.defaults.template);
  },

  render: function() {
    var attrs = {
      layerName: this.model.getName(),
      visible: this.model.isVisible()
    };
    this.$el.append(this.template(attrs));
    return this;
  },

  /*
  * Throw an event when the user clicks in the switch button
  */
  _onSwitchSelected: function() {
    var enabled = this.model.get('visible');

    // Change switch
    this.$el.find(".switch")
      .removeClass(enabled ? 'disabled' : 'enabled')
      .addClass(enabled    ? 'enabled'  : 'disabled');

    // Send trigger
    this.trigger('switchChanged');

  },

  _onSwitchClick: function(e){
    this.killEvent(e);

    // Set model
    this.model.set("visible", !this.model.get("visible"));
  }

});

module.exports = LayerView;
