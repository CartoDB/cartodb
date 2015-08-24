var cdb = require('cartodb.js');
var CreateDialog = require('../../common/dialogs/create/create_view');
var VideoTutorialView = require('../../common/dialogs/video_tutorial/video_tutorial_view');

/**
 * Represents a map card on dashboard.
 */

module.exports = cdb.core.View.extend({

  className: 'MapsList-item',
  tagName: 'li',

  events: {
    'click .js-open': '_openVideoTutorialDialog'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('dashboard/maps/placeholder_item');
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      this.template({
        desc: this.model.get('short_description'),
        icon: this.model.get('icon')
      })
    );

    return this;
  },

  _openVideoTutorialDialog: function() {
    var dlg = new VideoTutorialView({
      videoId: this.model.get('videoId'),
      clean_on_hide: true,
      enter_to_confirm: false
    })
    cdb.god.trigger("onTemplateSelected", this);
    dlg.appendToBody();
  }

});
