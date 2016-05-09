cdb.admin.OverlaysDropdownItem = cdb.core.View.extend({

  tagName: "li",

  events: {
    "click a": "_onClick"
  },

  initialize: function() {

    this.template   = this.getTemplate(this.options.template_name);
    this.collection = this.options.collection;

    this.model = new cdb.core.Model(); 
    this.model.on("change:active", this._onChangeActive, this);

    this.model.set("active", this.options.active);

  },

  _onClick: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.trigger("click", this)

  },

  _onChangeActive: function() {

    if (this.model.get("active")) this.$el.addClass("active");
    else this.$el.removeClass("active");
 
  },

  render: function() {

    this.$el.append(this.template(this.options));

    return this;

  }

});

cdb.admin.OverlaysDropdown = cdb.ui.common.Dropdown.extend({

  className: 'dropdown widgets_dropdown',

  defaults: {
    speedOut: 100,
    speedIn: 100
  },

  placeholders: {
    public_default_image: "overlay_placeholder_cartofante.png",
    default_image: "overlay_placeholder.png"
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

    this.vis     = this.options.vis;
    this.canvas  = this.options.canvas;
    this.mapView = this.options.mapView;

    // Bind to target
    $(this.options.target).bind({ "click": this._handleClick});

    // Bind ESC key
    $(document).bind('keydown', this._onKeyDown);

    // flags
    this.isOpen    = false;
  },


  _isDesktop: function() {

    return this.canvas.get("mode") === "desktop";

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
      top: 40,
      left: 0
    })
    .addClass(
      // Add vertical and horizontal position class
      (this.options.vertical_position === "up" ? "vertical_top" : "vertical_bottom" )
      + " " +
        (this.options.horizontal_position === "right" ? "horizontal_right" : "horizontal_left" )
      + " " +
        // Add tick class
        "border tick_" + this.options.tick
    );

    // Show it
    this.show();
    this._recalcHeight();

    // Dropdown open
    this.isOpen = true;
    
    this.trigger("onOverlayDropdownOpen", this);

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
      marginTop: self.options.vertical_position === "down" ? "10px" : "-10px",
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

  _getDefaultImageURL: function() {
    return cdb.config.get("assets_url") + "/images/layout/" +  this.placeholders.default_image;
  },

  _getPublicDefaultImageURL: function() {
    return cdb.config.get("assets_url") + "/images/layout/" +  this.placeholders.public_default_image;
  },

  _addImageOverlay: function() {

    var width  = 400;
    var height = 200;

    var defaultStyle = {
      "z-index": 4,
      "box-color": "#000000",
      "box-opacity": .7,
      "box-width": 200
    };

    var default_image_url = this._getDefaultImageURL();

    var defaultOptions = {
      has_default_image: true,
      url: this._getDefaultImageURL(),
      rendered_text: "<img src='" + default_image_url + "' />",
      default_image_url: default_image_url,
      public_default_image_url: this._getPublicDefaultImageURL() 
    };

    var x = $(".cartodb-map").width()/2  - width/2;
    var y = $(".cartodb-map").height()/2 - height/2;

    if (this.canvas.get("mode") === "mobile") {
      x = 33;
      y = 120;
    }

    var model = new cdb.admin.models.Overlay({
      type: "image",
      display: true,
      width: width,
      height: height,
      device: this.canvas.get("mode"),
      x: x,
      y: y,
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
      "z-index":          4,
      "color":            "#ffffff",
      "text-align":       "left",
      "font-size":        this._isDesktop() ? "40" : "17",
      "font-family-name": "Helvetica",
      "box-padding":      10,
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
      device: this.canvas.get("mode"),
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
      "z-index":          4,
      "color":            "#ffffff",
      "text-align":       "left",
      "font-size":        this._isDesktop() ? "20" : "12",
      "font-family-name": "Helvetica",
      "box-padding":      10,
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
      device: this.canvas.get("mode"),
      x: $(".cartodb-map").width()/2  - width/2,
      y: $(".cartodb-map").height()/2 - height/2,
      extra: defaultOptions,
      style: defaultStyle
    });

    this._addOverlay(model);

  },

  _addAnnotationOverlay: function() {

    var defaultStyle = {
      "z-index":          4,
      "color":            "#ffffff",
      "text-align":       "left",
      "font-size":        this._isDesktop() ? "13" : "12",
      "font-family-name": "Helvetica",
      "box-color":        "#000000",
      "box-opacity":      .7,
      "box-padding":      5,
      "line-color":       "#000000",
      "line-width":       this._isDesktop() ? 50 : 25,
      "min-zoom": this.mapView.map.get("minZoom"),
      "max-zoom": this.mapView.map.get("maxZoom")
    };

    var defaultOptions = {
      latlng: this.mapView.map.get("center"),
      text: this._isDesktop() ? "I'm an **annotation overlay**" : "Hi! I'm here",
      rendered_text: this._isDesktop() ? "I'm an <strong>annotation overlay</strong>" : "Hi! I'm here"
    };

    var model = new cdb.admin.models.Overlay({
      type: "annotation",
      display: true,
      device: this.canvas.get("mode"),
      extra: defaultOptions,
      style: defaultStyle
    });

    this._addOverlay(model);

  },

  _addButton: function(title, callback) {

    var button = new cdb.admin.OverlaysDropdownItem({

      text: title,
      template_name: "table/views/overlays/add_widget_dropdown_item",

    }).on("click", callback, this);

    this.$el.find("ul").append(button.render().$el);

  },

  /*
   * Renders the dropdown
   */
  render: function() {

    this.clearSubViews();

    this.$el.html(this.template_base(this.options));

    this._addButton("Add title item", this._addTitleOverlay);
    this._addButton("Add text item",  this._addTextOverlay);
    this._addButton("Add annotation item",  this._addAnnotationOverlay);

    return this;
  }

});
