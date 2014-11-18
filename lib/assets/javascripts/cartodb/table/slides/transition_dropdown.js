cdb.admin.TransitionDropdown = cdb.ui.common.Dropdown.extend({

  className: 'dropdown slide_transition_dropdown',

  defaults: {
    speedOut: 100,
    speedIn: 100
  },

  events: {
    "click" : "killEvent"
  },

  initialize: function() {

    _.bindAll(this, "open", "hide", "_handleClick", "_onKeyDown");

    // Extend options
    _.defaults(this.options, this.defaults);

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    this.vis = this.options.vis;

    // Bind to target
    $(this.options.target).bind({ "click": this._handleClick});

    // Bind ESC key
    $(document).bind('keydown', this._onKeyDown);

    // flags
    this.isOpen    = false;
  },


  _isDesktop: function() {

    return this.vis.get("canvas_mode") == "desktop";

  },

  /* Check if the dropdown is visible to hiding with the click on the target */
  _handleClick: function(ev) {
    if (ev) {
      ev.preventDefault();
    }

    // If visible
    if (this.isOpen){
      this.hide();
    } else{
      this.open();
    }
  },

  show: function() {

    var dfd = $.Deferred();
    var self = this;

    //sometimes this dialog is child of a node that is removed
    //for that reason we link again DOM events just in case
    this.delegateEvents();
    this.$el
    .css({
      marginTop: "-10px",
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

    cdb.god.trigger("closeDialogs");

    // Target
    var $target = target && $(target) || this.options.target;

    this.options.target = $target;

    this.$el.css({
      top: this.options.vertical_offset,
      left: 0
    })
    .addClass(
      // Add vertical and horizontal position class
      (this.options.vertical_position == "up" ? "vertical_top" : "vertical_bottom" )
      + " " +
        (this.options.horizontal_position == "right" ? "horizontal_right" : "horizontal_left" )
      + " " +
        // Add tick class
        "border tick_" + this.options.tick
    );

    // Show it
    this.show();
    this._recalcHeight();

    // Dropdown open
    this.isOpen = true;
  },

  _onKeyDown: function(e) {

    if (e.keyCode === 27) {
      this.hide();
    }

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

  _addOverlay: function(model) {
    this.collection.add(model);
    model.save();
    cdb.god.trigger("closeDialogs");
  },

  _addLogoOverlay: function() {

    var model = new cdb.admin.models.Overlay({
      type: "logo",
      display: true
    });

    this._addOverlay(model);
  },

  _addCodeOverlay: function() {

    var width  = 200;
    var height = 30;

    var defaultStyle = {
      "z-index":          "1000",
      "color":            "#FFF",
      "text-align":       "left",
      "font-size":        this._isDesktop() ? "20" : "12",
      "font-family-name": "Helvetica",
      "box-color":        "#000000",
      "box-opacity":      .7,
      "box-width":        300
    };

    var defaultOptions = {
      landscapeDirection: "left",
      portraitDirection:  "top",
      text: "I'm a **text overlay**",
      rendered_text: "I'm a <strong>text overlay</strong>" // Rendered version of the markdown text
    };

    var model = new cdb.admin.models.Overlay({
      type: "code",
      display: true,
      width: width,
      height: height,
      device: this.vis.get("canvas_mode"),
      x: $(".cartodb-map").width()/2  - width/2,
      y: $(".cartodb-map").height()/2 - height/2,
      extra: defaultOptions,
      style: defaultStyle
    });

    this._addOverlay(model);

  },

  _addImageOverlay: function() {

    var width  = 400;
    var height = 200;

    var public_default_image_url = "http://cartodb.s3.amazonaws.com/static/overlay_placeholder_cartofante.png";
    var default_image_url        = "http://cartodb.s3.amazonaws.com/static/overlay_placeholder.png";

    var defaultStyle = {
      "z-index": "1000",
      "box-color": "#000000",
      "box-opacity": .7,
      "box-width": 200
    };

    var defaultOptions = {
      has_default_image: true,
      url: default_image_url,
      rendered_text: "<img src='" + default_image_url + "' />",
      default_image_url: default_image_url,
      public_default_image_url: public_default_image_url
    };

    var model = new cdb.admin.models.Overlay({
      type: "image",
      display: true,
      width: width,
      height: height,
      device: this.vis.get("canvas_mode"),
      x: $(".cartodb-map").width()/2  - width/2,
      y: $(".cartodb-map").height()/2 - height/2,
      extra: defaultOptions,
      style: defaultStyle
    });

    this._addOverlay(model);

  },

  _addTitleOverlay: function() {

    var content = this.vis.get("name");
    var width   = 350;
    var height  = 30;

    var defaultStyle = {
      "z-index":          "1000",
      "color":            "#FFF",
      "text-align":       "left",
      "font-size":        this._isDesktop() ? "40" : "17",
      "font-family-name": "Helvetica",
      "box-color":        "#000000",
      "box-opacity":      .7,
      "box-width":        this._isDesktop ? 500 : 200
    };

    var defaultOptions = {
      landscapeDirection: "left",
      pTop: 0,
      pLeft: 0,
      portraitDirection:  "top",
      text: "**" + content + "**",
      rendered_text: "<strong>" + content + "</strong>"
    };

    var model = new cdb.admin.models.Overlay({
      type: "text",
      display: true,
      width: width,
      height: height,
      device: this.vis.get("canvas_mode"),
      x: this._isDesktop() ? 66 : 20,
      y: this._isDesktop() ? $(".header").outerHeight()  + 15 : $(".header").outerHeight()  + 15,
      extra: defaultOptions,
      style: defaultStyle
    });

    this._addOverlay(model);

  },

  _addTextOverlay: function() {

    var width  = 200;
    var height = 30;

    var defaultStyle = {
      "z-index":          "1000",
      "color":            "#FFF",
      "text-align":       "left",
      "font-size":        this._isDesktop() ? "20" : "12",
      "font-family-name": "Helvetica",
      "box-color":        "#000000",
      "box-opacity":      .7,
      "box-width":        300
    };

    var defaultOptions = {
      pLeft: "50",
      pTop: "50",
      landscapeDirection: "left",
      portraitDirection:  "top",
      text: "I'm a **text overlay**",
      rendered_text: "I'm a <strong>text overlay</strong>" // Rendered version of the markdown text
    };

    var model = new cdb.admin.models.Overlay({
      type: "text",
      display: true,
      width: width,
      height: height,
      device: this.vis.get("canvas_mode"),
      x: $(".cartodb-map").width()/2  - width/2,
      y: $(".cartodb-map").height()/2 - height/2,
      extra: defaultOptions,
      style: defaultStyle
    });

    this._addOverlay(model);

  },

  /*
   * Renders the dropdown
   */
  render: function() {

    this.clearSubViews();

    this.$el.html(this.template_base(this.options));

    var model  = new cdb.core.Model({
      value: 3
    });

    var number = new cdb.forms.SimpleNumber({ 
      model: model,
      max: 1,
      min: 0, 
      inc: 0.1
    });

    this.$el.find("li.seconds").append(number.render().$el);

    return this;
  }

});
