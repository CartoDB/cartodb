var _ = require('underscore');
var CoreView = require('backbone/core-view');
var createTemplateTabPane = require('builder/components/tab-pane/create-template-tab-pane');
var tabPaneButtonTemplate = require('./tab-pane-button-template.tpl');
var tabPaneTemplate = require('./tab-pane-template.tpl');

/**
 * View to select widget options to create.
 */
module.exports = CoreView.extend({
  module: 'components/modals/add-widgets/body-view',

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
        template: tabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          klassName: 'CDB-NavMenu-item'
        }
      },
      tabPaneTemplateOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-link u-upperCase',
        template: tabPaneButtonTemplate
      }
    };

    var view = createTemplateTabPane(this._tabPaneItems, options);
    this.addView(view);
    this.$el.append(view.render().el);
    return this;
  }
});
