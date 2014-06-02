cdb.admin.TextWidget = cdb.core.View.extend({

  className: "text widget",

  events: {
    //"mouseup":           "_onMouseUp",
    "mousedown":         "_onMouseDown",
    "mouseenter .text":  "_onMouseEnter",
    "mouseleave .text":  "_onMouseLeave",
    //"mouseenter":      "_onMouseEnter",
    //"mouseleave":      "_onMouseLeaveText",
    "click .edit":     "_onClickEdit",
    "click .close":      "_close",
    //"click .content":    "_click",
    "dblclick .content": "_dblClick",
    //"mousemove .text": "_test",
    "keyup .text":       "_onKeyUp",
    //"click .text":       "_onClickText",
    "paste .text":       "_onPaste"
  },

  _onPaste: function(e) {

    var self = this;

    setTimeout(function() {

      var text = cdb.Utils.stripHTML(self.model.get("text"));
      self.model.set("text", text)

    }, 200);

  },

  _onMouseUp: function(e) {

    console.log(e)
    e.preventDefault();
    e.stopPropagation();

    if (e && e.target.hasAttribute("href")) {
      return;
    }

    var x = this.model.get("x");
    var y = this.model.get("y");

    var oldX = this.$el.position().left;
    var oldY = this.$el.position().top;

    if (oldX === x && y === oldY) {

      this.dropdown.hide();
      this.model.set("mode", "editable");

    } else {

      //this.model.set("mode", "");
      this.model.set("x", this.$el.position().left);
      this.model.set("y", this.$el.position().top);

    }

  },

  _onMouseDown: function() {

    //if (this.timeout) clearTimeout(this.timeout);

    var self = this;

    //setTimeout(function() {

      //if (self.timeout && self.dragging) clearTimeout(self.timeout);

      //this.dragging = true;

    //}, 200);

  },

  _onMouseEnterText: function() {

  },

  _onMouseLeaveText: function() {

    console.log('leave2')

  },

  _onMouseEnter: function() {

    if (this.model.get("mode") == "editable") {
      if (this.timeout) clearTimeout(this.timeout);
    }

  },

  _onMouseLeave: function() {

    var self = this;

    if (this.model.get("mode") == "editable") {

      this.timeout = setTimeout(function() {

        self.model.set("mode", "");

      }, 250);
    }

  },

  initialize: function() {

    _.bindAll(this, "_click", "_close", "_onClickEdit", "_dblClick", "_onChangeMode");

    this.template = this.getTemplate('table/views/widgets/text');

    this.model      = this.options.model;

    this.model.set({ mode: "" }, { silent: true })

    this.model.bind('change:text',  this._onUpdateText,  this);
    this.model.bind('change:style', this._applyStyle, this);
    this.model.bind('change:mode',  this._onChangeMode,  this);

  },

  hide: function(callback) {

    var self = this;

    this.$el
    .removeClass('animated bounceIn')
    .addClass('animated bounceOut');

    callback && callback();

    // Give it some time to complete the animation
    setTimeout(function() {
      self.clean();
    }, 550);

  },

  _close: function(e) {

    e && e.preventDefault();
    e && e.stopPropagation();

    var self = this;

    this.dropdown.hide();
    this.dropdown.clean();

    this.hide(function() {
      self.trigger("remove", self);
    });

  },

  _onUpdateText: function() {

    var text = this.model.get("text");

    this.$el.find(".content div.text").html(text);

  },

  _applyStyle: function() {

    var style      = this.model.get("style");

    var boxColor   = style["box-color"];
    var boxOpacity = style["box-opacity"];
    var boxWidth   = style["box-width"];

    console.log(style["font-size"]);

    this.$el.find(".content .text").css(style);
    this.$el.find(".content .text").css("font-size", style["font-size"] + "px");

    var rgbaCol = 'rgba(' + parseInt(boxColor.slice(-6,-4),16)
    + ',' + parseInt(boxColor.slice(-4,-2),16)
    + ',' + parseInt(boxColor.slice(-2),16)
    +', ' + boxOpacity + ' )';


    this.$el.css("background-color", rgbaCol);

  },

  // Element events 

  _onKeyUp: function(e) {

    var self = this;

    var temp      = "";
    var domString = "";

    if (this.timeout)      clearTimeout(this.timeout);
    if (this.keyUpTimeout) clearTimeout(this.keyUpTimeout);

    var value = this.$el.find(".text").html();

    if (value == "") {

      this.keyUpTimeout = setTimeout(function() {

        self.model.set({ text: "" }, { silent: true });
        self._close();

      }, 600);

    } else {

      var text = cdb.Utils.stripHTML(value);

      this.model.set({ text: text }, { silent: true });

    }

  },

  _dblClick: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.$el.find(".text").selectText();

  },

  _click: function(e) {

    e.preventDefault();
    e.stopPropagation();

    var isLink = e.target.hasAttribute("href");

    if (!isLink) {
      cdb.god.trigger("closeDialogs");
    }

  },

  _onChangeMode: function() {

    var mode = this.model.get("mode");

    if (mode == "editable") {

      this._enableEditingMode();

    } else {

      this.$el.removeClass("editable");
      this.$el.find(".text").attr("contenteditable", false);

      this.$el.attr("disabled", false);

    }

  },

  _enableEditingMode: function() {

    this.$el.attr("disabled", true);
    this.$el.addClass("editable");
    this.$el.find(".text").attr("contenteditable", true);

  },

  _onClickText: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.dropdown.hide();

    this.model.set("mode", "editable");

  },

  _onClickEdit: function(e) {

    var mode = this.model.get("mode");

    if (mode === 'editable') {
      this.model.set("mode", "");
    } else {
      this.model.set("mode", "editable");
    }

  },

  render: function() {

    var self = this;

    this.$el.offset({ 
      left: this.model.get("x"),
      top:  this.model.get("y")
    });


    this.$el.append(this.template());

    this.$text = this.$el.find(".content .text");

    var text = this.model.get("text");
    if (text) this.$text.html(text);

    var style = this.model.get("style");
    this._applyStyle();

    this.dropdown = new cdb.admin.WidgetDropdown({
      target: this.$el.find(".edit"),
      model: this.model,
      tick: "left",
      horizontal_position: "left",
      horizontal_offset: 20,
      vertical_offset: 25,
      template_base: 'table/views/widgets/properties_dropdown'
    });

    this.$el.append(this.dropdown.render().el);
    cdb.god.bind("closeDialogs", this.dropdown.hide, this.dropdown);

    return this;

  }

});

