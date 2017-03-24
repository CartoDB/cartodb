var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var FooterView = require('./footer/footer-view');
var ExportImageFormView = require('./export-image-form-view.js');
var ExportImageFormModel = require('./export-image-form-model');
var ExportImageWidget = require('./export-image-widget');
var template = require('./export-image-pane.tpl');

var DEFAULT_EXPORT_FORMAT = 'png';
var DEFAULT_EXPORT_WIDTH = 300;
var DEFAULT_EXPORT_HEIGHT = 200;

var checkAndBuildOpts = require('../../helpers/required-opts');
var REQUIRED_OPTS = [
  'canvasClassName',
  'configModel',
  'stackLayoutModel',
  'userModel'
];

module.exports = CoreView.extend({
  className: 'Editor-content',

  events: {
    'click .js-back': '_goStepBack'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._canvasModel = new Backbone.Model();
    this._$map = $('.' + this._canvasClassName);

    var width = DEFAULT_EXPORT_WIDTH;
    var height = DEFAULT_EXPORT_HEIGHT;

    var x = Math.ceil(this._$map.width() / 2 - (width / 2));
    var y = Math.ceil(this._$map.height() / 2 - (height / 2));

    this._exportImageFormModel = new ExportImageFormModel({
      format: DEFAULT_EXPORT_FORMAT,
      x: x,
      y: y,
      width: width,
      height: height
    });
  },

  render: function () {
    this.clearSubViews();

    this.$el.append(
      template({
        title: _t('editor.maps.export-image.title')
      })
    );

    this._createWidget();
    this._createForm();
    this._createFooter();

    return this;
  },

  _createForm: function () {
    var exportImageFormView = new ExportImageFormView({
      formModel: this._exportImageFormModel,
      canvasModel: this._exportImageFormModel
    });

    this.$('.js-content').append(exportImageFormView.render().$el);
    this.addView(exportImageFormView);
  },

  _createFooter: function () {
    this._footerView = new FooterView({
      configModel: this._configModel,
      userModel: this._userModel
    });

    this.addView(this._footerView);
    this._footerView.bind('finish', this._exportImage, this);
    this.$('.js-footer').append(this._footerView.render().el);
  },

  _createWidget: function () {
    this._exportImageWidget = new ExportImageWidget({
      mapViewClass: 'CDB-Map-wrapper',
      dashboardCanvasClass: 'CDB-Dashboard-canvas',
      model: this._exportImageFormModel
    });

    this.addView(this._exportImageWidget);
    this._$map.prepend(this._exportImageWidget.render().$el);
  },

  _exportImage: function () {
    var format = this._exportImageFormModel.get('format');

    var url = vis.getStaticImageURL({ // eslint-disable-line
      zoom: vis.map.getZoom(), // eslint-disable-line
      width: this._exportImageFormModel.get('width'),
      height: this._exportImageFormModel.get('height'),
      lat: this._exportImageFormModel.get('lat'),
      lng: this._exportImageFormModel.get('lng'),
      format: format
    });

    this._getDataUri(
      url,
      format,
      function (dataUri) {
        var link = document.createElement('a');
        link.download = vis.get('title') + '.' + format; // eslint-disable-line
        link.href = dataUri;
        link.click();
        this._footerView.stop();
      }.bind(this)
    );
  },

  _getDataUri: function (url, format, callback) {
    var image = new Image(); // eslint-disable-line

    image.setAttribute('crossOrigin', 'anonymous');

    image.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = this.naturalWidth;
      canvas.height = this.naturalHeight;
      canvas.getContext('2d').drawImage(this, 0, 0);
      callback(canvas.toDataURL('image/' + format));
    };

    image.src = url;
  },

  _goStepBack: function () {
    this._stackLayoutModel.prevStep();
  }
});
