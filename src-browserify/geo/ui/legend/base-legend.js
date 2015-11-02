var $ = require('jquery');
var View = require('../../../core/view');

/**
 * BaseLegend: common methods for all the legends
 */
var BaseLegend = View.extend({

  _bindModel: function() {

    this.model.bind("change:template change:title change:show_title", this.render, this);

  },

  addTo: function(element) {
    $(element).html(this.render().$el);
  },

  setTitle: function(title) {
    this.model.set("title", title);
  },

  showTitle: function() {
    this.model.set("show_title", true);
  },

  hideTitle: function() {
    this.model.set("show_title", false);
  }

});

module.exports = BaseLegend;
