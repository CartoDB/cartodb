var LocalStorage = require('builder/components/local-storage/local-storage');
var CoreView = require('backbone/core-view');
var template = require('./analysis-view.tpl');
var Analyses = require('builder/data/analyses');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var BASE_STORAGE_KEY = 'onboarding';

var REQUIRED_OPTS = [
  'modalModel',
  'userModel',
  'editorModel',
  'visDefinitionModel'
];

module.exports = CoreView.extend({
  className: 'AnalysisCompletionDetails is-opening',

  events: {
    'click .js-close': '_close',
    'click .js-style': '_onStyle'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    var storageKey = BASE_STORAGE_KEY + '.' + this._visDefinitionModel.get('id');

    LocalStorage.init(storageKey, {
      userModel: this._userModel
    });

    this._initBinds();
  },

  render: function () {
    this.$el.html(template({
      type: this._getGenericAnalysisType()
    }));

    var onboardingTemplate = this._typeDef().onboardingTemplate;
    var html = onboardingTemplate && onboardingTemplate(this.model.attributes);
    this.$('.js-content').html(html);

    this._onChangeEditorModelEdition(this._editorModel);

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'destroy', this._close);
    this.listenTo(this._editorModel, 'change:edition', this._onChangeEditorModelEdition);
    this.add_related_model(this._editorModel);
  },

  _onChangeEditorModelEdition: function (mdl) {
    var isEditing = !!mdl.get('edition');
    this.$el.toggleClass('is-editing', isEditing);
  },

  _close: function () {
    this._forget();
    this.trigger('close', this);
  },

  _onStyle: function () {
    this._forget();
    this.trigger('customEvent', 'style', this);
  },

  _forget: function () {
    LocalStorage.set(this._getGenericAnalysisType(), true);
  },

  _typeDef: function (type) {
    type = type || this.model.get('type');
    return Analyses.getAnalysisByType(type);
  },

  _getGenericAnalysisType: function () {
    var typeDef = this._typeDef();
    return typeDef && typeDef.genericType || this.model.get('type');
  }
});
