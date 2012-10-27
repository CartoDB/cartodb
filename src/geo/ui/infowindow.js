/** Usage:
*
* Add Infowindow model:
*
* var infowindowModel = new cdb.geo.ui.InfowindowModel({
*   template_name: 'templates/map/infowindow',
*   latlng: [72, -45],
*   offset: [100, 10]
* });
*
* var infowindow = new cdb.geo.ui.Infowindow({
*   model: infowindowModel,
*   mapView: mapView
* });
*
* Show the infowindow:
* infowindow.showInfowindow();
*
*/

cdb.geo.ui.InfowindowModel = Backbone.Model.extend({

  defaults: {
    template_name: 'geo/infowindow',
    latlng: [0, 0],
    offset: [28, 0], // offset of the tip calculated from the bottom left corner
    autoPan: true,
    content: "",
    visibility: false,
    fields: null // contains the fields displayed in the infowindow
  },

  clearFields: function() {
    this.set({fields: []});
  },

  _cloneFields: function() {
    return _(this.get('fields')).map(function(v) {
      return _.clone(v);
    });
  },

  _setFields: function(f) {
    f.sort(function(a, b) { return a.position -  b.position; });
    this.set({'fields': f});
  },

  addField: function(fieldName, at) {
    if(!this.containsField(fieldName)) {
      var fields = this._cloneFields() || [];
      at = at === undefined ? fields.length: at;
      fields.push({name: fieldName, title: true, position: at});
      //sort fields
      this._setFields(fields);
    }
    return this;
  },

  getFieldProperty: function(fieldName, k) {
    if(this.containsField(fieldName)) {
      var fields = this.get('fields') || [];
      var idx = _.indexOf(_(fields).pluck('name'), fieldName);
      return fields[idx][k];
    }
    return null;
  },

  setFieldProperty: function(fieldName, k, v) {
    if(this.containsField(fieldName)) {
      var fields = this._cloneFields() || [];
      var idx = _.indexOf(_(fields).pluck('name'), fieldName);
      fields[idx][k] = v;
      this._setFields(fields);
    }
    return this;
  },

  getFieldPos: function(fieldName) {
    var p = this.getFieldProperty(fieldName, 'position');
    if(p == undefined) {
      return Number.MAX_VALUE;
    }
    return p;
  },

  containsField: function(fieldName) {
    var fields = this.get('fields') || [];
    return _.contains(_(fields).pluck('name'), fieldName);
  },

  removeField: function(fieldName) {
    if(this.containsField(fieldName)) {
      var fields = this._cloneFields() || [];
      var idx = _.indexOf(_(fields).pluck('name'), fieldName);
      if(idx >= 0) {
        fields.splice(idx, 1);
      }
      this._setFields(fields);
    }
    return this;
  }

});

cdb.geo.ui.Infowindow = cdb.core.View.extend({
  className: "infowindow",

  events: {
    "click .close":   "_closeInfowindow",
    "mousedown":      "_stopPropagation",
    "mouseup":        "_stopPropagation",
    "mousewheel":     "_stopPropagation",
    "DOMMouseScroll": "_stopPropagation",
    "dbclick":        "_stopPropagation",
    "click":          "_stopPropagation"
  },

  initialize: function(){

    _.bindAll(this, "render", "setLatLng", "changeTemplate", "_updatePosition", "_update", "toggle", "show", "hide");

    this.mapView = this.options.mapView;

    this.template = this.options.template ? this.options.template : cdb.templates.getTemplate(this.model.get("template_name"));

    this.add_related_model(this.model);

    this.model.bind('change:content',       this.render, this);
    this.model.bind('change:template_name', this.changeTemplate, this);
    this.model.bind('change:latlng',        this._update, this);
    this.model.bind('change:visibility',    this.toggle, this);

    this.mapView.map.bind('change',         this._updatePosition, this);
    //this.map.on('viewreset', this._updatePosition, this);
    this.mapView.bind('drag',               this._updatePosition, this);

    var that = this;
    this.mapView.bind('zoomstart', function(){
      that.hide(true);
    });
    this.mapView.bind('zoomend', function() {
      that.show(true);
    });

    this.render();
    this.$el.hide();

  },

  changeTemplate: function(template_name) {
    this.template = cdb.templates.getTemplate(this.model.get("template_name"));
    this.render();
  },

  render: function() {
    if(this.template) {
      this.$el.html($(this.template(_.clone(this.model.attributes))));
      //this._update();
    }
    return this;
  },

  toggle: function() {
    this.model.get("visibility") ? this.show() : this.hide();
  },

  _stopPropagation: function(ev) {
    ev.stopPropagation();
  },

  _closeInfowindow: function(ev) {
    if (ev) {
      ev.preventDefault()
      ev.stopPropagation();
    }
      
    this.model.set("visibility",false);
  },

  /**
  * Set the correct position for the popup
  * @params {latlng} A new Leaflet LatLng object
  */
  setLatLng: function (latlng) {
    this.model.set("latlng", latlng);
    return this;
  },

  showInfowindow: function() {
    this.model.set("visibility", true);
  },

  show: function (no_pan) {
    var that = this;

    if (this.model.get("visibility")) {
      that.$el.css({ left: -5000 });
      that._update(no_pan);
    }
  },

  isHidden: function () {
    return !this.model.get("visibility");
  },

  hide: function (force) {
    if (force || !this.model.get("visibility")) this._animateOut();
  },

  _update: function (no_pan) {
    
    if(!this.isHidden()) {
      var delay = 0;
      
      if (!no_pan) {
        var delay = this._adjustPan();
      }

      this._updatePosition();
      this._animateIn(delay);
    }
  },

  _animateIn: function(delay) {
    this.$el.css({
      'marginBottom':'-10px',
      'display':'block',
      opacity:0
    });

    this.$el
      .delay(delay)
      .animate({
        opacity: 1,
        marginBottom: 0
      },300);
  },

  _animateOut: function() {
    var that = this;

    this.$el.animate({
      marginBottom: "-10px",
      opacity:      "0",
      display:      "block"
    }, 180, function() {
      that.$el.css({display: "none"});
    });
  },

  /**
  * Update the position (private)
  */
  _updatePosition: function () {

    var
    offset          = this.model.get("offset")
    pos             = this.mapView.latLonToPixel(this.model.get("latlng")),
    x               = this.$el.position().left,
    y               = this.$el.position().top,
    containerHeight = this.$el.outerHeight(true),
    containerWidth  = this.$el.width(),
    left            = pos.x - offset[0],
    size            = this.mapView.getSize(),
    bottom          = -1*(pos.y - offset[1] - size.y);

    this.$el.css({ bottom: bottom, left: left });
  },

  _adjustPan: function (callback) {

    var offset = this.model.get("offset");

    if (!this.model.get("autoPan")) { return; }

    var
      x               = this.$el.position().left,
      y               = this.$el.position().top,
      containerHeight = 280, //this.$el.outerHeight(true),
      containerWidth  = this.$el.width(),
      pos             = this.mapView.latLonToPixel(this.model.get("latlng")),
      adjustOffset    = {x: 0, y: 0};
      size            = this.mapView.getSize()
      wait_callback   = 0;

    if (pos.x - offset[0] < 0) {
      adjustOffset.x = pos.x - offset[0] - 10;
    }

    if (pos.x - offset[0] + containerWidth > size.x) {
      adjustOffset.x = pos.x + containerWidth - size.x - offset[0] + 10;
    }

    if (pos.y - containerHeight < 0) {
      adjustOffset.y = pos.y - containerHeight - 10;
    }

    if (pos.y - containerHeight > size.y) {
      adjustOffset.y = pos.y + containerHeight - size.y;
    }

    if (adjustOffset.x || adjustOffset.y) {
      this.mapView.panBy(adjustOffset);
      wait_callback = 300;
    }

    return wait_callback;
  }

});
