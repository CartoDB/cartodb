/**
 *  Video player
 *
 */
cdb.admin.VideoPlayer = cdb.core.View.extend({

  className: 'VideoPlayer',

  defaults: {
    minimized: true,
    size: {
      minimized: {
        width: 420,
        height: 236
      },
      maximized: {
        width : 700,
        height: 393
      }
    },
  },

  events: {
    "dblclick": "_toggle",
    "click .js-toggle": "_toggle",
    "click .js-close": "close",
    "mouseenter": "_mouseEnter",
    "mouseleave": "_mouseLeave"
  },

  initialize: function(id) {

    _.bindAll(this, "_onInitDraggable", "_onStopDragging", "_onCloseAnimationFinished");

    this.template = cdb.templates.getTemplate('new_dashboard/views/video_player');

    this._initLocalStorage();
    this._initModel();
  },

  render: function() {

    var self = this;

    this.clearSubViews();

    if (this.videoData && this.videoData.id) {

      this._onChangeMinimized();

      this.$el.html(
        this.template({
        id: this.videoData.id
      }));

      this.$el.draggable({
        stop: self._onStopDragging,
        create: self._onInitDraggable
      });

      this.video = this.$el.find("iframe");
      this._loadScript();
    }

    return this;

  },

  _initBinds: function() {
    this.model.bind('change:minimized', this._onChangeMinimized, this);
  },

  _initLocalStorage: function() {

    this.localStorage = new cdb.admin.localStorage("VideoPlayer");

    this.videoData = this.localStorage.get("currentVideo") || {};

    if (this.options.id) {
      this._storeVideoID(this.options.id);
      this.videoData = this.localStorage.get("currentVideo");
    }

  },

  _initModel: function() {

    var minimized = this.defaults.minimized;

    if (this.videoData && this.videoData.minimized !== undefined) {
      minimized = this.videoData.minimized;
    }

    this.model = new cdb.core.Model({
      minimized: minimized,
      width:  this.defaults.size[minimized ? "minimized" : "maximized"].width,
      height: this.defaults.size[minimized ? "minimized" : "maximized"].height,
      left: this.videoData ? this.videoData.left : 20,
      bottom: this.videoData ? this.videoData.bottom : 20
    });

    this._initBinds();
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

      self._seekToStoredPosition();

      self.player.addEvent('pause', function(m) {
        self._storePlayStatus("stop");
      });

      self.player.addEvent('finish', function(m) {
        self._storePlayStatus("stop");
        self.close(false, { dontHide: true });
      });

      self.player.addEvent('play', function(m) {
        self._storePlayStatus("play");
      });

      self.player.addEvent('playProgress', function(m) {
        self._storeVideoInfo(m.seconds);
      });

    });
  },

  _removeVideoBinds: function() {
    if (this.player) {
      this.player.removeEvent('ready');
    }
  },

  _onInitDraggable: function(e, ui) {

    var left         = this.model.get("left");
    var elWidth      = this.model.get("width");
    var windowWidth  = $(window).width();

    if ((left + elWidth) > windowWidth) {
      left = windowWidth - elWidth - 20;
    }

    this.$el.css({
      position: "fixed",
      left: left,
      bottom: this.model.get("bottom")
    });

  },

  _onStopDragging: function(e, ui) {

    var windowHeight = $(window).height();
    var top          = ui.position.top;
    var left         = ui.position.left;
    var bottom       = windowHeight - (top + this.$el.outerHeight(true));

    this._storeVideoPosition(left, bottom);
  },

  _mouseEnter: function() {
    this.$el.find(".VideoControls").fadeIn(150);
  },

  _mouseLeave: function() {
    this.$el.find(".VideoControls").fadeOut(150);
  },

  hasVideoData: function() {
    if (this.videoData && this.videoData.id) {
      return true;
    } else {
      return false;
    }
  },

  _saveVideoData: function() {
    this.localStorage.set({ currentVideo: this.videoData });
  },

  _storeVideoID: function(id) {
    this.videoData.id = id;
    this._saveVideoData();
  },

  _storeVideoInfo: function(seconds) {
    this.videoData.seconds = seconds;
    this._saveVideoData();
  },

  _clearStoredData: function(status) {
    this.videoData = {};
    this.localStorage.set({ currentVideo: null });
  },

  _storeMinimizedState: function(minimized) {
    this.videoData.minimized = minimized;
    this._saveVideoData();
  },

  _storeVideoPosition: function(left, bottom) {
    this.videoData.left   = left;
    this.videoData.bottom = bottom;
    this._saveVideoData();
  },

  _storePlayStatus: function(status) {
    this.videoData.status = status;
    this._saveVideoData();
  },

  _seekToStoredPosition: function() {

    var self = this;

    if (this.videoData.seconds) {
      this.player.api('seekTo', this.videoData.seconds);
    }

    if (this.videoData.status === "stop") {

      setTimeout(function() {
        self.player.api('pause');
      }, 100);

    }

  },

  close: function(e, opts) {

    e && e.preventDefault();
    e && e.stopPropagation();

    if (opts && opts.dontHide) {
      this._clearStoredData();
    } else {
      this.$el.animate({ width: 0, height: 0, opacity: 0 }, { easing: "easeInQuad", duration: 200, complete: this._onCloseAnimationFinished });
    }

  },

  _onCloseAnimationFinished: function() {
    this._clearStoredData();
    this._removeVideoBinds();
    this.remove();
  },

  _toggle: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.model.set("minimized", !!!this.model.get("minimized"));
  },

  _onChangeMinimized: function() {

    var self = this;

    var windowWidth    = $(window).width();
    var windowHeight   = $(window).height();
    var documentHeight = $(document).height();

    var elTop  = this.$el.offset().top;
    var elLeft = this.$el.position().left;

    function calcHorizontalPos(w) {
      if ((elLeft + w) > windowWidth) {
        var right = windowWidth - elLeft - self.$el.outerWidth(true);
        self.$el.css({ left: "auto", right: right });
      }
    }

    function calcVerticalPos(h) {
      if ((elTop + h) > documentHeight) {
        var bottom = documentHeight - elTop - self.$el.outerHeight(true);
        self.$el.css({ bottom: bottom, top: "auto" });
      }
    }

    var width  = this.defaults.size.minimized.width;
    var height = this.defaults.size.minimized.height;

    var minimized = this.model.get("minimized");

    if (!minimized) {
      width  = this.defaults.size.maximized.width;
      height = this.defaults.size.maximized.height;
    }

    this.model.set("width", width);
    this.model.set("height", height);

    calcHorizontalPos(width);
    calcVerticalPos(height);

    this.$el.animate({ width: width, height: height }, { easing: "easeOutQuad", duration: 200 });
    this._storeMinimizedState(minimized);

  }

});
