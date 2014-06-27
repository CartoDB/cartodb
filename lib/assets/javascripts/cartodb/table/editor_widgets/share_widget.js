cdb.admin.widgets.Share = cdb.core.View.extend({

  className: "cartodb-share",

  template_name: 'table/views/widgets/share',

  events: { },

  initialize: function() {

    _.bindAll(this, "_close");

    this.template = this.getTemplate(this.template_name);

    this._setupModels();
    //this._addControl();

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
    this.model.on("change:x",       this._onChangeX, this);

  },

  _onChangeX: function() {

    var x = this.model.get("x");
    this.$el.animate({ right: x }, 150);

  },

  _onChangeY: function() {

    var y = this.model.get("y");
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

  _addControl: function() {

    this.control = new cdb.ui.common.FullScreen({
      doc: ".map",
      mapView: this.options.mapView,
      template: this.getTemplate("table/views/fullscreen")
    });

  },

  _onMouseDown:      function() { },
  _onMouseEnterText: function() { },
  _onMouseLeaveText: function() { },
  _onMouseEnter:     function() { },
  _onMouseLeave:     function() { },

  show: function() {

    var self = this;

    this.$el.fadeIn(250, function() {
      self.trigger("change_x", this);
    });

  },

  hide: function(callback) {

    var self = this;

    callback && callback();

    this.$el.fadeOut(250, function() {
      self.trigger("change_x", this);
    });

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

    this.$el.append(this.template());

    this.$el.css({ right: this.model.get("x"), top: this.model.get("y") });

    if (this.model.get("display")) this.$el.show();
    else this.$el.hide();

    return this;

  }

});
