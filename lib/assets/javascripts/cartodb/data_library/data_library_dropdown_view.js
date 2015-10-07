// var c = new Backbone.Collection([
//     {id: 1, name: "jonas"},
//     {id: 2, name: "jonas"},
//     {id: 3, name: "smirk"}
// ]);

// var names = _.uniq(c.pluck('name'));
// console.log(names.length);
// console.log(names);

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
    'click .js-all': '_onClickAll',
    'click .js-categoryLink': '_onClickLink'
  },

  initialize: function() {
    console.log("pasa dropdown");
    console.log(this.collection.options.get('tags'));
    this.elder('initialize');
    this.template_base = cdb.templates.getTemplate('data_library/data_library_dropdown_template');

    // Necessary to hide dialog on click outside popup, for example.
    cdb.god.bind('closeDialogs', this.hide, this);

    this._initBinds();
  },

  _initBinds: function() {
    this.add_related_model(this.collection);
  },

  _onClickAll: function(e) {
    this.collection.options.set('tags', null);
    console.log(this.collection.options.get('tags'));
    this.hide();
  },

  _onClickLink: function(e) {
    this.collection.options.set('tags', 'US Census');
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
