cdb.admin.TextWidget = cdb.core.View.extend({

  className: "text widget",

  events: {

    "click .content":    "_click",
    "dblclick .content": "_dblClick",
    "mousemove .text":   "_test",
    "keyup .text":       "_onKeyUp"

  },

  _test: function(e) {

    //e.preventDefault();
    //e.stopPropagation();
    //console.log('.');
  
  },

  initialize: function() {

    _.bindAll(this, "_click", "_dblClick", "_onChangeMode");

    this.template = this.getTemplate('table/views/widgets/text');

    this.model    = new cdb.core.Model( _.extend(this.options, { mode: "" }) );

    this.model.bind('change:text',  this._onUpdateText,  this);
    this.model.bind('change:style', this._onChangeStyle, this);
    this.model.bind('change:mode',  this._onChangeMode,  this);

  },

  hide: function() {

    this.$el.removeClass('animated bounceIn');
    this.$el.addClass('animated bounceOut');

  },

  // Model events

  _onUpdateText: function() {

    var text = this.model.get("text");

    this.$el.find(".content div").text(text);

  },

  _onChangeStyle: function() {

    var style = this.model.get("style");
    this.$el.find(".content div").css(style);

  },

  // Element events 

  _onKeyUp: function(e) {

    var value = this.$el.find(".text").text()

    this.model.set({ text: value}, { silent: true });

    if (value == "") this.hide();

  },

  _dblClick: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.$el.find(".text").selectText();
    //$(this.$el).draggable("disable");

  },

  _click: function(e) {

    e.preventDefault();
    e.stopPropagation();

    if (this.model.get("mode") === "editing") {
      this.model.set("mode", "");
    } else {
      this.model.set("mode", "editing");
    }

  },

  _onChangeMode: function() {

    var mode = this.model.get("mode");

    if (mode == "editing") {

      this.$el.addClass("editable");
      this.$el.find(".text").attr("contenteditable", true);

      //$(this.$el).draggable("disable");

    } else {

      this.$el.removeClass("editable");
      this.$el.find(".text").attr("contenteditable", false);

    }

  },

  render: function() {

    var self = this;

    this.$el.offset({ 
      left: this.model.get("x"),
      top:  this.model.get("y")
    });

    // Random animation
    setTimeout(function() {
      self.$el.show();
      self.$el.addClass('animated bounceIn');
    }, 100 + Math.random() * 900)

    this.$el.append(this.template());

    this.$text = this.$el.find(".content .text");

    var text = this.model.get("text");
    if (text) this.$text.text(text)

    var style = this.model.get("style");
    if (style) this.$text.css(style);

    return this;

  }

});

