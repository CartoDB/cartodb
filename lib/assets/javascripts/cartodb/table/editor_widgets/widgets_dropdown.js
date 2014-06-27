
cdb.admin.WidgetsDropdownItem = cdb.core.View.extend({

  tagName: "li",

  events: {
    "click a": "_onClick"
  },

  initialize: function() {

    this.template = this.getTemplate('table/views/widgets/add_widget_dropdown_item');

    this.collection = this.options.collection;

  },

  _onClick: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.trigger("click", this)

  },

  render: function() {

    this.$el.append(this.template(this.options));

    return this;

  }

});

cdb.admin.WidgetsDropdown = cdb.ui.common.Dropdown.extend({

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

  _addWidget: function(model) {

    this.collection.add(model);
    cdb.god.trigger("closeDialogs");

  },

  _addImageWidget: function() {

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

    var model = new cdb.admin.models.Widget({
      type: "image",
      width: width, 
      height: height,
      device: this.vis.get("canvas_mode"),
      x: $(".cartodb-map").width()/2  - width/2,
      y: $(".cartodb-map").height()/2 - height/2,
      extra: defaultOptions,
      style: defaultStyle
    });

    this._addWidget(model);

  },

  _addZoomInfoWidget: function() {

    var width  = 200;
    var height = 30;

    var model = new cdb.admin.models.Widget({
      type: "zoom_info",
        x: 10,
        y: 90,
        display: true
    });

    this._addWidget(model);

  },

  _addLoaderWidget: function() {

    var width  = 200;
    var height = 30;

    var model = new cdb.admin.models.Widget({
      type: "loader",
        x: 10,
        y: 200,
        display: true
    });

    this._addWidget(model);

  },

  _addTextWidget: function() {

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
      text: "I'm a **text widget**",
      rendered_text: "I'm a <strong>text widget</strong>" // Rendered version of the markdown text
    };

    var model = new cdb.admin.models.Widget({
      type: "text",
      width: width,
      height: height,
      device: this.vis.get("canvas_mode"),
      x: $(".cartodb-map").width()/2  - width/2,
      y: $(".cartodb-map").height()/2 - height/2,
      extra: defaultOptions,
      style: defaultStyle
    });

    this._addWidget(model);

  },

  _addButton: function(title, callback) {

    var button = new cdb.admin.WidgetsDropdownItem({
      text: title,
    }).on("click", callback, this);

    this.$el.find("ul").append(button.render().$el);

  },

  /*
   * Renders the dropdown
   */
  render: function() {

    this.clearSubViews();

    this.$el.html(this.template_base(this.options));

    this._addButton("Add text item",   this._addTextWidget);
    this._addButton("Add image item",  this._addImageWidget);
    //this._addButton("Add loader widget", this._addLoaderWidget);
    //this._addButton("Add zoom info widget", this._addZoomInfoWidget);

    return this;
  }
});

