var cdb = require('cartodb.js');

/**
 *  Video tutorial footer view
 *
 *  Footer content for video tutorials
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-start': '_startTutorial'
  },
  
  initialize: function() {
    this.template = cdb.templates.getTemplate('common/dialogs/video_tutorial/video_tutorial_footer_template');
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.template({
        isVideoSelected: this.model.isVideoSelected()
      })
    );
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:videoId', this.render, this);
  },

  _startTutorial: function(e) {
    var videoId = this.model.get('videoId');
    if (videoId) {
      cdb.god.trigger('startTutorial', videoId, this);
    }
  }

});