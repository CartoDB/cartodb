var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./builder-view.tpl');
var AnalysesService = require('../../../editor/layers/layer-content-views/analyses/analyses-service');
var GeoreferenceOnboardingLauncher = require('../georeference/georeference-launcher');
var VisTableModel = require('../../../data/visualization-table-model');
var QueryRowsCollection = require('../../../data/query-rows-collection');

var BUILDER_KEY = 'onboarding';

var LEFT_KEY_CODE = 37;
var RIGHT_KEY_CODE = 39;

module.exports = CoreView.extend({
  className: 'BuilderOnboarding is-step0 is-opening',

  events: {
    'click .js-start': '_onClickNext',
    'click .js-next': '_onClickNext',
    'click .js-close': '_close'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.onboardingNotification) throw new Error('onboardingNotification is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    this._modalModel = opts.modalModel;
    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._editorModel = opts.editorModel;
    this._onboardingNotification = opts.onboardingNotification;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;

    this._initModels();
    this._initBinds();
  },

  render: function () {
    this.$el.html(template({
      name: this._userModel.get('name') || this._userModel.get('username')
    }));

    return this;
  },

  _initModels: function () {
    this.model = new Backbone.Model({
      step: 0
    });

    this._omitLayers = [];
  },

  _initBinds: function () {
    this._keyDown = this._onKeyDown.bind(this);
    $(document).on('keydown', this._keyDown);

    this.listenTo(this.model, 'dechange:stepstroy', this._onChangeStep);
    this.listenTo(this.model, 'destroy', this._close);
    this.listenTo(this._editorModel, 'change:edition', this._changeEdition);
  },

  _changeEdition: function (mdl) {
    var isEditing = !!mdl.get('edition');
    this.$el.toggleClass('is-editing', isEditing);
  },

  _prev: function () {
    if (this._currentStep() >= 1) {
      this.model.set('step', this._currentStep() - 1);
    }
  },

  _next: function () {
    if (this._currentStep() <= 3) {
      this.model.set('step', this._currentStep() + 1);
    }
  },

  _currentStep: function () {
    return this.model.get('step');
  },

  _onClickNext: function () {
    this._next();
  },

  _onChangeStep: function () {
    var self = this;
    this.$el.removeClass('is-step' + this.model.previous('step'), function () {
      self.$el.addClass('is-step' + self._currentStep());
    });

    this.$('.js-step').removeClass('is-step' + this.model.previous('step'), function () {
      self.$('.js-step').addClass('is-step' + self._currentStep());
    });
  },

  _close: function () {
    this._checkForgetStatus();
    this.trigger('close', this);

    this._launchGeoreferenceOnboarding();
  },

  _launchGeoreferenceOnboarding: function () {
    var rowsCollection;

    var filtered = new Backbone.Collection(this._layerDefinitionsCollection.reject(function (layerDefModel) {
      return _(this._omitLayers).contains(layerDefModel.get('id'));
    }, this));

    filtered.each(function (layerDefModel) {
      if (!this._nonGeoreferencedLayer) {
        var analysisDefinitionNodeModel = layerDefModel.getAnalysisDefinitionNodeModel();

        if (!layerDefModel.hasAnalyses() && analysisDefinitionNodeModel && !analysisDefinitionNodeModel.isCustomQueryApplied()) {
          var queryGeometryModel = analysisDefinitionNodeModel.queryGeometryModel;
          var querySchemaModel = analysisDefinitionNodeModel.querySchemaModel;

          if (queryGeometryModel.shouldFetch()) {
            queryGeometryModel.fetch({
              success: this._launchGeoreferenceOnboarding.bind(this)
            });
          }

          if (querySchemaModel.shouldFetch()) {
            querySchemaModel.fetch({
              success: _.debounce(this._launchGeoreferenceOnboarding.bind(this), 100)
            });
          }

          if (queryGeometryModel.isFetched() && querySchemaModel.isFetched()) {
            if (!queryGeometryModel.hasValue()) {
              var tableName = '';
              var tableModel;

              var sourceNode;

              var node = layerDefModel.getAnalysisDefinitionNodeModel();
              var source;
              var primarySource;

              if (node.get('type') === 'source') {
                source = node;
              } else {
                primarySource = node.getPrimarySource();
                if (primarySource && primarySource.get('type') === 'source') {
                  source = primarySource;
                }
              }

              sourceNode = source;

              if (sourceNode) {
                tableName = sourceNode.get('table_name');

                this._visTableModel = new VisTableModel({
                  id: tableName,
                  table: {
                    name: tableName
                  }
                }, {
                  configModel: this._configModel
                });
              }

              if (this._visTableModel) {
                tableModel = this._visTableModel.getTableModel();
                tableName = tableModel.getUnquotedName();
              }

              rowsCollection = new QueryRowsCollection([], {
                configModel: this._configModel,
                tableName: tableName,
                querySchemaModel: querySchemaModel
              });

              rowsCollection.fetch({
                data: {
                  page: 0,
                  rows_per_page: 1,
                  order_by: '',
                  sort_order: '',
                  exclude: []
                },
                success: function () {
                  if (!this._nonGeoreferencedLayer) {
                    var layerId = layerDefModel.get('id');

                    if (rowsCollection.length > 0) {
                      this._nonGeoreferencedLayer = layerDefModel;

                      AnalysesService.setLayerId(layerId);

                      GeoreferenceOnboardingLauncher.launch({
                        name: this._nonGeoreferencedLayer.getName(),
                        source: this._nonGeoreferencedLayer.get('source')
                      });
                    } else {
                      this._omitLayers.push(layerId);
                      this._launchGeoreferenceOnboarding();
                    }
                  }
                }.bind(this)
              });
            }
          }
        }
      }
    }, this);
  },

  _onKeyDown: function (e) {
    e.stopPropagation();

    if (e.which === LEFT_KEY_CODE) {
      this._prev();
    } else if (e.which === RIGHT_KEY_CODE) {
      this._next();
    }
  },

  _checkForgetStatus: function () {
    if (this.$('.js-forget:checked').val()) {
      this._forget();
    }
  },

  _forget: function () {
    this._onboardingNotification.setKey(BUILDER_KEY, true);
    this._onboardingNotification.save();
  },

  clean: function () {
    $(document).off('keydown', this._keyDown);
    CoreView.prototype.clean.apply(this);
  }
});
