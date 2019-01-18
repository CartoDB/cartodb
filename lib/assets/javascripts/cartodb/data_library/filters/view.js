var cdb = require('cartodb.js-v3');
var DropdownView = require('./dropdown/view');
var Utils = require('cdb.Utils');

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
    'click .js-categoriesDropdown': '_createDropdown'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('data_library/filters/template');

    this._preRender();
    this._initBinds();
  },

  _preRender: function() {
    var $uInner = $('<div>').addClass('u-inner');
    var $filtersInner = $('<div>').addClass('Filters-inner');
    this.$el.append($uInner.append($filtersInner));
  },

  render: function() {
    this.$('.Filters-inner').html(
      this.template({
        tag: this.collection.options.get('tags'),
        q: this.collection.options.get('q')
      })
    );

    return this;
  },

  _initBinds: function() {
    this.collection.bind('add remove change reset', this.render, this);
    this.collection.options.bind('change:tags', this.render, this);
    this.add_related_model(this.collection);
    this.add_related_model(this.collection.options);
    this.add_related_model(cdb.god);
  },

  _createDropdown: function(ev) {
    this.killEvent(ev);
    this._setupDropdown(new DropdownView({
      target: $(ev.target).closest('.js-categoriesDropdown'),
      horizontal_position: 'horizontal_left',
      horizontal_offset: -90,
      tick: 'center',
      collection: this.collection,
      position: 'offset',
      vertical_offset: -20
    }));
  },

  _setupDropdown: function(dropdownView) {
    this._closeAnyOtherOpenDialogs();

    this.addView(dropdownView);
    cdb.god.bind('closeDialogs', function() {
      dropdownView.clean();
    }, this);

    this.add_related_model(cdb.god);

    dropdownView.render();
    dropdownView.open();
  },

  _closeAnyOtherOpenDialogs: function() {
    cdb.god.trigger("closeDialogs");
  },

  _onSearchClick: function(e) {
    this.killEvent(e);

    this.$('.js-search-input').val('');
    this.$('.js-search-input').focus();
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

    this.model.set('is_searching', true);

    this.collection.options.set({
      q: Utils.stripHTML(this.$('.js-search-input').val().trim(),''),
      page: 1
    });

    this.render();
  },

  _cleanSearch: function() {
    this.model.set('is_searching', false);

    this.collection.options.set({
      q: '',
      page: 1
    });

    this.render();
  }

});
