cdb.admin.WidgetDropdown = cdb.ui.common.Dropdown.extend({

  className: 'dropdown',

  events: {
    //"click"       : "killEvent"
  },

  initialize: function() {

    _.bindAll(this, "open", "hide", "_handleClick");

    // Extend options
    //_.defaults(this.options, this.defaults);

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    // Bind to target
    $(this.options.target).bind({"click": this._handleClick});

    // Bind ESC key
    //$(document).bind('keydown', this._keydown);

    // Is open flag
    this.isOpen = false;

  },

  show: function() {

    var dfd = $.Deferred();
    var self = this;

    //sometimes this dialog is child of a node that is removed
    //for that reason we link again DOM events just in case
    this.delegateEvents();
    this.$el
    .css({
      marginTop: self.options.vertical_position == "down" ? "-10px" : "10px",
      opacity:0,
      display:"block"
    })
    .animate({
      margin: "0",
      opacity: 1
    }, {
      "duration": this.options.speedIn,
      "complete": function(){
        dfd.resolve();
      }
    });

    this.trigger("onDropdownShown", this.el);

    return dfd.promise();
  },

  open: function(ev, target) {

    // Target
    var $target = target && $(target) || this.options.target;

    this.options.target = $target;

    this.$el.css({
      top: this.options.vertical_offset,
      right: this.options.target.offset().right + this.options.horizontal_offset
    })
    .addClass(
      // Add vertical and horizontal position class
      (this.options.vertical_position == "up" ? "vertical_top" : "vertical_bottom" )
      + " " +
        (this.options.horizontal_position == "right" ? "horizontal_right" : "horizontal_left" )
      + " " +
        // Add tick class
        "border tick_" + this.options.tick
    )

    // Show it
    this.show();
    this._recalcHeight();

    // Dropdown open
    this.isOpen = true;
  },

  hide: function(done) {

    if (!this.isOpen) {
      done && done();
      return;
    }

    var self    = this;
    this.isOpen = false;

    this.$el.animate({
      marginTop: self.options.vertical_position == "down" ? "10px" : "-10px",
      opacity: 0
    }, this.options.speedOut, function(){

      // And hide it
      self.$el.hide();

    });

    this.trigger("onDropdownHidden",this.el);
  },

  _recalcHeight: function() {

    var $ul  = this.$el.find("ul.special");

    // Resets heights
    $ul.height("auto");
    $ul.parent().height("auto");

    var special_height  = $ul.height();
    var dropdown_height = $ul.parent().height();

    // Sets heights
    if (special_height < dropdown_height) $ul.css("height", dropdown_height);
    else $ul.parent().height(special_height);

  },

  /*
   * Renders the basemap dropdown
   */
  render: function() {

    this.clearSubViews();

    var self = this;

    self.$el.html(self.template_base(self.options));

    return this;
  }
});

cdb.admin.TextWidget = cdb.core.View.extend({

  className: "text widget",

  events: {
    "click .edit":      "_onClickEdit",
    "click .close":      "_close",
    "click .content":    "_click",
    "dblclick .content": "_dblClick",
    //"mousemove .text":   "_test",
    "keyup .text":       "_onKeyUp"
  },

  _onClick: function(e) {

    //e.preventDefault();
    //e.stopPropagation();
    //console.log('.');
    //
    this.dropdown.hide();
  
  },

  initialize: function() {

    _.bindAll(this, "_click", "_close", "_onClickEdit", "_dblClick", "_onChangeMode");

    this.template = this.getTemplate('table/views/widgets/text');

    this.model    = this.options.model;

    this.model.bind('change:text',  this._onUpdateText,  this);
    this.model.bind('change:style', this._onChangeStyle, this);
    this.model.bind('change:mode',  this._onChangeMode,  this);

  },

  hide: function(callback) {

    this.$el
    .removeClass('animated bounceIn')
    .addClass('animated bounceOut');

    callback && callback();

  },

  // Model events

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

    this.$el.find(".content div.text").text(text);

  },

  _onChangeStyle: function() {

    var style = this.model.get("style");
    this.$el.find(".content div").css(style);

  },

  // Element events 

  _onKeyUp: function(e) {

    var value = this.$el.find(".text").text()

    this.model.set({ text: value}, { silent: true });

    if (value == "") this._close();

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

    this.trigger("click", this);

  },

  _onChangeMode: function() {

    var mode = this.model.get("mode");

    if (mode == "editing") {

      //this.$el.addClass("editable");
      this.$el.find(".text").attr("contenteditable", true);

      //$(this.$el).draggable("disable");

    } else {

      //this.$el.removeClass("editable");
      this.$el.find(".text").attr("contenteditable", false);

    }

  },

  _onClickEdit: function(e) {

    //$("body").append(this.dropdown.render().el);
    //cdb.god.bind("closeDialogs", this.dropdown.hide, this.dropdown);
    //this.dropdown.open(e, e.target);

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
    if (text) this.$text.text(text)

    var style = this.model.get("style");
    if (style) this.$text.css(style);

    this.dropdown = new cdb.admin.WidgetDropdown({
      target: this.$el.find(".edit"),
      model: this.model,
      tick: "left",
      horizontal_position: "left",
      horizontal_offset: 20,
      vertical_offset: 34,
      template_base: 'table/views/widgets/properties_dropdown'
    });

    this.$el.append(this.dropdown.render().el);
    cdb.god.bind("closeDialogs", this.dropdown.hide, this.dropdown);


    return this;

  }

});

