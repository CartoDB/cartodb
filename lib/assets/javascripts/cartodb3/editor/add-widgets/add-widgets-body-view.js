var cdb = require('cartodb.js');
var AddWidgetsFormulaOptionsView = require('./formula/add-widgets-formula-options-view');
var createTextLabelsTabPane = require('../../components/tab-pane/create-text-labels-tab-pane');
var tabPaneTemplate = require('./add-widgets-tab-pane-template.tpl');
var viewFactory = require('../../components/view-factory');

/**
 * View to select widget options to create.
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.selectedCollection) throw new Error('selectedCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._selectedCollection = opts.selectedCollection;

    // Datastructure with buckets for each unique name+type tuple.
    // Each bucket contains a columnModel and layerDefinitionModel tuple,
    // since they are unique even if the columns' name+type happen to be the same
    // e.g.
    //   {
    //     foobar-string: [{
    //       columnModel: M({name: 'foobar', type: 'string', …}),
    //       layerDefinitionModel: M({ id: 'abc-123', … })
    //     }]
    //   }
    // From this widget definition options for specific needs
    var buckets = this
      ._layerDefinitionsCollection
      .reduce(function (memo, layerDefModel) {
        var layerTableModel = layerDefModel.layerTableModel;
        if (layerTableModel) {
          layerTableModel.columnsCollection.each(function (m) {
            var key = m.get('name') + '-' + m.get('type');
            var val = memo[key] = memo[key] || [];
            val.push({
              layerDefinitionModel: layerDefModel,
              columnModel: m
            });
          });
        }
        return memo;
      }, {});

    this._buckets = buckets;
  },

  render: function () {
    this.clearSubViews();

    var buckets = this._buckets;
    var selectedCollection = this._selectedCollection;

    var tabPaneItems = [{
      label: _t('editor.add-widgets.tab-pane.histogram-label'),
      createContentView: viewFactory.createByHTML.bind(viewFactory, 'TBD')
    }, {
      label: _t('editor.add-widgets.tab-pane.category-label'),
      createContentView: viewFactory.createByHTML.bind(viewFactory, 'TBD')
    }, {
      selected: true,
      label: _t('editor.add-widgets.tab-pane.formula-label'),
      createContentView: function () {
        return new AddWidgetsFormulaOptionsView({
          buckets: buckets,
          selectedCollection: selectedCollection
        });
      }
    }, {
      label: _t('editor.add-widgets.tab-pane.time-series-label'),
      createContentView: viewFactory.createByHTML.bind(viewFactory, 'TBD')
    }];
    var options = {
      tabPaneOptions: {
        tagName: 'nav',
        className: 'CDB-NavMenu',
        template: tabPaneTemplate,
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
    var view = createTextLabelsTabPane(tabPaneItems, options);
    this.addView(view);
    this.$el.append(view.render().el);

    return this;
  }

});
