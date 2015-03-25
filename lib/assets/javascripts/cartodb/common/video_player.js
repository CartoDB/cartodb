/**
 *  Video player
 *
 */
cdb.admin.VideoPlayer = cdb.core.View.extend({

  className: 'VideoPlayer',

  events: {
    "dblclick": "_toggle",
    "click .js-toggle": "_toggle",
    "click .js-close": "_close",
    "click .js-load_result": "_loadResult",
    "mouseenter": "_mouseEnter",
    "mouseleave": "_mouseLeave"
  },

  _loadResult: function() {
    console.log('load result');
  },

  _mouseEnter: function() {
    this.$el.find(".VideoControls").fadeIn(250);
  },

  _mouseLeave: function() {
    this.$el.find(".VideoControls").fadeOut(250);
  },

  initialize: function() {

    this.localStorage = new cdb.admin.localStorage("VideoPlayer");

    this.videoData = this.localStorage.get("currentVideo") || {};

    var minimized = this.videoData ? this.videoData.minimized : true;

    this.model = new cdb.core.Model({
      minimized: minimized
    });

    this.template = cdb.templates.getTemplate('new_dashboard/views/video_player');
    this._initBinds();
  },

  render: function() {

    this.clearSubViews();

    if (this.videoData && this.videoData.id) {

      this._onChangeMinimized();

      this.$el.html(
        this.template({
        id: this.videoData.id
      }));

      this.$el.draggable({
        create: function( event, ui ) {
          $(this).css({
            position: "fixed"
          });
        }
      });

      this.video = this.$el.find("iframe");
      this._loadScript();
    }

    return this;

  },

  hasVideoData: function() {
    if (this.videoData && this.videoData.id) {
      return true;
    } else {
      return false;
    }
  },

  _initBinds: function() {
    this.model.bind('change:minimized', this._onChangeMinimized, this);
  },

  _loadScript: function() {
    var self = this;
    $.getScript('//f.vimeocdn.com/js/froogaloop2.min.js', function() {
      self._initVideoBinds();
    });
  },

  _initVideoBinds: function() {
    var self = this;

    this.player = $f(this.video[0]);

    this.player.addEvent('ready', function() {

      self.player.api('getDuration', function(dur) {
        console.log(dur)
        self.model.set('duration', dur);
      });

      self._seekToStoredPosition();

      self.player.addEvent('pause', function(m) {
        self._storePlayStatus("stop");
      });

      self.player.addEvent('finish', function(m) {
        self._storePlayStatus("stop");
      });

      self.player.addEvent('play', function(m) {
        //self._seekToStoredPosition();
        self._storePlayStatus("play");
      });

      self.player.addEvent('playProgress', function(m) {
        self._storeVideoInfo(m.seconds);
      });

    });
  },

  _storeVideoInfo: function(seconds) {

    var video = this.localStorage.get("currentVideo");
    video.seconds = seconds;
    this.localStorage.set({ currentVideo: video });

  },

  _clearStoredData: function(status) {
    this.localStorage.set({ currentVideo: null });
  },

  _storeMinimizedState: function(minimized) {

    var video = this.localStorage.get("currentVideo");
    video.minimized = minimized;
    this.localStorage.set({ currentVideo: video });

  },

  _storeVideoProperties: function(x, y, width, height, minimized) {

    var video = this.localStorage.get("currentVideo") || {};
    video.x = x;
    video.y = y;
    video.width = width;
    video.height = height;
    video.minimized = minimized;

    console.log('storing:', video);

    this.localStorage.set({ currentVideo: video });

  },

  _storePlayStatus: function(status) {

    var video = this.localStorage.get("currentVideo");
    video.status = status;
    console.log(status)
    this.localStorage.set({ currentVideo: video });

  },

  _seekToStoredPosition: function() {

    var video = this.localStorage.get("currentVideo");

    console.log(video.status, video.seconds, "---", this.model.get("duration"))

    var self = this;

    if (video.seconds) {
      this.player.api('seekTo', video.seconds);
    }

    if (video.status == "stop") {
      var self = this;
      console.log("stoppped")
      setTimeout(function() {
        self.player.api('pause');
      }, 100);
    }


  },

  _removeVideoBinds: function() {
    var player = $f(this.video[0]);
    player.removeEvent('ready');
    player.removeEvent('playProgress');
  },

  _close: function(e) {
    e.preventDefault();
    e.stopPropagation();

    this._clearStoredData();
    this.remove();

  },

  _toggle: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.model.set("minimized", !this.model.get("minimized"));
  },

  _onChangeMinimized: function() {

    var self = this;

    var windowWidth  = $(window).width();
    var windowHeight = $(document).height();

    var elTop  = this.$el.position().top;
    var elLeft = this.$el.position().left;

    function calcHorizontalPos(w) {
      if ((elLeft + w) > windowWidth) {
        var right = windowWidth - elLeft - self.$el.outerWidth(true);
        self.$el.css({ left: "auto", right: right });
      }
    }

    function calcVerticalPos(h) {
      if ((elTop + h) > windowHeight) {
        var bottom = windowHeight - elTop - self.$el.outerHeight(true);
        self.$el.css({ bottom: bottom, top: "auto" });
      }
    }

    var width = 420;
    var height = 236;

    var minimized = this.model.get("minimized");

    console.log("minimized", minimized);

    if (!minimized) {
      width = 700;
      height = 393;
    }

    calcHorizontalPos(width);
    calcVerticalPos(height);

    this.$el.animate({ width: width, height: height }, { easing: "easeOutQuad", duration: 200 });
    this._storeVideoProperties(this.$el.position().left, this.$el.position().top, width, height, minimized);

  },

  clean: function() {
    this._removeVideoBinds();
    this.elder('clean');
  }

});
