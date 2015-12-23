var _ = require('underscore');
var cdb = require('cartodb.js');
var contentTemplate = require('./widget-content-template.tpl');
var placeholderTemplate = require('./widget-placeholder-template.tpl');

/**
 * Default widget content view:
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-body',

  initialize: function () {
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    var data = this.model.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;
    this.$el.html(
      contentTemplate({
        title: this.model.get('title'),
        itemsCount: !isDataEmpty ? data.length : '-'
      })
    );

    if (isDataEmpty) {
      this._addPlaceholder();
    }

    return this;
  },

  _initBinds: function () {
    this.model.bind('change:data', this.render, this);
  },

  _addPlaceholder: function () {
    if (placeholderTemplate) {
      this.$('.js-content').append(placeholderTemplate());
    } else {
      cdb.log.info("Placeholder template doesn't exist");
    }
  }
});
