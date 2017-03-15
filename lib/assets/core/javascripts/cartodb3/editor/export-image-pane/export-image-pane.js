var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var Header = require('./export-image-header');
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
  'userActions',
  'modals',
  'configModel',
  'userModel',
  'editorModel',
  'pollingModel',
  'analysisDefinitionNodesCollection',
  'layerDefinitionsCollection',
  'privacyCollection',
  'widgetDefinitionsCollection',
  'mapcapsCollection',
  'visDefinitionModel',
  'mapStackLayoutModel',
  'stateDefinitionModel',
  'stackLayoutModel'
];

module.exports = CoreView.extend({
  className: 'Editor-content',

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

    this._exportImageWidget = new ExportImageWidget({
      model: this._exportImageFormModel
    });

    this.addView(this._exportImageWidget);
  },

  render: function () {
    this.$el.append(template);

    this._$map.prepend(this._exportImageWidget.render().$el);

    this._createHeader();
    this._createForm();
    this._createFooter();

    return this;
  },

  _createHeader: function () {
    var self = this;

    var header = new Header({
      editorModel: self._editorModel,
      mapcapsCollection: self._mapcapsCollection,
      modals: self._modals,
      visDefinitionModel: self._visDefinitionModel,
      privacyCollection: self._privacyCollection,
      configModel: self._configModel,
      userModel: self._userModel
    });

    header.bind('back', function () {
      this._stackLayoutModel.prevStep();
    }, this);

    this.$('.js-content').append(header.render().$el);
    this.addView(header);
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

  _exportImage: function () {
    console.log('export');
  }
});
