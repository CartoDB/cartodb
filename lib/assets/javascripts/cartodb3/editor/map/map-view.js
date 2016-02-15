var cdb = require('cartodb.js');
var EditorWidgetsView = require('../widgets/widgets-view');
var TabPaneViewFactory = require('../../components/tab-pane/tab-pane-factory');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._visDefinitionModel = opts.visDefinitionModel;
  },

  render: function () {
    var self = this;

    var mapTabPaneView = TabPaneViewFactory.createWithTextLabels({}, [{
      label: 'layers',
      selected: true,
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      label: 'elements',
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      label: 'widgets',
      createContentView: function () {
        return new EditorWidgetsView({
          widgetDefinitionsCollection: self._visDefinitionModel.widgetDefinitionsCollection,
          layerDefinitionsCollection: self._layerDefinitionsCollection
        });
      }
    }]);

    this.$el.append(mapTabPaneView.render().$el);
    return this;
  }
});
