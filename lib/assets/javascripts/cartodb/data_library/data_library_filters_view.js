var cdb = require('cartodb.js');
var DropdownView = require('./data_library_dropdown_view');

/**
 *  Dashboard filters.
 *
 *  - 'Filter by' collection.
 *  - 'Search' any pattern within collection.
 *
 */
module.exports = cdb.core.View.extend({

  events: {
    'submit .js-search-form': '_submitSearch',
    'keydown .js-search-form': '_onSearchKeyDown',
    'click .js-search-form': 'killEvent',
    'click .js-search-link': '_onSearchClick',
    'click .js-clean-search': '_onCleanSearchClick',
    'click .js-categories-dropdown': '_createDropdown'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('data_library/data_library_filters_template');

    this._preRender();
    this._initBinds();
  },

  _preRender: function() {
    var $uInner = $('<div>').addClass('u-inner');
    var $filtersInner = $('<div>').addClass('Filters-inner');
    this.$el.append($uInner.append($filtersInner));
  },

  render: function() {
    console.log("entra filter");
    console.log(this.collection.options);

    this.$('.Filters-inner').html(
      this.template()
    );

    return this;
  },

  _initBinds: function() {
    this.collection.bind('add remove change reset', this.render, this);
    cdb.god.bind('closeDialogs', this._animate, this);

    this.add_related_model(this.collection);
    this.add_related_model(cdb.god);
  },

  _createDropdown: function(ev) {
    console.log("pasa filter");
    console.log(this.collection.options.get('tags'));
    this.killEvent(ev);
    this._setupDropdown(new DropdownView({
      target: $(ev.target),
      horizontal_position: 'horizontal_left',
      horizontal_offset: -110,
      tick: 'center',
      collection: this.collection,
      position: 'offset',
      vertical_offset: 0
    }));
  },

  _setupDropdown: function(dropdownView) {
    this.addView(dropdownView);
    cdb.god.bind('closeDialogs', function() {
      dropdownView.clean();
    }, this);

    this.add_related_model(cdb.god);

    dropdownView.render();
    dropdownView.open();
  },

  // _animate: function() {
  //   // Check if any search is applied
  //   this.$('.Filters-inner')[ this.router.model.isSearching() ? 'addClass' : 'removeClass' ]('search--enabled');
  // },

  _onSearchClick: function(e) {
    this.killEvent(e);
    var wasSearchInputVisible = this.$('.Filters-inner').hasClass('search--enabled');
    this.$('.Filters-inner').toggleClass('search--enabled', !wasSearchInputVisible);

    if (this.router.model.isSearching()) {
      this._cleanSearch();
    } else if (!wasSearchInputVisible) {
      this.$('.js-search-input').val('');
      this.$('.js-search-input').focus();
    }
  },

  _onSearchKeyDown: function(e) {
    if (e.keyCode === 27) {
      this._onSearchClick(e);
    }
  },

  // Filter actions

  _onCleanSearchClick: function(e) {
    this.killEvent(e);
    this._cleanSearch();
  },

  _submitSearch: function(e) {
    this.killEvent(e);
    this._navigateToUrl({
      search: Utils.stripHTML(this.$('.js-search-input').val().trim(),''),
      page: 1,
      liked: false,
      shared: 'no',
      library: false,
      locked: false
    });
  },

  _cleanSearch: function() {
    this._navigateToUrl({
      search: '',
      liked: false,
      library: false,
      shared: 'no'
    });
  },

  clean: function() {
    this._unbindScroll();
    cdb.core.View.prototype.clean.call(this);
  }

});
