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

  render: function() {

    this.$el.append(this.template(this.model.attributes));

    if (this.model.get("display")) this.show();

    this.$el.css({ left: this.model.get("x"), bottom: this.model.get("y") });

    return this;

  }

});

