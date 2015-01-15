var cdb = require('cartodb.js');
var handleAHref = require('new_common/view_helpers/handle_a_href_on_click');
var pluralizeString = require('new_common/view_helpers/pluralize_string');
var LockDatasetsDialog = require('new_dashboard/dialogs/lock_datasets_view');
var DeleteItemsDialog = require('new_dashboard/dialogs/delete_items/view');

/**
 *  Dashboard filters.
 *
 *  - 'Order by' (time,likes,etc) collection.
 *  - 'Filter by' collection.
 *  - 'Search' any pattern within collection.
 *
 */
module.exports = cdb.core.View.extend({

  className: 'Filters-inner',

  _TOOLTIPS: ['js-likes', 'js-mapviews', 'js-updated_at', 'js-size'],

  events: {
    'submit .js-search-form':   '_submitSearch',
    'click .js-search-form':    'killEvent',
    'click .js-search-link':    '_onSearchClick',
    'click .js-clean-search':   '_onCleanSearchClick',
    'click .js-deselect_all':   '_unselectAll',
    'click .js-select_all':     '_selectAll',
    'click .js-order-link':     '_changeOrder',
    'click .js-delete':         '_openDeleteItemsDialog',
    'click .js-lock':           '_openLockDatasetsDialog',
    'click .js-link':           handleAHref
  },

  initialize: function() {
    this.router = this.options.router;
    this.user = this.options.user;
    this.localStorage = this.options.localStorage;
    this.template = cdb.templates.getTemplate('new_dashboard/views/filters');

    this._initBinds();
  },

  render: function(m, c) {
    this.clearSubViews();

    var selectedItemsCount = this._selectedItems().length;
    // If a change is made from content type we have to know
    // preventing show wrong data about total items
    var changedContentType = c && c.changes && c.changes.content_type;

    this.$el.html(
      this.template(
        _.extend({
            order:                 this.localStorage.get('dashboard.order'),
            isInsideOrg:           this.user.isInsideOrg(),
            prefix:                cdb.config.prefixUrl(),
            selectedItemsCount:    selectedItemsCount,
            maxLayersByMap:        this.user.get('max_layers'),
            totalShared:           changedContentType ? 0 : this.collection.total_shared,
            totalLiked:            changedContentType ? 0 : this.collection.total_likes,
            totalItems:            changedContentType ? 0 : this.collection.total_entries,
            pageItems:             this.collection.size(),
            routerModel:           this.router.model,
            pluralizedContentType: pluralizeString(this.router.model.get('content_type') === "datasets" ? 'dataset' : 'map', selectedItemsCount)
          },
          this.router.model.attributes
        )
      )
    );

    this._initViews();

    this._animate();

    return this;
  },

  _initBinds: function() {
    this.router.model.bind('change', this.render, this);
    this.collection.bind('add remove change reset', this.render, this);
    cdb.god.bind('closeDialogs', this._animate, this);

    this.add_related_model(this.collection);
    this.add_related_model(this.router.model);
    this.add_related_model(cdb.god);
  },

  _initViews: function() {
    // Tipsys?
    var self = this;
    _.each(this._TOOLTIPS, function(el,i){
      self.addView(
        new cdb.common.TipsyTooltip({
          el: self.$('.' + el),
          title: function(e) {
            return $(this).attr('data-title')
          }
        })
      )
    });
  },

  _selectedItems: function() {
    return this.collection.where({ selected: true });
  },

  _animate: function() {
    // Show filters or selected items actions
    var selectedItemsCount = this._selectedItems().length;
    this.$el[ selectedItemsCount > 0 ? 'addClass' : 'removeClass' ]('items--selected');
    
    // Check if any search is applied
    var search = this.router.model.get('q') || this.router.model.get('tag');
    this.$el[ search ? 'addClass' : 'removeClass' ]('search--enabled');
  },


  // Selection actions

  _selectAll: function(e) {
    if (e) e.preventDefault();
    this.collection.each(function(map) {
      if (!map.get('selected'))
        map.set('selected', true)
    })
  },

  _unselectAll: function(e) {
    if (e) e.preventDefault();
    this.collection.each(function(map) {
      if (map.get('selected'))
        map.set('selected', false)
    });
  },

  _openDeleteItemsDialog: function(e) {
    this.killEvent(e);
    (new DeleteItemsDialog({
      selectedItems: this._selectedItems(),
      router: this.router,
      user: this.user
    })).appendToBody();
  },

  _openLockDatasetsDialog: function(e) {
    this.killEvent(e);
    (new LockDatasetsDialog({
      datasets: this._selectedItems()
    })).appendToBody();
  },

  _changeMapsPrivacy: function() {
    console.log("TODO: implement privacy modal dialog");
  },

  _onSearchClick: function(e) {
    if (e) this.killEvent(e);
    this.$el.addClass('search--enabled');
    this.$('.js-search-input').focus();
  },

  // Creation actions

  _newMap: function() {
    console.log("TODO: implement new map modal dialog");
  },

  _newDataset: function() {
    console.log("TODO: implement new dataset modal dialog");
  },

  // Filter actions

  _onCleanSearchClick: function(e) {
    if (e) e.preventDefault();
    this._navigateToUrl({
      search: ''
    });
  },

  _submitSearch: function(e) {
    if (e) e.preventDefault();
    this._navigateToUrl({
      search: this.$('.js-search-input').val().trim()
    });
  },

  _navigateToUrl: function(opts) {
    this.router.navigate(this.router.model.url(opts), { trigger: true });
  },

  _changeOrder: function(e) {
    if (e) e.preventDefault();

    var $el = $(e.target).closest('.js-order-link');
    var order = 'updated_at';

    if ($el.hasClass('js-mapviews')) order = 'mapviews';
    if ($el.hasClass('js-likes')) order = 'likes';
    if ($el.hasClass('js-size')) order = 'size';

    // Order change?
    if (this.router.model.get('order') !== order) {
      this.localStorage.set({ 'dashboard.order': order });
      this.router.model.set('order', order);
    }
  }
});
