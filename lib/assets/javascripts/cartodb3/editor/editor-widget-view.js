var cdb = require('cartodb-deep-insights.js');
var template = require('./editor-widget.tpl');

/**
 * View for an individual widget definition.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  events: {
    'click .js-remove': '_onRemove',
    'click': '_onEdit'
  },

  initialize: function () {
    this.listenToOnce(this.model, 'destroy', this._onDestroy);
  },

  render: function () {
    this.$el.html(template({
      title: this.model.get('title')
    }));
    return this;
  },

  _onEdit: function () {
    this.trigger('onClick', this.model, this);
  },

  _onRemove: function () {
    this.model.destroy();
  },

  _onDestroy: function () {
    this.clean();
  }
});
