var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var $ = require('jquery');

/**
 * The content of the dropdown menu opened by the user in the data-library filters, e.g.:
 *   Category ▼
 *      ______/\____
 *     |            |
 *     |    this    |
 *     |____________|
 */
module.exports = cdb.admin.DropdownMenu.extend({
  className: 'Dropdown',

  events: {
    'click': 'killEvent',
    'click .js-administrative-regions': '_onClickAdministrative',
    'click .js-cultural-datasets': '_onClickCultural',
    'click .js-physical-datasets': '_onClickPhysical',
    'click .js-historic': '_onClickHistoric',
    'click .js-building-footprints': '_onClickBuilding',
    'click .js-us-census': '_onClickCensus',
    'click .js-all': '_onClickAll'
  },

  initialize: function() {
    this.elder('initialize');
    this.template_base = cdb.templates.getTemplate('data_library/data_library_dropdown_template');

    // Necessary to hide dialog on click outside popup, for example.
    cdb.god.bind('closeDialogs', this.hide, this);
  },

  _onClickAll: function(e) {
    this.model.set('category', null);
    this.hide();
  },

  _onClickAdministrative: function(e) {
    this.model.set('category', 'administrative-regions');
    this.hide();
  },

  _onClickCultural: function(e) {
    this.model.set('category', 'cultural-datasets');
    this.hide();
  },

  _onClickPhysical: function(e) {
    this.model.set('category', 'physical-datasets');
    this.hide();
  },

  _onClickHistoric: function(e) {
    this.model.set('category', 'historic');
    this.hide();
  },

  _onClickBuilding: function(e) {
    this.model.set('category', 'building-footprints');
    this.hide();
  },

  _onClickCensus: function(e) {
    this.model.set('category', 'us-census');
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
