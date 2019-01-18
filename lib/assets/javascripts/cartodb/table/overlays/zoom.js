cdb.admin.overlays.Zoom = cdb.core.View.extend({

  tagName: 'div',
  className: 'cartodb-zoom',

  events: {
    'click .zoom_in': 'zoom_in',
    'click .zoom_out': 'zoom_out'
  },

  default_options: {
    timeout: 0,
    msg: ''
  },

  template_name: 'table/views/overlays/zoom',

  initialize: function() {

    _.bindAll(this, "_close");

    this.template = this.getTemplate(this.template_name);

    this.map = this.options.map;

    _.defaults(this.options, this.default_options);

    this._setupModels();

  },

  _killEvent: function(e) {

    e && e.preventDefault();
    e && e.stopPropagation();

  },

  // Setup the internal and custom model
  _setupModels: function() {

    this.model = this.options.model;

    this.model.on("change:display", this._onChangeDisplay, this);
    this.model.on("change:y",       this._onChangeY, this);

    this.map.bind('change:zoom change:minZoom change:maxZoom', this._checkZoom, this);

    this.model.on("destroy", function() {
      this.$el.remove();
    }, this);

  },

  _onChangeY: function() {

    var y = this.model.get("y");
    this.$el.animate({ top: y }, 150);

    this.trigger("change_y", this);

  },

  _onChangeDisplay: function() {

    var display = this.model.get("display");

    if (display) {
      this.show();
    } else {
      this.hide();
    }

  },

  _checkZoom: function() {

    var zoom = this.map.get('zoom');

    this.$('.zoom_in')[ zoom < this.map.get('maxZoom') ? 'removeClass' : 'addClass' ]('disabled')
    this.$('.zoom_out')[ zoom > this.map.get('minZoom') ? 'removeClass' : 'addClass' ]('disabled')

    this.$el.find(".info").html(zoom);

  },

  zoom_in: function(ev) {
    if (this.map.get("maxZoom") > this.map.getZoom()) {
      this.map.setZoom(this.map.getZoom() + 1);
    }
    ev.preventDefault();
    ev.stopPropagation();
  },

  zoom_out: function(ev) {
    if (this.map.get("minZoom") < this.map.getZoom()) {
      this.map.setZoom(this.map.getZoom() - 1);
    }
    ev.preventDefault();
    ev.stopPropagation();
  },

  _onMouseDown:      function() { },
  _onMouseEnterText: function() { },
  _onMouseLeaveText: function() { },
  _onMouseEnter:     function() { },
  _onMouseLeave:     function() { },

  show: function() {

    var self = this;

    this.$el.fadeIn(250, function() {
      self.trigger("change_y", self);
    });

  },

  hide: function(callback) {

    var self = this;

    callback && callback();

    this.$el.fadeOut(250, function() {
      self.trigger("change_y", self);
    });

  },

  _close: function(e) {

    this._killEvent(e);

    var self = this;

    this.hide(function() {
      self.trigger("remove", self);
    });

  },

  _toggleFullScreen: function(ev) {

    ev.stopPropagation();
    ev.preventDefault();

    var doc   = window.document;
    var docEl = doc.documentElement;

    if (this.options.doc) { // we use a custom element
      docEl = $(this.options.doc)[0];
    }

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen;
    var cancelFullScreen  = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen;

    var mapView = this.options.mapView;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement) {

      requestFullScreen.call(docEl);

      if (mapView) {

        if (this.model.get("allowWheelOnFullscreen")) {
          mapView.options.map.set("scrollwheel", true);
        }

      }

    } else {

      cancelFullScreen.call(doc);

    }

  },

  render: function() {

    var self = this;

    this.$el.append(this.template());

    this.$el.css({ left: this.model.get("x"), top: this.model.get("y") });

    this._checkZoom();

    this._createTooltip();

    return this;

  },

  _createTooltip: function(elem) {

    var tooltip = new cdb.common.TipsyTooltip({
      el: this.$('.info'),
      gravity: 'w',
      title: function() {
        return ("zoom level");
      }
    })

    this.addView(tooltip);
  }

});
