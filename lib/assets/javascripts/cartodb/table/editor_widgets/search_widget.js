cdb.admin.widgets.Search = cdb.core.View.extend({

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

  _addSearchControl: function() {
    this.searchControl = new cdb.geo.ui.Search({
      model:    this.options.map,
      template: cdb.templates.getTemplate("table/views/search_control")
    });

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

  _putOnTop: function() {

    $(".widget").css("z-index", 999);
    this.$el.css("z-index", 2001);

  },

  render: function() {

    var self = this;

    this.$el = this.searchControl.render().$el;

    if (this.model.get("display")) this.$el.show();
    else this.$el.hide();

    //this.$el.offset({
      //right:  this.model.get("x"),
      //top:   this.model.get("y")
    //});

    this.$el.css({ right: this.model.get("x"), top: this.model.get("y") });

    return this;

  }

});

