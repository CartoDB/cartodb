/**
 *  Category list view
 *
 */

cdb.geo.ui.Widget.Category.ItemsView = cdb.geo.ui.Widget.View.extend({

  _ITEMS_PER_PAGE: 6,

  className: 'Widget-list Widget-list--wrapped js-list',
  tagName: 'ul',

  _PLACEHOLDER: ' ' +
    '<li class="Widget-listItem Widget-listItem--fake"></li>' +
    '<li class="Widget-listItem Widget-listItem--fake"></li>' +
    '<li class="Widget-listItem Widget-listItem--fake"></li>' +
    '<li class="Widget-listItem Widget-listItem--fake"></li>',

  initialize: function() {
    this._ITEMS_PER_PAGE = this.options.itemsPerPage;
    this.filter = this.options.filter;
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.empty();
    var data = this.model.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;

    if (isDataEmpty) {
      this._renderPlaceholder();
    } else {
      this._renderList();
    }
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:data', this.render, this);
  },

  _renderPlaceholder: function() {
    // Change view classes
    this.$el
      .addClass('Widget-list--withBorders')
      .removeClass('Widget-list--wrapped');

    var template = _.template(this._PLACEHOLDER);
    this.$el.append(template());
  },

  _renderList: function() {
    // Change view classes
    this.$el
      .removeClass('Widget-list--withBorders')
      .addClass('Widget-list--wrapped');

    var groupItem;
    var data = this.model.getData();

    data.each(function(mdl, i) {
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
      viewModel: this.viewModel,
      filter: this.filter
    });
    v.bind('itemClicked', this._setFilters, this);
    this.addView(v);
    $parent.append(v.render().el);
  },

  _setFilters: function(mdl) {
    var isSelected = mdl.get('selected');
    var data = this.model.getData();

    if (isSelected) {
      if (!this.filter.hasRejects()) {
        var rejects = [];
        data.map(function(m) {
          var name = m.get('name');
          if (name !== mdl.get('name')) {
            m.set('selected', false);
            rejects.push(name);
          }
        });
        this.filter.reject(rejects);
      } else {
        mdl.set('selected', false);
        this.filter.reject(mdl.get('name'));
      }
    } else {
      mdl.set('selected', true);
      this.filter.accept(mdl.get('name'));
    }
  }

});
