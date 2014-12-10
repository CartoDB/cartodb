var cdb = require('cartodb.js');
var SettingsDropdown = require('./header/settings_dropdown_view');
var MapsDropdown = require('./header/maps_dropdown_view');
var $ = require('jquery');

var settingsDropdownId = '#header-settings-dropdown';
var mapsDropdownId = '#header-maps-dropdown';
var events = {};
events['click '+ settingsDropdownId] = '_createSettingsDropdown';
events['click '+ mapsDropdownId] = '_createMapsDropdown';

/**
 * Responsible for the header part of the layout.
 * It's currently pre-rendered server-side, why the header element is required to be given when instantiating the view.
 */
module.exports = cdb.core.View.extend({
  events: events,

  initialize: function(args) {
    if (!args.el) throw new Error('The root element must be provided from parent view');
    this.router = args.router;
  },

  render: function() {
    this.clearSubViews();
    return this;
  },

  _createSettingsDropdown: function(ev) {
    this.killEvent(ev);

    this._setupDropdown(new SettingsDropdown({
      target:         this.$(settingsDropdownId),
      model:          this.model,
      navigation:     this.options.navigation,
      template_base:  'new_dashboard/header/settings_dropdown'
    }));
  },

  _createMapsDropdown: function(ev) {
    this.killEvent(ev);

    this._setupDropdown(new MapsDropdown({
      target:        this.$(mapsDropdownId),
      model:         this.model,
      router:        this.router,
      template_base: 'new_dashboard/header/maps_dropdown'
    }));
  },

  _setupDropdown: function(dropdownView) {
    this._closeAnyOtherOpenDialogs();
    this.addView(dropdownView);

    dropdownView.on('onDropdownHidden', function() {
      this._removeDropdown(dropdownView);
    }, this);

    dropdownView.render();
    dropdownView.open();
  },

  _removeDropdown: function(dropdownView) {
    dropdownView.clean();

    // Until https://github.com/CartoDB/cartodb.js/issues/238 is resolved:
    dropdownView.options.target.unbind('click');
  },

  _closeAnyOtherOpenDialogs: function() {
    cdb.god.trigger("closeDialogs");
  }
});
