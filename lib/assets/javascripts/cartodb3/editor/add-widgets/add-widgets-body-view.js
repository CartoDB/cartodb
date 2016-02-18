var cdb = require('cartodb.js');
var AddWidgetsFormulaOptionsView = require('./add-widgets-formula-options-view');

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

    // TODO should be wrapped in a tabpane component here
    var view = new AddWidgetsFormulaOptionsView({
      className: 'Dialog-bodyInnerExpandedWithSubFooter',
      buckets: this._buckets,
      selectedCollection: this._selectedCollection
    });
    this.addView(view);
    this.$el.append(view.render().$el);

    return this;
  }

});
