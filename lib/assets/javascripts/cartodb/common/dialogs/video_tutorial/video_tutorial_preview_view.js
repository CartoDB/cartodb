var cdb = require('cartodb.js');

/**
 *  Video preview view
 *
 *  It will display the selected map template, a video
 *  with advices
 *
 */

module.exports = cdb.core.View.extend({

  className: 'VideoTutorial-video',

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/dialogs/video_tutorial/video_tutorial_preview_template');
    this.localStorage = new cdb.admin.localStorage("VideoPlayer");
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    var d = this.model.getVideoTemplate();
    if (d && d.name) {
      this.$el.html(this.template(d));
      this._loadScript();
    }
    return this;
  },

  _storeVideoInfo: function(seconds) {
    this.localStorage.set({ currentVideo: { seconds: seconds } });
  },

  _storeVideoInfoWithId: function(seconds) {
    var videoId = this.model.get('videoId');
    this.localStorage.set({ currentVideo: { video_id: videoId, seconds: seconds } });
  },

  _loadScript: function() {
    var self = this;
    $.getScript('//f.vimeocdn.com/js/froogaloop2.min.js', function() {
      self._initVideoBinds();
    });
  },

  _initVideoBinds: function() {
    var self = this;

    this._removeVideoBinds();
    this.player = $f(this.$("iframe")[0]);

    this.player.addEvent('ready', function() {
      self.player.addEvent('playProgress', function(m) {
        self._storeVideoInfo(m.seconds);
      });
    });
  },

  _removeVideoBinds: function() {
    if (!this.player) return;
    this.player.removeEvent('ready');
  },

  _initBinds: function() {
    this.model.bind('change:videoId', this.render, this);
  },

  clean: function() {
    this._removeVideoBinds();
    this.elder('clean');
  }

});