var _ = require('underscore');
var cdb = require('cartodb.js');
var format = require('../../formatter');
var WidgetListItemsView = require('./items-view');
var WidgetListPaginatorView = require('./paginator-view');
var WidgetListEdgesView = require('./edges-view');
var template = require('./content-template.tpl');
var placeholderTemplate = require('./placeholder-template.tpl');

/**
 * Default widget content view:
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-body',

  options: {
    showScroll: false
  },

  initialize: function () {
    this._dataviewModel = this.model.dataviewModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    var data = this._dataviewModel.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;
    this.$el.html(
      template({
        title: this.model.get('title'),
        itemsCount: !isDataEmpty ? format.formatValue(data.length) : '-'
      })
    );

    if (isDataEmpty) {
      this.$('.js-content').append(placeholderTemplate());
    } else {
      this._initViews();
    }

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:title', this.render);
    this.listenTo(this._dataviewModel, 'change:data', this.render);
    this.add_related_model(this._dataviewModel);
  },

  _initViews: function () {
    // List view -> items view
    this._list = new WidgetListItemsView({
      model: this.model,
      dataviewModel: this._dataviewModel
    });
    this.$('.js-content').html(this._list.render().el);
    this.addView(this._list);

    var isScrollList = (this._list.$el.get(0).scrollHeight - this._list.$el.outerHeight()) > 0;

    if (isScrollList || this.options.showScroll) {
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
