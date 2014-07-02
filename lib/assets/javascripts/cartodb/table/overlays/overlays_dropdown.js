
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

    // Is open flag
    this.isOpen = false;

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
    cdb.god.trigger("closeDialogs");

  },

  _addImageOverlay: function() {

    var width  = 400;
    var height = 300;

    var defaultStyle = {
      "z-index": "1000",
      "box-color": "#000000",
      "box-opacity": .7,
      "box-width": 300
    };

    var defaultOptions = {
      url: "https://d13yacurqjgara.cloudfront.net/users/7184/screenshots/1590514/screen.gif",
      rendered_text: "<img src='https://d13yacurqjgara.cloudfront.net/users/7184/screenshots/1590514/screen.gif' />"
    };

    var model = new cdb.admin.models.Overlay({
      type: "image",
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

  _addZoomInfoOverlay: function() {

    var width  = 200;
    var height = 30;

    var model = new cdb.admin.models.Overlay({
      type: "zoom_info",
        x: 10,
        y: 90,
        display: true
    });

    this._addOverlay(model);

  },

  _addLayerOverlay: function() {

    var width  = 200;
    var height = 30;

    var model = new cdb.admin.models.Overlay({
      type: "layer_selector",
        x: 10,
        y: 200,
        display: true
    });

    this._addOverlay(model);

  },

  _addLoaderOverlay: function() {

    var width  = 200;
    var height = 30;

    var model = new cdb.admin.models.Overlay({
      type: "loader",
        x: 10,
        y: 200,
        display: true
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
      "font-size":        "20",
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
      type: "text",
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

    this._addButton("Add text item",   this._addTextOverlay);
    this._addButton("Add image item",  this._addImageOverlay);
    //this._addButton("Add layer overlay", this._addLayerOverlay);
    //this._addButton("Add loader overlay", this._addLoaderOverlay);
    //this._addButton("Add zoom info overlay", this._addZoomInfoOverlay);

    return this;
  }
});

