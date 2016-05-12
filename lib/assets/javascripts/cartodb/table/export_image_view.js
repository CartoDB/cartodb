/**
 *  Generate export image view
 *
 */

cdb.admin.ExportImageView = cdb.core.View.extend({

  className: "ExportImageView",

  events: {
    'click .js-ok': '_ok',
    'click .js-format': '_openFormatDropdow',
    'dblclick .js-format': 'killEvent',
    'click .js-advanced': '_openAdvancedExport',
    'click .js-close': '_close',
    'dblclick input': 'killEvent',
    'click input': 'killEvent',
    'keyup input': '_onKeyUp'
  },

  _MIN_WIDTH: 520,
  _DEFAULT_MARGIN: 45,
  _DEFAULT_MIN_WIDTH: 480,

  defaults: {
    clean_on_hide: true,
    top: 60,
    left: 60,
    horizontalMargin: 90,
    verticalMargin: 130,
    title: "",
    description: "",
    show_title: false,
    show_description: false,
    template_name: 'table/views/export_image_view',
    modal_class: 'static_image_dialog'
  },

  initialize: function() {

    _.bindAll(this, "_onResizeWindow", "_onChangeDimensions", "_onImageCallback", "_onAdvancedImageCallback", "_keydown", "_onDrag", "_onResize", "_updateHelpers");

    $(document).bind('keydown', this._keydown);
    $(window).on('resize', this._onResizeWindow);

    this.bind("clean", this._reClean);

    this.map = this.options.map;
    this.vis = this.options.vis;
    this.mapOverlays = this.options.overlays;
    this.header = this.mapOverlays.getHeaderOverlays();

    this.vis.bind("change:name", this._onChangeVisName, this);
    this.vis.bind("change:description", this._onChangeVisDescription, this);

    var $legend = $('.cartodb-map .cartodb-legend-stack').clone();
    // $legend.remove('.reset') should work but doesn't?
    $legend.find('.reset').remove();

    _.extend(this.options, this.defaults, {
      attribution: this.vis.map.get("attribution"),
      legend: $legend.html(),
      legend_style: $legend.attr('style') || null
    });

    if (this.header) {
      var self = this;
      _.each(this.header, function(header) {
        _.extend(self.options, header.attributes);
        if (header.attributes && header.attributes.options && header.attributes.options.extra) {
          var extras = header.attributes.options.extra;
          if (extras.headerType == 'title') {
            self.options.title = extras.text;
            self.options.show_title = true;
          } else if (extras.headerType == 'description') {
            self.options.description = extras.text;
            self.options.show_description = true;
          }
        }
      });
      _.extend(this.options, this.header.attributes);
    }

    this.width  = this.options.width  - this.options.horizontalMargin;
    this.height = this.options.height - this.options.verticalMargin;

    this.model = new cdb.core.Model({
      format: 'png',
      x: this.options.left,
      y: this.options.top,
      width: this.width,
      height: this.height
    });

    this.model.bind("change:format", this._onChangeFormat, this);
    this.model.bind("change:x change:y change:width change:height", this._onChangeDimensions, this);
    this.constructor.__super__.initialize.apply(this);
  },

  render: function() {
    this.template_base = cdb.templates.getTemplate(this.options.template_name);

    this.$el.append(this.template_base(_.extend({}, this.options, { width: this.width, height: this.height })));

    this._setupCanvas();
    this._hideOverlays();
    this._updateHelpers(this.options.left, this.options.top, this.width, this.height);

    return this;
  },

  _getMarkdown: function(content) {
    content = cdb.Utils.stripHTML(content);
    content = markdown.toHTML(content);
    content = cdb.Utils.stripHTML(content, '<a><i><em><strong><b><u><s>');
    content = content.replace(/&#39;/g, "'"); // replaces single quote

    return cdb.core.sanitize.html(content);
  },

  _onResizeWindow: function(e) {
    if (e.target === window) {
      this._onChangeDimensions();
    }
  },

  _onChangeVisName: function() {
    this.$(".js-title").text(this.vis.get("name"));
  },

  _onChangeVisDescription: function() {
    this.$(".js-description").html(this._getMarkdown(this.vis.get("description")));
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
    $(".map-options").show();
    $(".leaflet-control-attribution").show();
    $(".cartodb-map .cartodb-legend-stack").show();

    if (this._legendsHidden) {
      this.options.vis.map.set("legends", true);
      this._legendsHidden = false;
    }

    this.mapOverlays.overlays.each(function(overlay) {
      var type = overlay.get("type");
      if (type !== "zoom" && type !== "loader" && type !== "annotation" && type !== "text" && type !== "image") {
        overlay.set("display", true);
      }
    }, this);
  },

  _hideOverlays: function() {
    $(".map-options").hide();
    $(".leaflet-control-attribution").hide();
    $(".cartodb-map .cartodb-legend-stack").hide();

    if (this.options.vis.map.get("legends")) {
      this.options.vis.map.set("legends", false);
      this._legendsHidden = true;
    }

    this.mapOverlays.overlays.each(function(overlay) {
      var type = overlay.get("type");
      if (type !== "zoom" && type !== "loader" && type !== "annotation" && type !== "text" && type !== "image") {
        overlay.set("display", false);
      }
    }, this);
  },

  _updateHelpers: function(x, y, width, height) {
    var canvasWidth  = this.options.mapView.$el.width();
    var canvasHeight = this.options.mapView.$el.height();

    this.$(".CanvasExport").css({ height: height, width: width });

    this.$el.toggleClass("is-small", width <= this._MIN_WIDTH);

    if (x >= 0 && y >= 0) {
      this.$(".js-helper-north").css({ top: 0, width: x + width + 1, height: y + 1});
      this.$(".js-helper-west").css({ left: 0, top: y + 1, width: x + 1, height: height});
      this.$(".js-helper-south").css({ top: y + height + 1, left: 0, width: canvasWidth, height: canvasHeight - height + y });
      this.$(".js-helper-east").css({ left: x + width + 1, top: 0, width: canvasWidth - width, height: y + height + 1});
    }

    var isTop = y < this._DEFAULT_MARGIN;
    var isBottom = y + height + this._DEFAULT_MARGIN > canvasHeight;

    this.$(".CanvasExport").toggleClass('is-small', isTop && width < this._DEFAULT_MIN_WIDTH);
    this.$(".CanvasExport").toggleClass('is-top', isTop);
    this.$(".CanvasExport").toggleClass('is-bottom', isBottom);
  },

  _onChangeFormat: function() {
    this.$(".js-formatName").text('.' + this.model.get("format"));
  },

  _onChangeDimensions: function() {
    var width  = this.model.get("width");
    var height = this.model.get("height");

    var x = this.model.get("x");
    var y = this.model.get("y");

    if (this.dropdown) {
      this.dropdown.hide();
    }

    this._updateHelpers(x, y, width, height);

    this.$(".js-width").val(width);
    this.$(".js-height").val(height);
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

    var view = new cdb.editor.ExportImageResultView({
      vis: this.vis,
      clean_on_hide: true,
      enter_to_confirm: false,
      user: this.options.user,
      format: this.model.get('format'),
      x: this.model.get('x'),
      y: this.model.get('y'),
      width: this.model.get('width'),
      height: this.model.get('height')
    });

    view.bind("finish", this._cancel, this);

    view.appendToBody();
    view.generateImage(url);
  },

  _close: function(e) {
    this.killEvent(e);
    this._cancel();
  },

  _openFormatDropdow: function(e) {
    this.killEvent(e);

    this.dropdown = new cdb.admin.ExportImageFormatsDropdown({
      target: this.$(".js-format"),
      model: this.model,
      speedIn: 150,
      speedOut: 150,
      vertical_position: 'up',
      horizontal_offset: 3,
      tick: 'center'
    });

    this.addView(this.dropdown);
    this.dropdown.render();
    this.dropdown.open(e);
  },

  _openAdvancedExport: function(e) {

    var width  = this.model.get("width");
    var height = this.model.get("height");

    var view = new cdb.editor.AdvancedExportView({
      mapView: this.options.mapView,
      clean_on_hide: true,
      enter_to_confirm: false,
      user: this.options.user,
      format: this.model.get('format'),
      x: this.$(".CanvasExport").position().left,
      y: this.$(".CanvasExport").position().top,
      width: width,
      height: height
    });

    view.appendToBody();
    view.bind("generate_image", this._onAdvancedImageGeneration, this);
    this._close();
  },

  _onAdvancedImageGeneration: function(options) {
    this.url  = this.options.vizjson;

    var width  = options.width;
    var height = options.height;
    var format = options.format;
    var bounds = [];

    bounds.push([options.bounds[0][1], options.bounds[0][0]]);
    bounds.push([options.bounds[1][1], options.bounds[1][0]]);

    cdb.Image(this.url, { https: this._isHTTPS() })
    .size(width, height)
    .bbox(bounds)
    .format(format)
    .getUrl(this._onAdvancedImageCallback);
  },

  _onAdvancedImageCallback: function(error, url) {
    if (error && error.errors) {
      cdb.editor.ViewFactory.createDialogByTemplate('common/templates/fail', { msg: error.errors })
      .render().appendToBody();
      return;
    }

    var view = new cdb.editor.ExportImageResultView({
      vis: this.vis,
      clean_on_hide: true,
      enter_to_confirm: false
    });

    view.bind("finish", this._cancel, this);

    view.appendToBody();
    view.loadURL(url);
  },

  _ok: function(e) {
    this.killEvent(e);

    this.url  = this.options.vizjson;

    var center = this._calcCenter();

    var width  = this.model.get("width");
    var height = this.model.get("height");

    cdb.Image(this.url, { https: this._isHTTPS() })
    .format(this.model.get('format'))
    .size(width, height)
    .center([center.lat, center.lng])
    .zoom(this.map.get('zoom'))
    .getUrl(this._onImageCallback);
  },

  _onKeyUp: function(e) {
    this.killEvent(e);

    var property = "width";
    var value = +$(e.target).val();

    if ($(e.target).hasClass("js-height")) {
      property = "height";
    }

    if (e.keyCode === $.ui.keyCode.UP) {
      value++;
    } else if (e.keyCode === $.ui.keyCode.DOWN) {
      value--;
    }

    if (property === 'height') {
      var top = this.$(".CanvasExport").position().top;
      var canvasHeight = this.options.mapView.$el.height();

      if (top + value > canvasHeight) {
        value = canvasHeight - top;
        this.$(".js-height").val(value);
      }
    } else {
      var left = this.$(".CanvasExport").position().left;
      var canvasWidth  = this.options.mapView.$el.width();

      if (left + value > canvasWidth) {
        value = canvasWidth - left;
        this.$(".js-width").val(value);
      }
    }

    if (_.isNumber(value)) {
      this.model.set(property, value);
    }
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

  clean: function() {
    $(document).unbind('keydown', this._keydown);
    $(window).off("resize", this._onResizeWindow);
    this.elder('clean');
  },

  open: function() {
    this.$el.show();
  }
});
