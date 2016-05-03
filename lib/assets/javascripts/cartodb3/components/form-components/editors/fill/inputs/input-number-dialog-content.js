var $ = require('jquery');
var Backbone = require('backbone');
var CustomListView = require('../../../../custom-list/custom-view');
var CustomListCollection = require('../../../../custom-list/custom-list-collection');
require('backbone-forms');
Backbone.$ = $;
require('../../../../form-components/editors/number.js');
var cdb = require('cartodb.js');
var tabPaneTemplate = require('./../fill-tab-pane.tpl');
var createTextLabelsTabPane = require('../../../../../components/tab-pane/create-text-labels-tab-pane');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
  },

  _onChangeValue: function (input) {
    this.model.set('fixed', input.value);
  },

  _generateFixedContentView: function () {
    this.inputView = new Backbone.Form.editors.Number({
      schema: {},
      value: this.model.get('fixed')
    });

    this.inputView.bind('change', this._onChangeValue, this);
    return this.inputView;
  },

  _generateByValueContentView: function () {
    this.collection = new CustomListCollection(['one', 'two', 'three']);
    this.listView = new CustomListView({
      collection: this.collection,
      showSearch: true,
      typeLabel: 'names'
    });

    this.collection.bind('change:selected', function (item) {
      console.log(item.get('val'));
    }, this);

    return this.listView;
  },

  render: function () {
    var self = this;

    var tabPaneTabs = [{
      name: 'fixed',
      label: 'Fixed',
      selected: true,
      createContentView: function () {
        return self._generateFixedContentView();
      }
    }, {
      name: 'value',
      label: 'By value',
      selected: false,
      createContentView: function () {
        return self._generateByValueContentView();
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
        className: 'CDB-NavMenu-Link u-upperCase'
      }
    };

    this._tabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);

    this.$el.append(this._tabPaneView.render().$el);

    return this;
  }
});
