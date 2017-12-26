cdb.admin.overlays.Loader = cdb.core.View.extend({

  tagName: 'div',
  className: 'cartodb-tiles-loader',

  template_name: 'table/views/overlays/loader',

  default_options: {
    animationSpeed: 500
  },

  initialize: function() {

    _.bindAll(this, "_close");

    this.isVisible = 0;
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

    this.model.on("change:y", this._onChangeY, this);

    this.map.bind('change:zoom change:minZoom change:maxZoom', this._checkZoom, this);

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

  show: function(ev) {

    if (this.isVisible) return;

    if (!$.browser.msie || ($.browser.msie && $.browser.version.indexOf("9.") != 0)) {
      this.$el.fadeIn(this.options.animationSpeed);
    } else {
      this.$el.show();
    }

    this.isVisible++;
  },

  hide: function(ev) {

    this.isVisible--;

    if (this.isVisible > 0) return;

    this.isVisible = 0;

    if (!$.browser.msie || ($.browser.msie && $.browser.version.indexOf("9.") == 0)) {
      this.$el.fadeOut(this.options.animationSpeed);
    } else {
      this.$el.hide();
    }

  },

  visible: function() {
    return this.isVisible > 0;
  },

  _onMouseDown:      function() { },
  _onMouseEnterText: function() { },
  _onMouseLeaveText: function() { },
  _onMouseEnter:     function() { },
  _onMouseLeave:     function() { },

  _close: function(e) {

    this._killEvent(e);

    var self = this;

    this.hide(function() {
      self.trigger("remove", self);
    });

  },

  render: function() {

    var self = this;

    this.$el.html($(this.template(this.options)));

    this.$el.css({ left: this.model.get("x"), top: this.model.get("y") });

    // Create tipsy and set to the tiles loader
    this.$el.find("div.loader").tipsy({
      title: function() { return "Loading tiles..." },
      fade: true,
      offset: 3,
      gravity: 'w'
    });

    //if (this.model.get("display")) this.$el.show();
    //else this.$el.hide();

    return this;

  }

});
