cdb.admin.overlays.Logo = cdb.admin.overlays.Text.extend({

  className: "cartodb-logo",

  template_name: 'table/views/overlays/logo',

  events: { },

  initialize: function() {

    //_.bindAll(this, "_close");

    this.template = this.getTemplate(this.template_name);

    this._setupModels();

  },

  _killEvent: function(e) {

    e && e.preventDefault();
    e && e.stopPropagation();

  },

  // Setup the internal and custom model
  _setupModels: function() {

    // Binding
    this.model.bind('change:display', this._onChangeDisplay, this);
    this.model.on("change:y",       this._onChangeY, this);
    this.model.on("change:x",       this._onChangeX, this);

    this.model.on("destroy", function() {
      this.$el.hide();
    }, this);

  },

  show: function(animated) {

    this.$el.show();

    if (true) this.$el.addClass('animated bounceIn');

  },

  hide: function(callback) {

    var self = this;

    this.$el
    .removeClass('animated bounceIn')
    .addClass('animated bounceOut');

    callback && callback();

  },

  _onChangeDisplay: function() {

    var display = this.model.get("display");

    if (display) {
      this.show();
    } else {
      this.$el.hide();
    }

  },

  _onChangeX: function() {

    var x = this.model.get("x");
    this.$el.animate({ left: x }, 150);

  },

  _onChangeY: function() {

    var y = this.model.get("y");
    this.$el.animate({ bottom: y }, 150);

  },

  render: function() {

    this.$el.append(this.template(this.model.attributes));

    if (this.model.get("display")) this.show();

    this.$el.css({ left: this.model.get("x"), bottom: this.model.get("y") });

    return this;

  }

});

