var CoreView = require('backbone/core-view');
var template = require('./layer.tpl');

/**
 * View for an individual layer item.
 */
module.exports = CoreView.extend({

  tagName: 'li',
  className: 'List-row',

  events: {
    'click .js-add': '_onClickAdd'
  },

  render: function () {
    this.$el.html(
      template({
        model: this.model,
        canSave: this.model.canSave(this.options.baseLayers)
      })
    );
    return this;
  },

  _onClickAdd: function (e) {
    this.killEvent(e);
    if (this.model.canSave(this.options.baseLayers)) {
      this.model.save();
    }
  }

});
