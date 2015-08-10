var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');

module.exports = BaseDialog.extend({

  events: BaseDialog.extendEvents({
    'click .js-input': '_onInputClick'
  }),

  initialize: function() {
    this.elder('initialize');
    this._initViews();
    this._initBinds();
  },

  render_content: function() {
    return this._panes.getActivePane().render().el;
  },

  _initViews: function() {

    this.table = this.options.table;
    this.column = this.options.column;

    this._panes = new cdb.ui.common.TabPane({
      el: this.el
    });

    this.addView(this._panes);

    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Generating image',
        quote: randomQuote()
      })
    );
    this._panes.addTab('fail',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: 'Could not generate image'
      })
    );

    this._panes.active('loading');

    var self = this;
    var url = this.options.url;

    if (cdb.config.get('static_image_upload_endpoint')) {
      this._loadMapImage(url, function(url) {
        self._exportImage(url);
      });
    } else {
      this._loadMapImage(url, function(url) {
        self._showResult({ content: url, type: "url" });
      });
    }

  },

  _showResult: function(options) {
    this._panes.addTab('result',
      ViewFactory.createByTemplate('common/dialogs/static_image/export_image_result_view', {
        column: this.column,
        response: options
      })
    );
    this._panes.active('result');
  },

  _initBinds: function() {
    this._panes.bind('tabEnabled', this.render, this);
  },

  /* Load first the map image and then merge with the overlays rendered frontend side */
  _loadMapImage: function(url, callback) {
    var self = this;
    var mapImage = new Image();
    mapImage.crossOrigin = 'Anonymous';
    mapImage.onload = function() {
      self.mergeAnnotations(mapImage, function(url) {
        callback && callback(url);
      });
    };
    mapImage.src = url;
  },

  _exportImage: function(base64Image) {
    var self = this;
    // in case a image uploading endpoint is set post the image url there
    // and show the html payload to the user
    $.ajax({
      type: "POST",
      url: cdb.config.get('static_image_upload_endpoint'),
      data: { base64image: base64Image },
      success: function(content) {
        self._showResult({ content: content, type: "html" });
      },
      error: function(error) {
        cdb.editor.ViewFactory.createDialogByTemplate('common/templates/fail', { msg: error.errors })
        .render().appendToBody();
      }
    });
  },

  mergeAnnotations: function(mapImage, callback) {
    var x      = this.options.x;
    var y      = this.options.y;
    var width  = this.options.width;
    var height = this.options.height;

    html2canvas($('.cartodb-map')[0], {
      allowTaint: false, // don't allow non cors images taint the canvas
      taintTest: true,
      // useCORS: true,
      proxy: {
        url: '/api/v1/image_proxy',
        api_key: this.options.user.get('api_key')
      },
      background: undefined, // for transparent
      // this function is called from html2canvas before the screenshot is taken
      // first parameter is a clone of the current DOM
      onclone: function(clonedDom) {
        var doc = $(clonedDom);
        // remove all the elements but annontations, text and image
        // if other elements are present it's likely you get a tainted canvas because
        // images not loaded with cors enabled
        doc.find('.cartodb-map > div:not(.annotation, .text, .image)').remove();
        // default background color for leaflet is gray, set to transparent so the image
        // can be rendered on top of map image
        doc.find('.cartodb-map').css('background-color', 'transparent');
        return true;
      },
      onrendered: function(overlaysCanvas) {
        var finalCanvas = document.createElement('canvas');
        finalCanvas.width = width;
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

  ok: function() {
    this.close();
  },

  _onInputClick: function(e) {
    $(e.target).focus().select();
  }

});
