var Backbone = require('backbone');
var template = require('./bubble-legend-template.tpl');

var BubbleLegendView = Backbone.View.extend({

  className: 'CDB-Legend',

  initialize: function () {
    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.html(
      template({
        title: this.model.get('title'),
        bubbles: this.model.get('bubbles'),
        avg: this.model.get('avg')
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

module.exports = BubbleLegendView;
