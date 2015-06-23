/**
 *  Generate export image
 *
 *  new cdb.admin.ExportImageDialog({
 *    vis: visualization_model
 *  })
 *
 */

cdb.admin.ExportImageDialog = cdb.admin.BaseDialog.extend({

  events: {
    'click .ok': '_ok'
  },

  initialize: function() {

    _.bindAll(this, "_onImageCallback", "_keydown", "_onDrag", "_onResize", "_updateHelpers");

    $(document).bind('keydown', this._keydown);

    this.bind("clean", this._reClean);

    this.map = this.options.map;

    // Extend options
    _.extend(this.options, {
      disabled: false,
      clean_on_hide: true,
      top: 60,
      left: 60,
      width: this.options.width - 90,
      height: this.options.height - 130,
      template_name: 'table/views/export_image_dialog',
      modal_class: 'static_image_dialog'
    });

    this.model = new cdb.core.Model({ x: this.options.left, y: this.options.top, width: this.options.width, height: this.options.height });
    this.model.bind("change", this._onChangeDimensions, this);

    this.constructor.__super__.initialize.apply(this);

  },

  render: function() {

    this.template_base = cdb.templates.getTemplate(this.options.template_name);

    this.$el.append(this.template_base( _.extend( this.options )));

    this.$(".CanvasExport").resizable({
      resize: this._onResize,
      container: this.options.mapView.$el,
      handles: "n, e, s, w, ne, se, sw, nw"
    });

    this.$(".CanvasExport").draggableOverlay({
      drag: this._onDrag,
      container: this.options.mapView.$el,
      stickiness: 10
    });

    this._hideOverlays();

    var y = this.options.top;
    var x = this.options.left;
    var width  = this.options.width;
    var height = this.options.height;


    this.$(".CanvasExport").css({ 
      top: y, 
      left: x, 
      width: width,
      height: height
    });

    this._updateHelpers(x, y, width, height);

    return this;
  },

  _showOverlays: function() {
    $(".cartodb-searchbox").show();
    $(".cartodb-share").show();
    $(".cartodb-logo").show();
    $(".map-options").show();
  },

  _hideOverlays: function() {
    $(".cartodb-searchbox").hide();
    $(".cartodb-share").hide();
    $(".cartodb-logo").hide();
    $(".map-options").hide();
  },

  _updateHelpers: function(x, y, width, height) {
    var canvasWidth  = this.options.mapView.$el.width();
    var canvasHeight = this.options.mapView.$el.height();
    this.$(".HelperNorth").css({ top: 0, width: x + width + 1, height: y + 1});
    this.$(".HelperWest").css({ left: 0, top: y + 1, width: x + 1, height: height});
    this.$(".HelperSouth").css({ top: y + height + 1, left: 0, width: canvasWidth, height: canvasHeight - height + y });
    this.$(".HelperEast").css({ left: x + width + 1, top: 0, width: canvasWidth - width, height: y + height + 1});
  },

  _onChangeDimensions: function() {
    var width = this.model.get("width");
    var height = this.model.get("height");
    var x = this.model.get("x");
    var y = this.model.get("y");

    this._updateHelpers(x, y, width, height);

    this.$el.find(".js-width").text(width);
    this.$el.find(".js-height").text(height);
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

  _ok: function(e) {

    this.killEvent(e);

    if (this.options.disabled) return;

    this.options.disabled = true;

    this.user = this.options.user;
    this.url  = this.options.vizjson;

    // calcs div center
    var x = this.model.get("x") + this.model.get("width") / 2;
    var y = this.model.get("y") + this.model.get("height") / 2;

    var center = this.options.mapView.pixelToLatLon([x, y]);

    var width = this.model.get("width");
    var height = this.model.get("height")

    cdb.Image(this.url, { https: this._isHTTPS() })
    .size(width, height)
    .center([center.lat, center.lng])
    .zoom(this.map.get('zoom')).getUrl(this._onImageCallback);
  },

  _isHTTPS: function() {
    return location.protocol.indexOf("https") === 0;
  },

  _onImageCallback: function(error, url) {
    var self = this;

    if (cdb.config.get('static_image_upload_endpoint')) {

      this.options.disabled = false;

      if (error && error.errors) {
        this._showError(error.errors[0]);
      } else {
        // load first the map image and then merge with the overlays rendered frontend side
        var mapImage = new Image();
        mapImage.crossOrigin = "Anonymous";
        mapImage.onload = function() {
          self.mergeAnnotations(mapImage, function(url) {
            self.exportImage(url);
          });
        }
        mapImage.src = url;
      }
    } else {
      this.trigger("finish", { response: url, type: "url" }, this);
      this._cancel();
    }

  },

  exportImage: function(base64Image) {
    var self = this;
    // in case a image uploading endpoint is set post the image url there
    // and show the html payload to the user
    $.ajax({
      type: "POST",
      url: cdb.config.get('static_image_upload_endpoint'),
      data: { base64image: base64Image },
      success: function(html) {
        self.trigger("finish", { response: html, type: "html" }, this);
        self._cancel();
      },
      error: function() {
        // TODO: add error
        self.$('.content').html("there was an error")
      }
    });
    // window.open(base64Image, '_blank');
  },

  mergeAnnotations: function(mapImage, callback) {

    var x      = this.model.get("x");
    var y      = this.model.get("y");
    var width  = this.model.get("width");
    var height = this.model.get("height")

    html2canvas($('.cartodb-map')[0], {
      allowTaint: true,
      useCORS: true,
      background: undefined, // for transparent
      // this function is called from html2canvas before the screenshot is taken
      // first parameter is a clone of the current DOM
      onclone: function(clonedDom) {
        var doc = $(clonedDom);
        // remove all the elements but annontations
        // if other elements are present it's likely you get a tainted canvas because
        // images not loaded with cors enabled
        doc.find('.cartodb-map > div:not(.annotation').remove()
        // default background color for leaflet is gray, set to transparent so the image
        // can be rendered on top of map image
        doc.find('.cartodb-map').css('background-color', 'transparent');
        return true;
      },
      onrendered: function(overlaysCanvas) {
        var finalCanvas = document.createElement('canvas');
        finalCanvas.width  = width;
        finalCanvas.height = height;
        var ctx = finalCanvas.getContext('2d');
        // map image alread has the final image size so render from the top,left
        ctx.drawImage(mapImage, 0, 0);
        // overlay canvas renders the full map size so crop it
        ctx.drawImage(overlaysCanvas, x, y, width, height, 0, 0, width, height);
        callback(finalCanvas.toDataURL());
      }
    });
  },

  _showError: function(message) {

    this.$el.find(".js-error-message").html(message);

    this.$("section.modal:eq(0)")
    .animate({
      top:0,
      opacity: 0
    }, 300, function() {
      $(this).slideUp(300);
    });

    this.$(".modal.confirmation")
    .css({
      top: '50%',
      marginTop: this.$(".modal.confirmation").height() / 2,
      display: 'block',
      opacity: 0
    })
    .delay(200)
    .animate({
      marginTop: -( this.$(".modal.confirmation").height() / 2 ),
      opacity: 1
    }, 300);
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
