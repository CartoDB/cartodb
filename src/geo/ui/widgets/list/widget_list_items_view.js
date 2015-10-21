cdb.geo.ui.Widget.List.ItemsView = cdb.geo.ui.Widget.View.extend({

  className: 'Widget-list Widget-list--withBorders js-list',
  tagName: 'ul',

  events: {
    'scroll': '_checkScroll'
  },

  initialize: function() {
    this.dataModel = this.options.dataModel;
    this.viewModel = this.options.viewModel;
  },

  render: function() {
    this.clearSubViews();
    this._renderList();
    this._checkScroll();
    return this;
  },

  _renderList: function() {
    this.dataModel.getData().each(this._addItem, this);
  },

  _addItem: function(mdl) {
    var v = new cdb.geo.ui.Widget.List.ItemView({
      model: mdl
    })
    this.addView(v);
    this.$el.append(v.render().el);
  },

  _checkScroll: function() {
    // Check if gradients are needed
  }

});
