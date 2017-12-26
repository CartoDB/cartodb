var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var $ = require('jquery-cdb-v3');

/**
 * The content of the dropdown menu opened by the user avatar in the top-right of the header, e.g.:
 *   Explore, Learn, ♞
 *             ______/\____
 *            |            |
 *            |    this    |
 *            |____________|
 */
module.exports = cdb.admin.DropdownMenu.extend({
  className: 'Dropdown',

  events: {
    'click': 'killEvent',
    'click .js-maps': '_onClickMaps',
    'click .js-datasets': '_onClickDatasets',
    'click .js-both': '_onClickBoth'
  },

  initialize: function() {
    this.elder('initialize');
    this.template_base = cdb.templates.getTemplate('explore/dropdown_template');

    // Necessary to hide dialog on click outside popup, for example.
    cdb.god.bind('closeDialogs', this.hide, this);
  },

  _onClickBoth: function(e) {
    this.model.set('type', null);
    this.hide();
  },

  _onClickDatasets: function(e) {
    this.model.set('type', 'table');
    this.hide();
  },

  _onClickMaps: function(e) {
    this.model.set('type', 'derived');
    this.hide();
  },

  render: function() {
    this.$el.html(this.template_base({ }));

    // TODO: taken from existing code, how should dropdowns really be added to the DOM?
    $('body').append(this.el);

    return this;
  },

  clean: function() {
    this.elder('clean');
  }

});
