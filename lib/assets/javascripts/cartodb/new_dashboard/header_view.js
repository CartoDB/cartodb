var cdb = require('cartodb.js');
var SettingsDropdown = require('new_dashboard/header/settings_dropdown');

module.exports = cdb.core.View.extend({
  initialize: function(opts) {
    if (!opts.el[0]) throw new Error('The root element must be provided from parent view');
    this._isRendered = false;
  },

  render: function() {
    if (!this._isRendered) {
      this._isRendered = true;
      this._renderSettingsDropdown();
    }

    return this;
  },

  _renderSettingsDropdown: function() {
    // TODO: copied from current dashboard code, should not have to append or reach into existing DOM to add element
    var settingsDropdown = new SettingsDropdown({
      target:         this.$('#settings'),
      model:          this.model,
      template_base:  'new_dashboard/header/settings_dropdown'
    });
    settingsDropdown.render();
    cdb.god.bind("closeDialogs", settingsDropdown.hide, settingsDropdown);
    $('body').append(settingsDropdown.el);
    this.addView(settingsDropdown);
  }
});
