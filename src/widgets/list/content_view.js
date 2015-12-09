var _ = cdb._;
var format = cdb.core.format;
var WidgetContentView = require('../standard/widget_content_view');
var WidgetListItemsView = require('./items_view');
var WidgetListPaginatorView = require('./paginator_view');
var WidgetListEdgesView = require('./edges_view');
var template = require('./content_template.tpl');
var templatePlaceholder = require('./placeholder_template.tpl');

/**
 * Default widget content view:
 */
module.exports = WidgetContentView.extend({

  options: {
    showScroll: false
  },

  render: function() {
    this.clearSubViews();
    var data = this.model.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;
    this.$el.html(
      template({
        title: this.model.get('title'),
        itemsCount: !isDataEmpty ? format.formatValue(data.length) : '-'
      })
    );

    if (isDataEmpty) {
      this._addPlaceholder();
    } else {
      this._initViews();
    }

    return this;
  },

  _initViews: function() {
    var count = this.model.getSize();

    // List view -> items view
    this._list = new WidgetListItemsView({
      model: this.model
    });
    this.$('.js-content').html(this._list.render().el);
    this.addView(this._list);

    var isScrollList = (this._list.$el.get(0).scrollHeight - this._list.$el.outerHeight()) > 0;

    if (isScrollList || this.options.showScroll) {
      // Paginator
      this._pagination = new WidgetListPaginatorView({
        $target: this._list.$el
      });
      this.$('.js-footer').append(this._pagination.render().el);
      this.addView(this._pagination);

      // Edges
      this._edges = new WidgetListEdgesView({
        $target: this._list.$el
      });
      this.$('.js-content').append(this._edges.render().el);
      this.addView(this._edges);
    }
  }

});
