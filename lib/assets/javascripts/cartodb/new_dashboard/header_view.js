var cdb = require('cartodb.js');
var SettingsDropdown = require('new_dashboard/header/settings_dropdown_view');
var $ = require('jquery');

module.exports = cdb.core.View.extend({
  events: {
    'click #settings': '_renderSettingsDropdown'
  },

  initialize: function(opts) {
    if (!opts.el[0]) throw new Error('The root element must be provided from parent view');
  },

  render: function() {
    this.clearSubViews();
    return this;
  },

  _renderSettingsDropdown: function(ev) {
    this.killEvent(ev);

    var settingsDropdown = new SettingsDropdown({
      target:         this.$('#settings'),
      model:          this.model,
      navigation:     this.options.navigation,
      template_base:  'new_dashboard/header/settings_dropdown'
    });

    settingsDropdown.on('onDropdownHidden', function() {
      settingsDropdown.clean();

      // Until https://github.com/CartoDB/cartodb.js/issues/238 is resolved:
      this.$('#settings').unbind('click');
      this.delegateEvents();
    }, this);

    settingsDropdown.render();
    this.addView(settingsDropdown);
    settingsDropdown.open();
  }
});
