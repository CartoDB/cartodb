/**
 *  Video player
 *
 */
cdb.admin.VideoModel = cdb.core.Model.extend({

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

  initialize: function () {

    this._initLocalStorage();

    var minimized = this.defaults.minimized;

    if (this.videoData && this.videoData.minimized !== undefined) {
      minimized = this.videoData.minimized;
    }

    var defaults = this.defaults.size[minimized ? "minimized" : "maximized"];

    this.set({
      minimized: minimized,
      width: defaults.width,
      height: defaults.height,
      seconds: this.videoData ? this.videoData.seconds : 0,
      top: this.videoData ? this.videoData.top : null,
      left: this.videoData ? this.videoData.left : 20,
      bottom: this.videoData ? this.videoData.bottom : 20
    });

    this.bind('change',  this._onChangeProperty, this);
    this.bind('change:minimized', this._onChangeMinimized, this);

  },

  _initLocalStorage: function() {

    this.localStorage = new cdb.admin.localStorage("VideoPlayer");

    this.videoData = this.localStorage.get("currentVideo") || {};

    var video_id = this.get("video_id");

    if (video_id) {
      this._storeVideoID(video_id);
      this.videoData = this.localStorage.get("currentVideo");
    } else {
      this.set("video_id", this.videoData.video_id);
    }

  },

  _onChangeMinimized: function() {
    var defaults = this.defaults.size[this.get("minimized") ? "minimized" : "maximized"];
    this.set("width", defaults.width);
    this.set("height", defaults.height);

  }, 

  _onChangeProperty: function(m) {
    this.videoData = m.attributes;
    this._saveVideoData();
  },

  _saveVideoData: function() {
    this.set(this.videoData);
    this.localStorage.set({ currentVideo: this.videoData });
  },

  _storeVideoID: function(id) {
    this.videoData.video_id = id;
    this._saveVideoData();
  },

  clearStoredData: function(status) {
    this.set("video_id", null);
    this.videoData = {};
    this.localStorage.set({ currentVideo: null });
  }

});

cdb.admin.VideoPlayer = cdb.core.View.extend({

  className: 'VideoPlayer',

  events: {
    "dblclick": "_toggle",
    "click .js-toggle": "_toggle",
    "click .js-close": "close",
    "mouseenter": "_mouseEnter",
    "mouseleave": "_mouseLeave"
  },

  initialize: function(id) {

    _.bindAll(this, "_onInitDraggable", "_onStopDragging", "_onCloseAnimationFinished");

    this.template = cdb.templates.getTemplate('old_common/views/video_player');

    this._initModel();
  },

  render: function() {

    var self = this;

    this.clearSubViews();

    if (this.hasVideoData()) {

      this.$el.html(
        this.template({
        id: this.model.get("video_id")
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

  _initModel: function() {
    this.model = new cdb.admin.VideoModel({ video_id: this.options.id });
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

      self._seekToStoredPosition();

      self.player.addEvent('pause', function(m) {
        self.model.set("status", "stop");
      });

      self.player.addEvent('finish', function(m) {
        self.model.set("status", "stop");
        self.close(false, { dontHide: true });
      });

      self.player.addEvent('play', function(m) {
        self.model.set("status", "play");
      });

      self.player.addEvent('playProgress', function(m) {
        self.model.set("seconds", m.seconds);
      });

    });
  },

  _removeVideoBinds: function() {
    if (this.player) {
      this.player.removeEvent('ready');
    }
  },

  _onInitDraggable: function(e, ui) {

    var bottom       = this.model.get("bottom");
    var left         = this.model.get("left");
    var elHeight     = this.model.get("height");
    var elWidth      = this.model.get("width");
    var windowWidth  = $(window).width();

    if ((left + elWidth) > windowWidth) {
      left = windowWidth - elWidth - 20;
    }

    this.$el.css({
      position: "fixed",
      left: left,
      bottom: bottom
    });

    if (bottom < 0) {
      this.$el.animate({ bottom: 20, width: elWidth, height: elHeight }, { easing: "easeOutQuad", duration: 200 });
    } else {
      this.$el.animate({ width: elWidth, height: elHeight }, { easing: "easeOutQuad", duration: 200 });
    }

  },

  _onStopDragging: function(e, ui) {

    var windowHeight = $(window).height();
    var top          = ui.position.top;
    var left         = ui.position.left;
    var bottom       = windowHeight - (top + this.$el.outerHeight(true));

    this.$el.css({ bottom: "auto"})

    this.model.set({ top: top, left: left, bottom: bottom });
  },

  _mouseEnter: function() {
    this.$el.find(".VideoControls").fadeIn(150);
  },

  _mouseLeave: function() {
    this.$el.find(".VideoControls").fadeOut(150);
  },

  hasVideoData: function() {
    if (this.model.get("video_id")) {
      return true;
    } else {
      return false;
    }
  },

  _seekToStoredPosition: function() {

    var self = this;

    var seconds = this.model.get("seconds");

    if (seconds) {
      this.player.api('seekTo', seconds);
    }

    if (this.model.get("status") === "stop") {

      setTimeout(function() {
        self.player.api('pause');
      }, 100);

    }

  },

  close: function(e, opts) {

    if (e) this.killEvent(e);

    if (opts && opts.dontHide) {
      this.model.clearStoredData();
    } else {
      this.$el.animate({ width: 0, height: 0, opacity: 0 }, { easing: "easeInQuad", duration: 200, complete: this._onCloseAnimationFinished });
    }

  },

  _onCloseAnimationFinished: function() {
    this.model.clearStoredData();
    this._removeVideoBinds();
    this.remove();
  },

  _toggle: function(e) {

    if (e) this.killEvent(e);

    this.model.set("minimized", !!!this.model.get("minimized"));
  },

  _onChangeMinimized: function() {

    var self = this;

    var windowWidth    = $(window).width();
    var windowHeight   = $(window).height();
    var documentHeight = $(document).height();

    var bottom = this.model.get("bottom");
    var top    = this.model.get("top");

    var elTop  = this.$el.offset().top;
    var elLeft = this.$el.position().left;

    function setHorizontalPosition(w) {
      if ((elLeft + w) > windowWidth) {
        var right = windowWidth - elLeft - self.$el.outerWidth(true);
        self.$el.css({ left: "auto", right: right });
      }
    }

    function setVerticalPosition(h) {
       if (top < 0 || self.$el.offset().top < 0) {
        self.$el.animate({ top: 20 }, 100);
       } else if (top - h < 0 || self.$el.offset().top - h < 0) {
        self.$el.css({ bottom: "auto", top: top });
      } else if (bottom < 0) {
        self.$el.css({ top: "auto", bottom: 20 });
      } else if ((top + h) > windowHeight) {
        self.$el.css({ top: "auto", bottom: bottom });
      } 
    }

    var width  = this.model.get("width");
    var height = this.model.get("height");

    setHorizontalPosition(width);
    setVerticalPosition(height);

    this.$el.animate({ width: width, height: height }, { easing: "easeOutQuad", duration: 200, complete: function() {
      var bottom = $(window).height() - ($(".VideoPlayer").offset().top + $(".VideoPlayer").outerHeight(true));
      self.model.set("bottom", bottom);
    } });

  }

});
