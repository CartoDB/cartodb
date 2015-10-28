cdb.geo.ui.Widget.Category.ItemsView = cdb.geo.ui.Widget.View.extend({

  _ITEMS_PER_PAGE: 4,

  className: 'Widget-list Widget-list--wrapped js-list',
  tagName: 'ul',

  initialize: function() {
    this._ITEMS_PER_PAGE = this.options.itemsPerPage;
    this.dataModel = this.options.dataModel;
    this.viewModel = this.options.viewModel;
    this.filter = this.options.filter;
  },

  render: function() {
    this.clearSubViews();
    this._renderList();
    return this;
  },

  _renderList: function() {
    var groupItem;
    var data = this.dataModel.getData();

    data.each(function(mdl, i) {
      if (i % this._ITEMS_PER_PAGE === 0) {
        groupItem = $('<div>').addClass('Widget-listGroup');
        this.$el.append(groupItem);
      }
      mdl.set({
        'selected': true,
        'name': mdl.get([this.dataModel.get('options').column]),
        'maxCount': this.dataModel.getMaxCount()
      })
      this._addItem(mdl, groupItem);
    }, this);
  },

  _addItem: function(mdl, $parent) {
    var v = new cdb.geo.ui.Widget.Category.ItemView({
      model: mdl,
      viewModel: this.viewModel,
      filter: this.filter
    })
    this.addView(v);
    $parent.append(v.render().el);
  }

});
