var _ = require('underscore');
var cdb = require('cartodb.js');
var createTextLabelsTabPane = require('../../tab-pane/create-text-labels-tab-pane');
var tabPaneTemplate = require('./tab-pane-template.tpl');

/**
 * View to select widget options to create.
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.optionsCollection) throw new Error('optionsCollection is required');
    if (!opts.widgetsTypes) throw new Error('widgetsTypes is required');

    // Only render tab items for types that have option models available
    var availableTypes = _.unique(opts.optionsCollection.pluck('type'));
    this._tabPaneItems = _
      .reduce(opts.widgetsTypes, function (memo, d) {
        if (_.contains(availableTypes, d.type)) {
          var tabPaneItem = d.createTabPaneItem(opts.optionsCollection);
          memo.push(tabPaneItem);
        }
        return memo;
      }, []);
  },

  render: function () {
    this.clearSubViews();

    var options = {
      tabPaneOptions: {
        tagName: 'nav',
        className: 'CDB-NavMenu',
        template: tabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'NavTab-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'NavTab-itemLink'
      }
    };
    var view = createTextLabelsTabPane(this._tabPaneItems, options);
    this.addView(view);
    this.$el.append(view.render().el);

    return this;
  }

});
