var cdb = require('cartodb-deep-insights.js');
var $ = require('jquery');
var WidgetsFormContentDataView = require('./widgets-form-content-data-view');
var WidgetsFormContentStyleView = require('./widgets-form-content-style-view');
var TabPaneViewFactory = require('../../../components/tab-pane/tab-pane-factory');

/**
 * View to render all necessary for the widget form
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    this._tableModel = opts.tableModel;
    this._widgetDefinitionModel = opts.widgetDefinitionModel;
    this.stackLayoutModel = opts.stackLayoutModel;
    this._widgetDefinitionModel.on('change:type', this.render, this);

    if (!this._tableModel.get('fetched')) {
      this._tableModel.fetch({
        success: this.render.bind(this)
      });
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
      label: _t('editor.widgets.widgets-form.data'),
      createContentView: function () {
        return new WidgetsFormContentDataView({
          widgetDefinitionModel: self._widgetDefinitionModel,
          tableModel: self._tableModel
        });
      }
    }, {
      selected: false,
      label: _t('editor.widgets.widgets-form.style'),
      createContentView: function () {
        return new WidgetsFormContentStyleView({
          widgetDefinitionModel: self._widgetDefinitionModel
        });
      }
    }];

    this.tabPaneView = TabPaneViewFactory.createWithTextLabels(this.tabPaneItems);
    this.$el.append(this.tabPaneView.render().$el);
  },

  _onClickBack: function () {
    this.stackLayoutModel.prevStep();
  }

});
