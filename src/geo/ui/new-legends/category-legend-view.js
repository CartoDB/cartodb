var Backbone = require('backbone');
var template = require('./category-legend-template.tpl');

var CategoryLegendView = Backbone.View.extend({

  className: 'CDB-Legend',

  initialize: function () {
    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.html(
      template({
        title: this.model.get('title'),
        categories: this.model.get('categories')
      })
    );

    if (this.model.isVisible()) {
      this.$el.show();
    } else {
      this.$el.hide();
    }

    return this;
  }
});

module.exports = CategoryLegendView;
