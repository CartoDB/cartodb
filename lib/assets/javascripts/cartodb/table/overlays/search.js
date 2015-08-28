cdb.admin.overlays.Search = cdb.core.View.extend({

  events: { },

  initialize: function() {

    _.bindAll(this, "_close");

    this._setupModels();
    this._addSearchControl();

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

    this.model.on("destroy", function() {
      this.$el.remove();
    }, this);

  },

  _onChangeX: function() {

    var x    = this.model.get("x");
    var self = this;

    this.$el.animate({ right: x }, { duration: 150, complete: function() {

      self.trigger("change_x", this);

    }});

    //if (this.model) this.model.save();

  },

  _onChangeY: function() {

    var y = this.model.get("y");
    this.$el.animate({ top: y }, 150);

    //if (this.model) this.model.save();

  },

  _onChangeDisplay: function() {

    var display = this.model.get("display");

    if (display) {
      this.show();
    } else {
      this.hide();
    }

  },

  _addSearchControl: function() {

    this.searchControl = new cdb.geo.ui.Search({
      model:  this.options.map,
      mapView: this.options.mapView,
      searchPin: true,
      template: cdb.templates.getTemplate("table/views/search_control")
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

  _toggleDisplay: function() {

    this.model.get("display") ? this.$el.show() : this.$el.hide();

  },

  _position: function() {
    // Always position the top according to model
    var attrs = {
      top: this.model.get("y")
    };

    if (!this.options.relative_position) {
      attrs.right = this.model.get("x");
    }

    this.$el.css(attrs);
  },

  render: function() {

    var self = this;

    this.$el = this.searchControl.render().$el;

    this._toggleDisplay();
    this._position();

    return this;

  }

});
