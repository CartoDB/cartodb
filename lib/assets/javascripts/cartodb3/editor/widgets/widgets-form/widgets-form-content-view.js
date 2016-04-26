var cdb = require('cartodb-deep-insights.js');
var WidgetsFormContentDataView = require('./widgets-form-content-data-view');
var WidgetsFormContentStyleView = require('./widgets-form-content-style-view');
var createTextLabelsTabPane = require('../../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('./tab-pane.tpl');
var Header = require('./widget-header.js');

/**
 * View to render all necessary for the widget form
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._widgetDefinitionModel = opts.widgetDefinitionModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._stackLayoutModel = opts.stackLayoutModel;
  },

  render: function () {
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var self = this;

    this.tabPaneItems = [{
      selected: true,
      label: _t('editor.widgets.widgets-form.data.title-label'),
      createContentView: function () {
        var layerId = self._widgetDefinitionModel.get('layer_id');
        var layerDefinitionModel = self._layerDefinitionsCollection.get(layerId);

        return new WidgetsFormContentDataView({
          widgetDefinitionModel: self._widgetDefinitionModel,
          layerTableModel: layerDefinitionModel.layerTableModel
        });
      }
    }, {
      selected: false,
      label: _t('editor.widgets.widgets-form.style.title-label'),
      createContentView: function () {
        return new WidgetsFormContentStyleView({
          widgetDefinitionModel: self._widgetDefinitionModel
        });
      }
    }];

    var options = {
      tabPaneOptions: {
        tagName: 'nav',
        className: 'CDB-NavMenu',
        template: TabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavMenu-Item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-Link u-upperCase'
      }
    };

    var header = new Header({
      title: this._widgetDefinitionModel.get('title')
    });

    this.tabPaneView = createTextLabelsTabPane(this.tabPaneItems, options);
    this.$el.append(header.render().$el);
    this.$el.append(this.tabPaneView.render().$el);
  },

  _onClickBack: function () {
    this._stackLayoutModel.prevStep('widgets');
  }

});
