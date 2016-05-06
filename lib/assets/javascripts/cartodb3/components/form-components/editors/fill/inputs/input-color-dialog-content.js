var cdb = require('cartodb.js');
var tabPaneTemplate = require('../fill-tab-pane.tpl');
var createTextLabelsTabPane = require('../../../../../components/tab-pane/create-text-labels-tab-pane');
var ColorPickerView = require('./color-picker');
var InputColorValueContentView = require('./input-color-value-content-view');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.columns) throw new Error('columns is required');
    this._columns = opts.columns;

    var self = this;

    var tabPaneTabs = [{
      name: 'fixed',
      label: 'Solid',
      selected: true,
      createContentView: function () {
        return self._generateFixedContentView();
      }
    }, {
      name: 'value',
      label: 'By value',
      selected: false,
      createContentView: function () {
        return new InputColorValueContentView({
          columns: self._columns
        });
      }
    }];

    var tabPaneOptions = {
      tabPaneOptions: {
        template: tabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavMenu-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-link u-upperCase'
      }
    };

    this._tabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);
    this.addView(this._tabPaneView);
    this._tabPaneView.collection.bind('change:selected', this._onChangeTabPaneViewTab, this);
  },

  render: function () {
    this.$el.append(this._tabPaneView.render().$el);
    return this;
  },

  _onChangeTabPaneViewTab: function () {
    this.trigger('change', this._tabPaneView.getSelectedTabPaneName(), this);
  },

  _generateFixedContentView: function () {
    this._inputView = new ColorPickerView({
      value: this.model.get('value')
    });

    this._inputView.bind('change', this._onChangeValue, this);
    return this._inputView;
  }
});
