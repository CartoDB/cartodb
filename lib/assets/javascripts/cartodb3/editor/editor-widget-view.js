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

  initialize: function (opts) {
    if (!opts.tableModel) {
      throw new Error('Table model should be provided');
    }
    if (!opts.nextStackItem) {
      throw new Error('Next stack item should be provided');
    }
    this.nextStackItem = opts.nextStackItem;
    this.tableModel = opts.tableModel;
    this.listenToOnce(this.model, 'destroy', this._onDestroy);
  },

  render: function () {
    this.$el.html(template({
      title: this.model.get('title')
    }));
    return this;
  },

  _onEdit: function () {
    this.nextStackItem(this.model, this.tableModel);
  },

  _onRemove: function () {
    this.model.destroy();
  },

  _onDestroy: function () {
    this.clean();
  }
});
