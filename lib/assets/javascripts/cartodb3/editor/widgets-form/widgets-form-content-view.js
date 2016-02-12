var cdb = require('cartodb.js');
var WidgetsFormContentDataView = require('./widgets-form-content-data-view');
var WidgetsFormContentStyleView = require('./widgets-form-content-style-view');
var TabPaneCollection = require('../../components/tab-pane/tab-pane-collection');
var TabPaneLabelView = require('../../components/tab-pane/tab-pane-label-view');
var TabPaneView = require('../../components/tab-pane/tab-pane-view');

/**
 * View to render all necessary for the widget form
 */

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    this._tableModel = opts.tableModel;
    this._widgetDefinitionModel = opts.widgetDefinitionModel;

    this._widgetDefinitionModel.on('change:type', this.render, this);

    if (!this._tableModel.get('fetched')) {
      this._tableModel.fetch({
        success: this.render.bind(this)
      });
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var self = this;

    var tabPaneDataModel = new cdb.core.Model({
      createContentView: function () {
        return new WidgetsFormContentDataView({
          widgetDefinitionModel: self._widgetDefinitionModel,
          tableModel: self._tableModel
        });
      },
      createButtonView: function () {
        return self._generateLabelView(_t('editor.widgets.widgets-form.data'));
      }
    });

    var tabPaneStyleModel = new cdb.core.Model({
      createContentView: function () {
        return new WidgetsFormContentStyleView({
          widgetDefinitionModel: self._widgetDefinitionModel
        });
      },
      createButtonView: function () {
        return self._generateLabelView(_t('editor.widgets.widgets-form.style'));
      }
    });

    this.tabPaneView = new TabPaneView({
      collection: new TabPaneCollection([tabPaneDataModel, tabPaneStyleModel])
    });

    this.$el.append(this.tabPaneView.render().$el);
  },

  _generateLabelView: function (label) {
    return new TabPaneLabelView({
      model: new cdb.core.Model({ label: label })
    });
  }
});
