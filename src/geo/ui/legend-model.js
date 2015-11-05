var Model = require('../../core/model');
var LegendItems = require('./legend-items');

/**
 * Legend Model
 */
var LegendModel = Model.extend({

  defaults: {
    type: null,
    show_title: false,
    title: "",
    template: "",
    visible: true
  },

  initialize: function() {

    this.items = new LegendItems(this.get("items"));

    this.items.bind("add remove reset change", function() {
      this.set({ items: this.items.toJSON() });
    }, this);

    this.bind("change:items", this._onUpdateItems, this);
    this.bind("change:title change:show_title", this._onUpdateTitle, this);
    this.bind("change:template", this._onUpdateTemplate, this);

  },

  _onUpdateTemplate: function() {
    this.template = this.get("template");
  },

  _onUpdateTitle: function() {
    this.title = this.get("title");
    this.show_title = this.get("show_title");
  },

  _onUpdateItems: function() {
    var items = this.get("items");
    this.items.reset(items);
  }

});

module.exports = LegendModel;
