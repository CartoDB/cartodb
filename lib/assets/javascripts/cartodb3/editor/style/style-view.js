var cdb = require('cartodb.js');
var _ = require('underscore');
var PanelWithOptionsView = require('../../editor/components/view-options/panel-with-options-view');
var StyleContentView = require('./style-content-view');
var StyleCartoCSSView = require('./style-cartocss-view');
var ScrollView = require('../../components/scroll/scroll-view');
var TabPaneView = require('../../components/tab-pane/tab-pane-view');
var TabPaneCollection = require('../../components/tab-pane/tab-pane-collection');
var Toggler = require('../../editor/components/toggler/toggler-view');
var UndoButtons = require('../../editor/components/undo-redo/undo-redo-view');
var UndoManager = require('../../data/undo-manager');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-new-analysis': '_openAddAnalysis'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layersDefinitionCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.editorModel) throw new Error('editorModel is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._styleModel = this._layerDefinitionModel.styleModel;
    this._modals = opts.modals;
    this._querySchemaModel = opts.querySchemaModel;
    this._editorModel = opts.editorModel;

    // Set edition attribute in case custom cartocss is applied
    this._editorModel.set({ edition: this._layerDefinitionModel.get('cartocss_custom') });
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var self = this;

    var cartocssUndoModel = new cdb.core.Model({
      content: this._layerDefinitionModel.get('cartocss')
    });

    UndoManager.init(cartocssUndoModel, { track: true });

    var codemirrorModel = new cdb.core.Model({
      content: this._layerDefinitionModel.get('cartocss')
    });

    this._styleModel.bind('change', function () {
      codemirrorModel.set('content', this._layerDefinitionModel.get('cartocss'));
    }, this);
    this.add_related_model(this._styleModel);

    cartocssUndoModel.bind('undo redo', function () {
      codemirrorModel.set('content', cartocssUndoModel.get('content'));
    }, this);
    this.add_related_model(cartocssUndoModel);

    var tabPaneTabs = [{
      selected: !this._layerDefinitionModel.get('cartocss_custom'),
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new StyleContentView({
              className: 'Editor-content',
              layerDefinitionsCollection: self._layerDefinitionsCollection,
              layerDefinitionModel: self._layerDefinitionModel,
              styleModel: self._styleModel,
              modals: self._modals,
              querySchemaModel: self._querySchemaModel,
              editorModel: self._editorModel
            });
          }
        });
      },
      createActionView: function () {
        return new UndoButtons({
          trackModel: self._styleModel,
          editorModel: self._editorModel,
          applyButton: false
        });
      }
    }, {
      selected: this._layerDefinitionModel.get('cartocss_custom'),
      createContentView: function () {
        return new StyleCartoCSSView({
          layerDefinitionModel: self._layerDefinitionModel,
          styleModel: self._styleModel,
          cartocssModel: codemirrorModel
        });
      },
      createActionView: function () {
        return new UndoButtons({
          trackModel: cartocssUndoModel,
          editorModel: self._editorModel,
          applyButton: true,
          onApplyClick: function () {
            self._layerDefinitionModel.save({
              cartocss_custom: true,
              cartocss: codemirrorModel.get('content')
            });

            cartocssUndoModel.set('content', codemirrorModel.get('content'));
          }
        });
      }
    }];

    var collectionPane = new TabPaneCollection(tabPaneTabs);
    var panelWithOptionsView = new PanelWithOptionsView({
      className: 'Editor-content',
      editorModel: self._editorModel,
      createContentView: function () {
        return new TabPaneView({
          collection: collectionPane
        });
      },
      createControlView: function () {
        return new Toggler({
          editorModel: self._editorModel,
          collection: collectionPane,
          labels: [_t('editor.style.style-toggle.values'), _t('editor.style.style-toggle.cartocss')]
        });
      },
      createActionView: function () {
        return new TabPaneView({
          collection: collectionPane,
          createContentKey: 'createActionView'
        });
      }
    });

    this.$el.append(panelWithOptionsView.render().el);
    this.addView(panelWithOptionsView);
  }

});
