
cdb.geo.ui.InfowindowModel = Backbone.Model.extend({
  defaults: {
    template_name: 'geo/infowindow',
    latlng: [0, 0],
    offset: [58, 2],
    autoPan: true,
    content: "",
    visibility: false
  }

});

cdb.geo.ui.Infowindow = cdb.core.View.extend({
  className: "infowindow",

  initialize: function(){
    var self = this;

    _.bindAll(this, "render", "setLatLng", "changeTemplate", "_updatePosition", "_update", "toggle", "show", "hide");

    this.mapView = this.options.mapView;
    this.map     = this.mapView.map_leaflet;

    this.template = this.options.template ? this.options.template : cdb.templates.getTemplate(this.model.get("template_name"));

    this.add_related_model(this.model);

    this.model.bind('change:content', this.render, this);
    this.model.bind('change:template_name', this.changeTemplate, this);
    this.model.bind('change:latlng', this.render, this);
    this.model.bind('change:visibility', this.toggle, this);

    this.mapView.map.bind('change', this._updatePosition, this);
    this.map.on('viewreset', this._updatePosition, this);
    this.map.on('drag', this._updatePosition, this);
    this.map.on('zoomstart', this.hide, this);
    this.map.on('zoomend', this.show, this);

    this.map.on('click', function() {
      self.model.set("visibility", false);
    });

    this.render();
    this.$el.hide();

  },

  changeTemplate: function(template_name) {

    this.template = cdb.templates.getTemplate(this.model.get("template_name"));
    this.render();

  },

  render: function() {
    this.$el.html($(this.template(this.model.toJSON())));
    this._update();

    return this;
  },

  toggle: function() {
    this.model.get("visibility") ? this.show() : this.hide();
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

  show: function () {
    if (this.model.get("visibility")) this.$el.fadeIn(250);
  },

  hide: function (force) {
    if (force || !this.model.get("visibility")) this.$el.fadeOut(250);
  },

  _update: function () {
    this._adjustPan();
    this._updatePosition();
  },
  /**
  * Update the position (private)
  */
  _updatePosition: function () {

    var
    pos  = this.mapView.latLonToPixel(this.model.get("latlng")),
    top  = pos.y - this.$el.outerHeight(true) + 12,
    left = pos.x - this.$el.width() / 2;

    this.$el.css({ top: top, left: left });
  },

  _adjustPan: function () {

    if (!this.model.get("autoPan")) { return; }

    var
    map             = this.map,
    x               = this.$el.position().left,
    y               = this.$el.position().top,
    containerHeight = this.$el.outerHeight(true),
    containerWidth  = this.$el.width(),
    layerPos        = new L.Point(x, y),
    pos             = this.mapView.latLonToPixel(this.model.get("latlng")),
    adjustOffset    = new L.Point(0, 0),
    size            = map.getSize();

    if (pos.x < containerWidth) {
      adjustOffset.x = pos.x - containerWidth;
    }

    if (pos.x + containerWidth > size.x) {
      adjustOffset.x = pos.x + containerWidth - size.x;
    }

    if (pos.y <= containerHeight) {
      adjustOffset.y = pos.y - containerHeight;
    }

    if (pos.y - containerHeight > size.y) {
      adjustOffset.y = pos.y + containerHeight - size.y;
    }

    if (adjustOffset.x || adjustOffset.y) {
      map.panBy(adjustOffset);
    }
  },

});
