cdb.Widget.ListView = cdb.Widget.View.extend({

  options: {
    listTemplate: '<div></div>',
    listItemTemplate: '<div></div>',
    sync: true
  },

  render: function() {
    this.clearSubViews();
    var template = _.template(this.viewModel.get('listTemplate'));
    this.$el.html(template(this.viewModel.toJSON()));
    this._renderList();
    return this;
  },

  _renderList: function() {
    var $content = this.$('.js-content');
    if (!$content) {
      throw new Error('element for list content not available: .js-content ');
    }

    this.dataModel.getData().each(this._addItem, this);
  },

  _addItem: function(mdl) {
    var $content = this.$('.js-content');
    var v = new cdb.Widget.ListItemView({
      model: mdl,
      template: this.options.listItemTemplate
    })
    this.addView(v);
    $content.append(v.render().el);
  }

});
