cdb.admin.widgets.ZoomInfo = cdb.core.View.extend({

  tagName: 'div',
  className: 'cartodb-zoom-info',

  events: {
  },

  initialize: function() {

    _.bindAll(this, "_close");

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

    this.map.bind("change:zoom", this.render, this);

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

  _onMouseDown:      function() { },
  _onMouseEnterText: function() { },
  _onMouseLeaveText: function() { },
  _onMouseEnter:     function() { },
  _onMouseLeave:     function() { },

  show: function() {

    this.$el.fadeIn(250);

  },

  hide: function(callback) {

    var self = this;

    callback && callback();

    this.$el.fadeOut(250);

  },

  _close: function(e) {

    this._killEvent(e);

    var self = this;

    this.hide(function() {
      self.trigger("remove", self);
    });

  },

  render: function() {

    var self = this;

    this.$el.html(this.map.get("zoom"));

    if (this.model.get("display")) this.$el.show();
    else this.$el.hide();

    this.$el.css({ left: this.model.get("x"), top: this.model.get("y") });

    this.$el.tipsy({
      title: function() { return "Zoom level" },
      fade: true,
      offset: 3,
      gravity: 'w'
    });

    return this;

  }

});
