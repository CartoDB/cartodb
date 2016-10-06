var LocalStorage = require('../../../components/local-storage/local-storage');
var CoreView = require('backbone/core-view');
var template = require('./analysis-view.tpl');

var STORAGE_KEY = 'onboarding';
var ANALYSES_TYPES = require('./analyses-types');

module.exports = CoreView.extend({
  className: 'AnalysisCompletionDetails is-opening',

  events: {
    'click .js-close': '_close',
    'click .js-style': '_onStyle'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');

    this._modalModel = opts.modalModel;
    this._userModel = opts.userModel;
    this._editorModel = opts.editorModel;

    LocalStorage.init(STORAGE_KEY, {
      userModel: this._userModel
    });

    this._initBinds();
  },

  render: function () {
    this.$el.html(template({
      type: this._getGenericAnalysisType()
    }));

    var html = this._typeDef().template(this.model.attributes);
    this.$('.js-content').html(html);

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'destroy', this._close);
    this.listenTo(this._editorModel, 'change:edition', this._changeEdition);
    this.add_related_model(this._editorModel);
  },

  _changeEdition: function (mdl) {
    var isEditing = !!mdl.get('edition');
    this.$el.toggleClass('is-editing', isEditing);
  },

  _close: function () {
    this._checkForgetStatus();
    this.trigger('close', this);
  },

  _onStyle: function () {
    this._checkForgetStatus();
    this.trigger('customEvent', 'style', this);
  },

  _checkForgetStatus: function () {
    if (this.$('.js-forget:checked').val()) {
      this._forget();
    }
  },

  _forget: function () {
    LocalStorage.set(this._getGenericAnalysisType(), true);
  },

  _typeDef: function (type) {
    type = type || this.model.get('type');
    return ANALYSES_TYPES[type];
  },

  _getStyleAnalysisAfterFinish: function () {
    return this._typeDef().style;
  },

  _getGenericAnalysisType: function () {
    var typeDef = this._typeDef();
    return typeDef && typeDef.genericType || this.model.get('type');
  }
});
