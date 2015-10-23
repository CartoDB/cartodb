cdb.geo.ui.Widget.Category.ItemsView = cdb.geo.ui.Widget.View.extend({

  _ITEMS_PER_PAGE: 4,

  className: 'Widget-list Widget-list--wrapped js-list',
  tagName: 'ul',

  initialize: function() {
    this._ITEMS_PER_PAGE = this.options.itemsPerPage;
    this.dataModel = this.options.dataModel;
    this.viewModel = this.options.viewModel;
  },

  render: function() {
    this.clearSubViews();
    this._renderList();
    return this;
  },

  _renderList: function() {
    var groupItem;
    this.dataModel.getData().each(function(mdl, i) {
      if (i % this._ITEMS_PER_PAGE === 0) {
        groupItem = $('<div>').addClass('Widget-listGroup');
        this.$el.append(groupItem);
      }
      this._addItem(mdl, groupItem);
    }, this);
  },

  _addItem: function(mdl, $parent) {
    var v = new cdb.geo.ui.Widget.Category.ItemView({
      model: mdl,
      viewModel: this.viewModel
    })
    this.addView(v);
    $parent.append(v.render().el);
  }

});
