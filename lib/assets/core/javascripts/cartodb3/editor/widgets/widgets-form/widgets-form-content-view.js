var CoreView = require('backbone/core-view');
var WidgetsFormView = require('./widgets-form-view');
var WidgetHeaderView = require('./widget-header.js');
var ScrollView = require('../../../components/scroll/scroll-view');
var InfoboxModel = require('../../../components/infobox/infobox-model');
var InfoboxView = require('../../../components/infobox/infobox-view');
var InfoboxCollection = require('../../../components/infobox/infobox-collection');
var LimitNotifications = require('../../../limit-notifications');
var checkAndBuildOpts = require('../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'userActions',
  'widgetDefinitionModel',
  'modals',
  'analysisDefinitionNodesCollection',
  'layerDefinitionsCollection',
  'stackLayoutModel',
  'configModel',
  'userModel'
];

/**
 * View to render all necessary for the widget form
 */

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_goBack'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    var infoboxStates = [
      LimitNotifications.infobox()
    ];

    this._infoboxModel = new InfoboxModel({
      state: null
    });

    this._infoboxCollection = new InfoboxCollection(infoboxStates);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this._infoboxState();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._widgetDefinitionModel.bind('destroy', this._goBack, this);
    this.add_related_model(this._widgetDefinitionModel);
  },

  _initViews: function () {
    var self = this;
    var nodeId = self._widgetDefinitionModel.get('source');
    var analysisDefinitionNodeModel = self._analysisDefinitionNodesCollection.get(nodeId);

    var header = new WidgetHeaderView({
      layerDefinitionModel: this._layerDefinitionsCollection.get(this._widgetDefinitionModel.get('layer_id')),
      model: this._widgetDefinitionModel,
      modals: this._modals,
      userActions: this._userActions,
      stackLayoutModel: this._stackLayoutModel
    });
    this.$el.append(header.render().$el);
    this.addView(header);

    var view = new ScrollView({
      createContentView: function () {
        return new WidgetsFormView({
          userActions: self._userActions,
          widgetDefinitionModel: self._widgetDefinitionModel,
          querySchemaModel: analysisDefinitionNodeModel.querySchemaModel,
          modals: self._modals,
          configModel: self._configModel,
          userModel: self._userModel
        });
      }
    });

    this.$el.append(view.render().$el);
    this.addView(view);

    var infoboxView = new InfoboxView({
      infoboxModel: this._infoboxModel,
      infoboxCollection: this._infoboxCollection
    });

    this.$el.append(infoboxView.render().el);
    this.addView(infoboxView);
  },

  _infoboxState: function () {
    var hasLimitError = LimitNotifications.getByType('limit');

    if (hasLimitError) {
      this._infoboxModel.set('state', 'limit');
    } else {
      this._infoboxModel.set('state', '');
    }
  },

  _goBack: function () {
    if (this._stackLayoutPrevStep) {
      this._stackLayoutPrevStep();
    } else {
      this._stackLayoutModel.prevStep('widgets');
    }
  }
});
