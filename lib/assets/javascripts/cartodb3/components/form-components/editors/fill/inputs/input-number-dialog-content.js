var cdb = require('cartodb.js');
var Backbone = require('backbone');
var tabPaneTemplate = require('../fill-tab-pane.tpl');
var createTextLabelsTabPane = require('../../../../../components/tab-pane/create-text-labels-tab-pane');
var InputNumberValueContentView = require('./input-number-value-content-view');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.columns) throw new Error('columns is required');
    this._columns = opts.columns;

    var self = this;

    this._tabPaneTabs = [{
      name: 'fixed',
      label: 'Fixed',
      createContentView: function () {
        return self._generateFixedContentView();
      }
    }, {
      name: 'value',
      label: 'By value',
      createContentView: function () {
        return new InputNumberValueContentView({
          model: self.model,
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

    if (this.model.get('range')) {
      this._tabPaneTabs[1].selected = true;
    }

    this._tabPaneView = createTextLabelsTabPane(this._tabPaneTabs, tabPaneOptions);
    this.addView(this._tabPaneView);

    this._tabPaneView.collection.bind('change:selected', this._onChangeTabPaneViewTab, this);
  },

  render: function () {
    this.$el.append(this._tabPaneView.render().$el);
    return this;
  },

  _onChangeTabPaneViewTab: function () {
    var selectedTabPaneName = this._tabPaneView.getSelectedTabPaneName();

    if (selectedTabPaneName === 'fixed') {
      if (this.model.get('range')) {
        this.model.set('fixed', this.model.get('range')[0]);
        this.model.unset('range');
      }
    } else {
      if (this.model.get('fixed')) {
        this.model.set('range', [0, this.model.get('fixed')]);
        this.model.unset('fixed');
      }
    }

    this.trigger('change', selectedTabPaneName, this);
  },

  _generateFixedContentView: function () {
    this._inputView = new Backbone.Form.editors.Number({
      schema: {},
      value: this.model.get('fixed')
    });

    this._inputView.bind('change', this._onChangeValue, this);
    return this._inputView;
  },

  _onChangeValue: function (input) {
    this.model.set('fixed', input.value);
  }
});
