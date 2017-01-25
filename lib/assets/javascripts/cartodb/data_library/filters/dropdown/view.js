var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var $ = require('jquery-cdb-v3');

/**
 * The content of the dropdown menu opened by the user in the data-library filters, e.g.:
 *   Category ▼
 *      ______/\____
 *     |            |
 *     |    this    |
 *     |____________|
 */
module.exports = cdb.admin.DropdownMenu.extend({
  className: 'CDB-Text Dropdown Dropdown--public',

  events: {
    'click': 'killEvent',
    'click .js-all': '_onClickAll',
    'click .js-categoryLink': '_onClickLink'
  },

  initialize: function() {
    this.elder('initialize');
    this.template_base = cdb.templates.getTemplate('data_library/filters/dropdown/template');

    // TODO: fetch tags dynamically

    // Necessary to hide dialog on click outside popup, for example.
    cdb.god.bind('closeDialogs', this.hide, this);

    this._initBinds();
  },

  _initBinds: function() {
    this.add_related_model(this.collection);
  },

  _onClickAll: function(e) {
    this.collection.options.set({
      tags: '',
      page: 1
    });
    this.hide();
  },

  _onClickLink: function(e) {
    var tag = $(e.target).text();

    this.collection.options.set({
      tags: tag,
      page: 1
    });
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
