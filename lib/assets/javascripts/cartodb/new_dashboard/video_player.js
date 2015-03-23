var cdb = require('cartodb.js');
var $ = require('jquery');
var _ = require('underscore');

/**
 *  Video player
 *
 */
module.exports = cdb.core.View.extend({

  className: 'VideoPlayer',

  events: {

  },

  initialize: function() {

    this.video = this.options.video;
    this.model = new cdb.core.Model({
      duration: 0,
      percent: 0,
      seconds: 0
    });

    this.template = cdb.templates.getTemplate('new_dashboard/views/video_player');
    this._initBinds();
    //this._loadScript();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(
      this.template({})
    );
    //this._initViews();
    return this;
  },


  _initBinds: function() {
    this.model.bind('change:duration', this.render, this);
    this.model.bind('change:percent', this._changeProgress, this);
    this.model.bind('change:seconds', this._checkTooltips, this);
  },

  _loadScript: function() {
    var self = this;
    $.getScript('//f.vimeocdn.com/js/froogaloop2.min.js', function() {
      self._initVideoBinds();
    });
  },

  _initVideoBinds: function() {
    var player = $f(this.video[0]);
    var self = this;

    player.addEvent('ready', function() {
      player.api('getDuration', function(dur) {
        self.model.set('duration', dur);
      });

      player.addEvent('playProgress', function(m) {
        self.model.set(m);
      });
    });
  },

  _removeVideoBinds: function() {
    var player = $f(this.video[0]);
    player.removeEvent('ready');
    player.removeEvent('playProgress');
  },

  clean: function() {
    this._removeVideoBinds();
    this.elder('clean');
  }

});
