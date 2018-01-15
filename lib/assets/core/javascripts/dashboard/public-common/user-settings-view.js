var $ = require('jquery');
var CoreView = require('backbone/core-view');
var SettingsDropdown = require('./user-settings/dropdown-view');
var userSettingsTemplate = require('./user-settings.tpl');

/**
 * View to render the user settings section in the header.
 * Expected to be created from existing DOM element.
 */
module.exports = CoreView.extend({

  events: {
    'click .js-dropdown-target': '_createDropdown'
  },

  render: function() {
    var dashboardUrl = this.model.viewUrl().dashboard();
    var datasetsUrl = dashboardUrl.datasets();
    var mapsUrl = dashboardUrl.maps();

    this.$el.html(
      userSettingsTemplate({
        avatarUrl: this.model.get('avatar_url'),
        mapsUrl: mapsUrl,
        datasetsUrl: datasetsUrl
      })
    );

    return this;
  },

  _createDropdown: function(ev) {
    this.killEvent(ev);
    // cdb.god.trigger('closeDialogs');

    var view = new SettingsDropdown({
      target: $(ev.target),
      model: this.model, // user
      horizontal_offset: 18
    });
    view.render();

    view.on('onDropdownHidden', function() {
      view.clean();
    }, this);

    view.open();
  }

});
