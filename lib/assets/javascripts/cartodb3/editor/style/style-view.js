var cdb = require('cartodb.js');
var EditionTogglePanelView = require('../../editor/components/edition-toggle/edition-toggle-panel-view');
var StyleContentView = require('./style-content-view');
var StyleCartoCSSView = require('./style-cartocss-view');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-new-analysis': '_openAddAnalysis'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layersDefinitionCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._styleModel = this._layerDefinitionModel.styleModel;
    this._modals = opts.modals;
    this._querySchemaModel = opts.querySchemaModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var self = this;

    var tabPaneTabs = [{
      label: _t('editor.style.style-toggle.values'),
      selected: !this._layerDefinitionModel.get('tile_style_custom'),
      createContentView: function () {
        return new StyleContentView({
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          layerDefinitionModel: self._layerDefinitionModel,
          styleModel: self._styleModel,
          modals: self._modals,
          querySchemaModel: self._querySchemaModel
        });
      },
      createControlView: function () {
        return new cdb.core.View();
      }
    }, {
      label: _t('editor.style.style-toggle.cartocss'),
      selected: this._layerDefinitionModel.get('tile_style_custom'),
      createContentView: function () {
        return new StyleCartoCSSView({
          layerDefinitionModel: self._layerDefinitionModel,
          styleModel: self._styleModel
        });
      },
      createControlView: function () {
        return new cdb.core.View();
      }
    }];

    var editionTogglePanelView = new EditionTogglePanelView({
      panes: tabPaneTabs
    });

    this.$el.append(editionTogglePanelView.render().el);
    this.addView(editionTogglePanelView);
  }

});
