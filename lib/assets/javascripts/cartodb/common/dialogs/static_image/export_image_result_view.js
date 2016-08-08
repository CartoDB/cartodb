var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../views/base_dialog/view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');
var moment = require('moment');

module.exports = BaseDialog.extend({

  events: BaseDialog.extendEvents({
    'click .js-input': '_onInputClick',
    'click .js-open-image': 'close'
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
    this.vis = this.options.vis;
    this.user = this.options.user;
    this.column = this.options.column;
    this.avmm = this.options.avmm;

    this.viewTemplate = ['common/dialogs/static_image/',
                         this.avmm ? 'export_to_avmm_view' : 'export_image_result_view']
                        .join('');

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
  },

  loadURL: function(url) {
    this._showResult({ displayedLink: url, filename: url, content: url, type: 'url' });
  },

  _generateImageFilename: function() {
    var filename = this.vis.get('name');
    return filename.replace(/ /g, '_').toLowerCase();
  },

  generateImage: function(url) {
    var callback = function(url) {
      var filename = this._generateImageFilename();
      this._showResult({
        content: url,
        type: 'url',
        displayedLink: filename + '.' + this.options.format,
        filename: filename,
        title: this.vis.get('name')
      });
    };

    if (this.avmm && cdb.config.get('static_image_upload_endpoint')) {
      callback = this._exportImage;
    }

    this._loadMapImage(url, callback.bind(this));
  },

  _showResult: function(options) {
    this._panes.addTab('result',
      ViewFactory.createByTemplate(this.viewTemplate, {
        column: this.column,
        response: options
      })
    );
    this._panes.active('result');

    this.trigger('finish', this);

    /*
     * The following is a bit of a hack that "clicks" on the link to cause the
     * browser to "download" the base64 data URI.
     *
     * Also considered was setting window.location and using window.open,
     * which resulted in the web page being replaced with the image,
     * not a downloaded file.
     */
    if (!this.avmm) {
      document.getElementById('download_link').click();
      this.close();
    } else {
      ZeroClipboard.setMoviePath(cdb.config.get('assets_url') + "/flash/ZeroClipboard.swf");
      this.clip = new ZeroClipboard.Client();
      this.clip.glue(this.$('button.avmm-copy-id').get(0));
      this.clip.setText(this.$('.avmm-id').text().trim());
      this.clip.addEventListener('onComplete', this._onCopy.bind(this));
    }
  },

  _onCopy: function(client, text) {
    this.$("button.avmm-copy-id span").text("Copied!");
    setTimeout((function() {
      this.$("button.avmm-copy-id span").text("Copy");
    }).bind(this), 2000)
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
      self._mergeAnnotations(mapImage, callback);
    };
    mapImage.src = url;
  },

  _exportImage: function(base64Image) {
    var self = this;
    var vis = this.options.vis;
    // in case a image uploading endpoint is set post the image url there
    // and show the html payload to the user
    $.ajax({
      type: 'POST',
      url: cdb.config.get('static_image_upload_endpoint'),
      data: {
        base64image: base64Image,
        name: vis.get('name'),
        visualization_uuid: vis.get('id'),
        description: vis.get('description')
      },
      success: function(content) {
        self._showResult({ content: content, type: 'html' });
      },
      error: function(error) {
        cdb.editor.ViewFactory.createDialogByTemplate('common/templates/fail', { msg: error.errors })
        .render().appendToBody();
      }
    });
  },

  _mergeAnnotations: function(mapImage, callback) {
    var x = this.options.x;
    var y = this.options.y;
    var width = this.options.width;
    var height = this.options.height;
    var format = this.options.format;

    if (format === 'jpg') {
      format = 'jpeg';
    }

    var imageProxyURL = cdb.config.get('url_prefix') + '/api/v1/image_proxy';

    html2canvas($('.cartodb-map')[0], {
      allowTaint: false, // don't allow non cors images taint the canvas
      taintTest: true,
      // useCORS: true,
      proxy: {
        url: imageProxyURL,
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
        doc.find('.cartodb-map > div:not(.annotation, .text, .image, .ExportImageView)').remove();
        doc.find('.ExportImageView').addClass('is-exportable');
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
        callback(finalCanvas.toDataURL('image/' + format));
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
