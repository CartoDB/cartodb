var cdb = require('cartodb.js');
var template = require('./default-add-analysis-option-view.tpl');

/**
 * View for an individual analysis option.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'ModalBlockList-item',

  events: {
    'click': '_onClick'
  },

  initialize: function () {
    this.listenTo(this.model, 'change:selected', this.render);
  },

  render: function () {
    var props = this.model.pick('title', 'sub_title', 'desc', 'selected');
    this.$el.html(template(props));

    this.$el.toggleClass('is-selected', this.model.get('selected'));

    return this;
  },

  _onClick: function () {
    this.model.set('selected', true);
  }

});
