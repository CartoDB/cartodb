var cdb = require('cartodb-deep-insights.js');
var $ = require('jquery');
var WidgetsFormContentDataView = require('./widgets-form-content-data-view');
var WidgetsFormContentStyleView = require('./widgets-form-content-style-view');
var TabPaneViewFactory = require('../../../components/tab-pane/tab-pane-factory');
var TabPaneTemplate = require('../../map/tab-pane-template.tpl');

/**
 * View to render all necessary for the widget form
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    this._layerTableModel = opts.layerTableModel;
    this._widgetDefinitionModel = opts.widgetDefinitionModel;
    this.stackLayoutModel = opts.stackLayoutModel;
    this._widgetDefinitionModel.on('change:type', this.render, this);

    if (!this._layerTableModel.get('fetched')) {
      this.listenToOnce(this._layerTableModel, 'change:fetched', this.render);
      this._layerTableModel.fetch();
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      $('<button>')
        .addClass('js-back')
        .html('<i class="CDB-IconFont CDB-IconFont-arrowPrev"></i>')
    );
    this._initViews();
    return this;
  },

  _initViews: function () {
    var self = this;

    this.tabPaneItems = [{
      selected: true,
      label: _t('editor.widgets.widgets-form.data.title'),
      createContentView: function () {
        return new WidgetsFormContentDataView({
          widgetDefinitionModel: self._widgetDefinitionModel,
          layerTableModel: self._layerTableModel
        });
      }
    }, {
      selected: false,
      label: _t('editor.widgets.widgets-form.style.title'),
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
        className: 'CDB-NavMenu-Link'
      }
    };

    this.tabPaneView = TabPaneViewFactory.createWithTextLabels(this.tabPaneItems, options);
    this.$el.append(this.tabPaneView.render().$el);
  },

  _onClickBack: function () {
    this.stackLayoutModel.prevStep();
  }

});
