const $ = require('jquery');
const CoreView = require('backbone/core-view');
const DropdownView = require('./dropdown/dropdown-view');
const Utils = require('builder/helpers/utils');
const template = require('./filters.tpl');

const ESC_KEY = 27;

/**
 *  Dashboard filters.
 *
 *  - 'Filter by' collection.
 *  - 'Search' any pattern within collection.
 *
 */
module.exports = CoreView.extend({

  events: {
    'submit .js-search-form': '_submitSearch',
    'keydown .js-search-form': '_onSearchKeyDown',
    'click .js-search-form': 'killEvent',
    'click .js-search-link': '_onSearchClick',
    'click .js-clean-search': '_onCleanSearchClick',
    'click .js-categoriesDropdown': '_createDropdown'
  },

  initialize: function () {
    this._preRender();
    this._initBinds();
  },

  _preRender: function () {
    const $uInner = $('<div>').addClass('u-inner');
    const $filtersInner = $('<div>').addClass('Filters-inner');

    this.$el.append($uInner.append($filtersInner));
  },

  render: function () {
    this.$('.Filters-inner').html(
      template({
        tag: this.collection.options.get('tags'),
        q: this.collection.options.get('q')
      })
    );

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.collection, 'add remove change reset', this.render);
    this.listenTo(this.collection.options, 'change:tags', this.render);
  },

  _createDropdown: function (event) {
    this._setupDropdown(new DropdownView({
      target: $(event.target).closest('.js-categoriesDropdown'),
      tick: 'right',
      collection: this.collection
    }));
  },

  _setupDropdown: function (dropdownView) {
    this.addView(dropdownView);

    dropdownView.render();
    dropdownView.open();
  },

  _onSearchClick: function (event) {
    this.killEvent(event);

    this.$('.js-search-input').val('');
    this.$('.js-search-input').focus();
  },

  _onSearchKeyDown: function (event) {
    if (event.code === ESC_KEY) {
      this._onSearchClick(event);
    }
  },

  // Filter actions

  _onCleanSearchClick: function (event) {
    this.killEvent(event);
    this._cleanSearch();
  },

  _submitSearch: function (event) {
    this.killEvent(event);

    this.model.set('is_searching', true);

    this.collection.options.set({
      q: Utils.stripHTML(this.$('.js-search-input').val().trim(), ''),
      page: 1
    });

    this.render();
  },

  _cleanSearch: function () {
    this.model.set('is_searching', false);

    this.collection.options.set({
      q: '',
      page: 1
    });

    this.render();
  }
});
