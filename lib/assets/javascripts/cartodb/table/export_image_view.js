/**
 *  Generate export image view
 *
 */

cdb.admin.ExportImageView = cdb.core.View.extend({

  events: {
    'click .js-ok': '_ok',
    'click .js-close': '_close'
  },

  defaults: {
    clean_on_hide: true,
    top: 60,
    left: 60,
    horizontalMargin: 90,
    verticalMargin: 130,
    template_name: 'table/views/export_image_view',
    modal_class: 'static_image_dialog'
  },

  initialize: function() {

    _.bindAll(this, "_onImageCallback", "_keydown", "_onDrag", "_onResize", "_updateHelpers");

    $(document).bind('keydown', this._keydown);

    this.bind("clean", this._reClean);

    this.map = this.options.map;

    // Extend options
    _.extend(this.options, this.defaults);

    this.width  = this.options.width  - this.options.horizontalMargin;
    this.height = this.options.height - this.options.verticalMargin;

    this.model = new cdb.core.Model({
      x: this.options.left,
      y: this.options.top,
      width: this.width,
      height: this.height
    });

    this.model.bind("change", this._onChangeDimensions, this);
    this.constructor.__super__.initialize.apply(this);
  },

  render: function() {
    this.template_base = cdb.templates.getTemplate(this.options.template_name);

    this.$el.append(this.template_base( _.extend( this.options )));

    this._setupCanvas();
    this._setupHeader();
    this._hideOverlays();
    this._updateHelpers(this.options.left, this.options.top, this.width, this.height);

    return this;
  },

  _setupHeader: function() {
    this.$(".js-header").css({ width: this.width, marginLeft: -this.width/2 + 20 });
  },

  _setupCanvas: function() {
    this.$(".CanvasExport").resizable({
      resize: this._onResize,
      containment: this.options.mapView.$el,
      handles: "n, e, s, w, ne, se, sw, nw"
    });

    this.$(".CanvasExport").draggableOverlay({
      drag: this._onDrag,
      container: this.options.mapView.$el
    });

    this.$(".CanvasExport").css({
      top: this.options.top,
      left: this.options.left,
      width: this.width,
      height: this.height
    });
  },

  _showOverlays: function() {
    this.options.mapView.$(".cartodb-fullscreen").show();
    this.options.mapView.$(".cartodb-searchbox").show();
    this.options.mapView.$(".cartodb-share").show();
    this.options.mapView.$(".cartodb-logo").show();
    $(".map-options").show();
  },

  _hideOverlays: function() {
    this.options.mapView.$(".cartodb-fullscreen").hide();
    this.options.mapView.$(".cartodb-searchbox").hide();
    this.options.mapView.$(".cartodb-share").hide();
    this.options.mapView.$(".cartodb-logo").hide();
    $(".map-options").hide();
  },

  _updateHelpers: function(x, y, width, height) {
    var canvasWidth  = this.options.mapView.$el.width();
    var canvasHeight = this.options.mapView.$el.height();

    if (x >= 0 && y >= 0) {
      this.$(".js-helper-north").css({ top: 0, width: x + width + 1, height: y + 1});
      this.$(".js-helper-west").css({ left: 0, top: y + 1, width: x + 1, height: height});
      this.$(".js-helper-south").css({ top: y + height + 1, left: 0, width: canvasWidth, height: canvasHeight - height + y });
      this.$(".js-helper-east").css({ left: x + width + 1, top: 0, width: canvasWidth - width, height: y + height + 1});
    }
  },

  _onChangeDimensions: function() {
    var width  = this.model.get("width");
    var height = this.model.get("height");

    var x = this.model.get("x");
    var y = this.model.get("y");

    this._updateHelpers(x, y, width, height);

    this.$(".js-width").text(width);
    this.$(".js-height").text(height);
  },

  _onDrag: function() {
    var width  = this.$(".CanvasExport").width();
    var height = this.$(".CanvasExport").height();
    var x      = this.$(".CanvasExport").position().left;
    var y      = this.$(".CanvasExport").position().top;
    this.model.set({ x: x, y: y, width: width, height: height });
  },

  _onResize: function(e, ui) {
    var width  = ui.helper.width();
    var height = ui.helper.height();
    var x      = ui.helper.position().left;
    var y      = ui.helper.position().top;
    this.model.set({ x: x, y: y, width: width, height: height });
  },

  _keydown: function(e) {
    if (e.keyCode === 27) this._cancel();
  },

  _calcCenter: function() {
    var x = this.model.get("x") + this.model.get("width") / 2;
    var y = this.model.get("y") + this.model.get("height") / 2;

    return this.options.mapView.pixelToLatLon([x, y]);
  },

  _isHTTPS: function() {
    return location.protocol.indexOf("https") === 0;
  },

  _onImageCallback: function(error, url) {
    if (error && error.errors) {
      cdb.editor.ViewFactory.createDialogByTemplate('common/templates/fail', { msg: error.errors })
      .render().appendToBody();
      return;
    }

    this._cancel();

    var view = new cdb.editor.ExportImageResultView({
      clean_on_hide: true,
      enter_to_confirm: false,
      url: url,
      user: this.options.user,
      x: this.model.get("x"),
      y: this.model.get("y"),
      width: this.model.get("width"),
      height: this.model.get("height")
    });

    view.appendToBody();
  },

  _close: function(e) {
    this.killEvent(e);
    this._cancel();
  },

  _ok: function(e) {
    this.killEvent(e);

    this.url  = this.options.vizjson;

    var center = this._calcCenter();

    var width  = this.model.get("width");
    var height = this.model.get("height");

    cdb.Image(this.url, { https: this._isHTTPS() })
    .size(width, height)
    .center([center.lat, center.lng])
    .zoom(this.map.get('zoom'))
    .getUrl(this._onImageCallback);
  },

  _cancel: function(e) {
    this.killEvent(e);
    this._showOverlays();
    this.hide();
  },

  hide: function() {
    this.trigger("was_removed", this);
    this.$el.hide();
    this.clean();
  },

  open: function() {
    this.$el.show();
  }
});
