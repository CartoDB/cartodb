cdb.geo.ui.Widget.ListView = cdb.geo.ui.Widget.View.extend({

  options: {
    listClasses: 'Widget-list Widget-list--withBorders js-list',
    listTemplate: '<div></div>',
    listItemTemplate: '<div></div>',
    sync: true
  },

  events: {
    'scroll': '_checkScroll'
  },

  render: function() {
    this.clearSubViews();

    var template = _.template(this.viewModel.get('listTemplate'));
    this.$el.html(
      template(
        _.extend(
          this.viewModel.toJSON(),
          {
            itemsCount: this.dataModel.getData().size()
          }
        )
      )
    );

    // Generate list content
    var $ul = $('<ul>').addClass(this.options.listClasses);
    this.$('.js-content').append($ul);

    this._renderList();
    this._renderPagination();
    this._checkScroll();
    return this;
  },

  _renderList: function() {
    var $content = this.$('.js-list');
    if (!$content) {
      throw new Error('element for list content not available: .js-list ');
    }

    this.dataModel.getData().each(this._addItem, this);
  },

  _addItem: function(mdl) {
    var $content = this.$('.js-list');
    var v = new cdb.geo.ui.Widget.ListItemView({
      model: mdl,
      template: this.options.listItemTemplate
    })
    this.addView(v);
    $content.append(v.render().el);
  },

  _renderPagination: function() {
    var listItems = this.dataModel.getData().size();
    if (listItems > 4) {
      var paginator = new cdb.geo.ui.Widget.ListPaginatorView({

      });
      this.$el.append(paginator.render().el);
    }
  },

  _checkScroll: function() {

  }

});
