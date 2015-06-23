
/**
 * User options dropdown (extends Dropdown)
 *
 * It shows the content in a dropdown (or dropup) with a special effect.
 *
 * Usage example:
 *
 * var user_menu = new cdb.admin.DropdownBasemap({
 *
 * });
 *
 */

cdb.admin.DropdownBasemap = cdb.ui.common.Dropdown.extend({

  className: 'dropdown basemap',

  // TODO: remove gmaps code from here
  defaults: {
    speedIn:  50,
    speedOut: 50,
    basemaps_per_list: 8,
    available_basemaps: {}
  },

  events: {
    "click a.add" : "_openSelector",
    "click"       : "killEvent"
  },

  initialize: function() {
    _.bindAll(this, "add", "setActiveBaselayer", "open", "hide", "_handleClick", "_keydown");

    // Extend options
    _.defaults(this.options, this.defaults);

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    // Bind to target
    $(this.options.target).bind({"click": this._handleClick});

    // Bind ESC key
    $(document).bind('keydown', this._keydown);

    // Is open flag
    this.isOpen = false;

    this.baseLayers = this.options.baseLayers;
    this.user = this.options.user;

    this._setupBindings();

  },

  _setupBindings: function() {

    this._bindBaseLayers();
    this._bindMapView();

  },

  _bindBaseLayers: function() {

    if (this.baseLayers) {
      this.baseLayers.bind('reset', this.render, this);
      this.baseLayers.bind('add',   this.add,    this);
    }

  },

    // Bind any change of mapview to base chooser
  _bindMapView: function() {

    var self = this;

    this.model.layers.bind('change add reset',
    function(a) {
      self._checkPlainColor();
      self.setActiveBaselayer(a);
    });

  },

  /**
   *  Checks if new base layer loaded is a plain color type
   *  If so, it is applied to background map color view as the model
   */
  _checkPlainColor: function() {
    var baselayer = this.model.getBaseLayer();
    if (baselayer && baselayer.get('type') == "Plain") {
      if (baselayer.get('color')) {
        this.background_color.model = baselayer;
      } else {
        this.background_image.model = baselayer;
      }
    }
  },

  _toggleAddBaseLayer: function() {

    var
    $add = this.$el.find(".add_basemap"),
    $ul  = this.$el.find(".custom ul.yours");

    if ($ul.find("li").length <= this.defaults.basemaps_per_list) {
      $add.removeClass("hidden");
      $add.parent().append($add);
    } else {
      $add.addClass("hidden");
    }

  },

  // returns true if google maps is enabled if google maps library loaded
  googleMapsEnabled: function() {
    return typeof(google) !== 'undefined' && typeof(google.maps) !== 'undefined';
  },

  add: function(lyr) {

    //if (!lyr.get("urlTemplate")) return;

    var v;
    var type  = lyr.get("type") && lyr.get("type").toLowerCase();
    var proxy = lyr.get("proxy"); // If it comes from CartoDB proxy

    if (lyr.get('className') === 'wms' || proxy ) {
      v = new cdb.admin.BaseMapView({ model: lyr, map: this.model, className: "wms" });
    } else if (lyr.get('className') === 'googlemaps') {
      if (this.googleMapsEnabled()) {
        v = new cdb.admin.GMapsBaseView({
          model: lyr,
          map: this.model
        });
      } else {
        return;
      }
    } else {
       // this is a temporal fix, if google maps feature flag is enabled show only maps in group google maps
      if (this.user.featureEnabled('google_maps') && lyr.get('category') !== 'Google') {
          return;
      }
      v = new cdb.admin.BaseMapView({ model: lyr, map: this.model });
    }

    lyr.bind("destroy", this._toggleAddBaseLayer, this);

    this.addView(v);

    var name = v.model.get("name");

    if (!name) {
      name = "Custom basemap " + v.model.get("order");
    } else {
      name.replace(/_/g, "");
    }

    v.model.set("name", name);

    var $element = $(v.render().el);
    var baseType = v.model.get("base_type") || "default";

    baseType.toLowerCase();


    var template = cdb.templates.getTemplate('table/views/basemap/basemap_dropdown_cat');

    if (baseType) {
      var category = lyr.get("category");
      category = category || 'Others';
      var listClassName = '.custom ul.' + category.toLowerCase();
      var $ul = this.$(listClassName);
      if (!$ul.length) {
        $(template({
          category: category
        })).insertBefore(this.$('.fixed_basemaps'));
        $ul = this.$(listClassName);
      }
      $ul.append($element);
    }

    this._toggleAddBaseLayer();

  },

  _getCleanClassName: function(className) {

    if (!className) return false;

    return className
    .replace(/default /g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z_0-9 ]/g, "")
    .toLowerCase();

  },

  _updateTarget: function(subview) {

    var className = subview.model.get("className");
    var type      = subview.model.get("type");
    var color     = subview.model.get("color");
    var image     = subview.model.get("image");


    var kind      = (color ? 'color' : undefined ) || ( image ? 'pattern' : undefined ) || '';

    var className = this._getCleanClassName(className);
    if (className === 'googlemaps') {
      className = subview.model.get('base_type');
      // Adding the custom base name to set properly
      // the background image
      className += subview.model.get('base_name') ? ( '.' + subview.model.get('base_name') ) : '';
    }

    var $el = this.$el.find("a." + className);

    if (kind) {
      $el = this.$el.find("a." + className + '.' + kind);
    }

    this._setName($el);
    this._setThumbnail($el, color, image);

  },

  _setName: function($el) {

    var name = $el.attr("data-name");

    if (!name) name = "Change basemap";

    name = cdb.Utils.truncate(name, 40);

    this.options.target.find(".info .name").html(name);

  },

  _setThumbnail: function($el, color, image) {

    if (image) image = "url(" + image + ")" ;

    var $thumb = $el.find(".thumb");

    // Thanks Firefox
    var bkg   = image || $thumb.css("background-image");
    var size  = $thumb.css("background-size");
    var pos   = $thumb.css("background-position");

    if (!bkg || bkg === "none") {
      color = color || $thumb.css("background-color");
    } else {
      color = "#000";
    }

    this.options.target.find("> .thumb").css({
      "background-image": bkg,
      "background-position": pos,
      "background-size": size,
      "background-color": color
    });

  },

  _addBackgroundBasemap: function() {

    this.background_image = new cdb.admin.BackgroundMapImageView({ model: this.model.getBaseLayer(), map: this.model, user: this.options.user });
    this.addView(this.background_image);

    var $view = $(this.background_image.render().el);

    var $ul = this.$el.find('.custom ul.custom');
    $ul.append($view);

  },

  _addColorBasemap: function() {

    this.background_color = new cdb.admin.BackgroundMapColorView({ model: this.model.getBaseLayer(), map: this.model });
    this.addView(this.background_color);

    var $view = $(this.background_color.render().el);

    var $ul = this.$el.find('.custom ul.custom');
    $ul.append($view);

    this.background_color.delegateEvents();

  },

  _addAddBasemapLink: function() {
    var $a = $('<li class="add_basemap hidden"><a class="add small" href="#add_basemap"><div class="thumb"></div></a></li>');

    var $ul = this.$el.find('.custom ul.yours');
    $ul.append($a);

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
    this._toggleAddBaseLayer();

    return dfd.promise();
  },

  open: function(ev,target) {

    // Target
    var $target = target && $(target) || this.options.target;
    this.options.target = $target;

    var vertical_position = this.options.target.position().top + this.options.vertical_offset;
    var vertical_property = this.options.vertical_position == "up" ? "bottom" : "top";

    this.$el.css(vertical_property, vertical_position);

    this.$el.css({
      left: this.options.horizontal_offset
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

  _addBaseDefault: function() {
    this.baseLayers.each(this.add);
  },

  /**
   *  When a new base layer is activated,
   *  we apply the select to the correct base layer button
   */
  setActiveBaselayer: function(layer) {

    for (var sv in this._subviews) {

      var subview = this._subviews[sv];

      if (subview.model && this.model.getBaseLayer && this.model.getBaseLayer().isEqual(subview.model)) {
        // We have to CHANGE AND REMOVE this things, we can't
        // control the basemap selected in this way :(
        if (subview.model.get('type') != "Plain") {
          subview.selectButton();
        }
        this._updateTarget(subview);
        return;
      }
    }

  },

  /*
   * Creates a modal dialog to let the user create a new basemap
   */
  _openSelector: function(ev) {
    var self = this;
    ev.preventDefault();

    var layer_ids = _.map(self.$el.find(".others li a"), function(a) { return $(a).attr("class"); });
    var dialog = new cdb.admin.BaseMapAdder({
      map: this.model, // map
      baseLayers: this.baseLayers,
      layer_ids: layer_ids,
      ok: function(layer) {
        self.model.changeProvider('leaflet', layer.clone());
      }
    });

    var openOldDialog = function() {
      dialog.appendToBody().open({ center: true });
    };
    if (this.options.user.featureEnabled('new_modals')) {
      var view = new cdb.editor.AddCustomBasemapView({
        map: this.model,
        baseLayers: this.baseLayers,
        openOldDialog: openOldDialog, // just a fallback until all categories are implemented
        clean_on_hide: true,
        enter_to_confirm: true
      });
      view.appendToBody();
    } else {
      openOldDialog();
    }

    return false;
  },

  /*
   * Renders the basemap dropdown
   */
  render: function() {

    this.clearSubViews();

    this.$el.html(this.template_base(this.options));

    this._addBaseDefault();
    this._addColorBasemap();
    this._addBackgroundBasemap();
    this._addAddBasemapLink();

    return this;
  },

  clean: function() {
    $(document).unbind('keydown', this._keydown);
    cdb.ui.common.Dropdown.prototype.clean.call(this);
  }

});
