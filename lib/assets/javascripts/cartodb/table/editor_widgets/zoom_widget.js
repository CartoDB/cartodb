cdb.admin.widgets.Zoom = cdb.core.View.extend({

  events: { },

  initialize: function() {

    _.bindAll(this, "_close");

    this._setupModels();
    this._addZoomControl();

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

  },

  _onChangeY: function() {

    var y = this.model.get("y");
    console.log(y);
    this.$el.animate({ top: y }, 150);

  },

  _onChangeDisplay: function() {

    var display = this.model.get("display");

    if (display) {
      this.show();
    } else {
      this.hide();
    }

  },

  _addZoomControl: function() {

    this.zoomControl = new cdb.geo.ui.Zoom({
      model:    this.options.map,
      template: cdb.templates.getTemplate("table/views/zoom_control")
    });

    this.$el.append(this.zoomControl.render().$el);

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

    this.$el = this.zoomControl.render().$el;

    if (this.model.get("display")) this.$el.show();
    else this.$el.hide();

    this.$el.css({ right: this.model.get("x"), top: this.model.get("y") });

    return this;

  }

});

