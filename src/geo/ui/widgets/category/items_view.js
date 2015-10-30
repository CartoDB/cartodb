cdb.geo.ui.Widget.Category.ItemsView = cdb.geo.ui.Widget.View.extend({

  _ITEMS_PER_PAGE: 4,

  className: 'Widget-list Widget-list--wrapped js-list',
  tagName: 'ul',

  _PLACEHOLDER: ' ' +
    '<li class="Widget-listItem Widget-listItem--fake"></li>' +
    '<li class="Widget-listItem Widget-listItem--fake"></li>' +
    '<li class="Widget-listItem Widget-listItem--fake"></li>' +
    '<li class="Widget-listItem Widget-listItem--fake"></li>',

  initialize: function() {
    this._ITEMS_PER_PAGE = this.options.itemsPerPage;
    this.dataModel = this.options.dataModel;
    this.viewModel = this.options.viewModel;
    this.filter = this.options.filter;
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.empty();
    var data = this.dataModel.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;

    if (isDataEmpty) {
      this._renderPlaceholder();
    } else {
      this._renderList();
    }
    return this;
  },

  _initBinds: function() {
    this.dataModel.once('error change:data', this._onFirstLoad, this);
    this.viewModel.bind('change:sync', this._checkBinds, this);
    this.add_related_model(this.dataModel);
    this.add_related_model(this.viewModel);
  },

  _onFirstLoad: function() {
    this.render();
    this._unbindEvents(); // Remove any old dataModel binding
    this._checkBinds();
  },

  _checkBinds: function() {
    var isSync = this.viewModel.get('sync');
    this[ isSync ? '_bindEvents' : '_unbindEvents']();
  },

  _bindEvents: function() {
    this.dataModel.bind('change:data', this.render, this);
  },

  _unbindEvents: function() {
    this.dataModel.unbind(null, null, this);
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
    var data = this.dataModel.getData();

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
    })
    this.addView(v);
    $parent.append(v.render().el);
  }

});
