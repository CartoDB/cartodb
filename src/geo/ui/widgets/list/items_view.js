cdb.geo.ui.Widget.List.ItemsView = cdb.geo.ui.Widget.View.extend({

  className: 'Widget-list js-list',
  tagName: 'ul',

  events: {
    'scroll': '_checkScroll'
  },

  render: function() {
    this.clearSubViews();
    this._renderList();
    return this;
  },

  _renderList: function() {
    this.model.getData().each(this._addItem, this);
  },

  _addItem: function(mdl) {
    var v = new cdb.geo.ui.Widget.List.ItemView({
      model: mdl,
      viewModel: this.model
    });
    v.bind('itemClicked', function(){
      this.trigger('itemClicked', mdl, this);
    }, this);
    this.addView(v);
    this.$el.append(v.render().el);
  }

});
