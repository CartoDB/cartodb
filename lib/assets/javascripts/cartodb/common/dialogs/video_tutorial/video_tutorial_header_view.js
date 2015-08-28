var cdb = require('cartodb.js');

/**
 *  Video tutorial header view
 *
 *  Header content for video tutorials
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-back': '_backToList'
  },
  
  initialize: function() {
    this.template = cdb.templates.getTemplate('common/dialogs/video_tutorial/video_tutorial_header_template');
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

  _backToList: function() {
    this.model.unset('videoId');
  }

});