var $ = cdb.$;
var _ = cdb._;
var log = cdb.log;
var View = cdb.core.View;
var d3 = cdb.d3;
var contentTemplate = require('./widget_content_template.tpl');
var placeholderTemplate = require('./widget_placeholder_template.tpl');

/**
 * Default widget content view:
 */
module.exports = View.extend({

  className: 'CDB-Widget-body',

  initialize: function() {
    this.filter = this.options.filter;
    this._initBinds();
  },

  render: function() {
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

  _initBinds: function() {
    this.model.bind('change:data', this.render, this);
  },

  _addPlaceholder: function() {
    if (placeholderTemplate) {
      this.$('.js-content').append(placeholderTemplate());
    } else {
      log.info('Placeholder template doesn\'t exist');
    }
  }
});
