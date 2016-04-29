var cdb = require('cartodb.js');
var Backbone = require('backbone');
require('../../components/form-components/index');
var SimpleStyleFormModel = require('./style-form/simple-style-form/simple-style-properties-form-model');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-new-analysis': '_openAddAnalysis'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._layerTableModel = this._layerDefinitionModel.layerTableModel;
    this._columnsCollection = this._layerTableModel.columnsCollection;
    this._styleModel = this._layerDefinitionModel._styleModel;
    this._modals = opts.modals;

    this._initBinds();

    if (!this._layerTableModel.get('fetched')) {
      this._layerTableModel.fetch();
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._styleModel.bind('change:type change:aggr_type', this.render, this);
    this.add_related_model(this._styleModel);
  },

  _initViews: function () {
    if (this._styleFormView) {
      this._styleFormView.remove();
    }

    this._styleFormModel = new SimpleStyleFormModel({}, {
      styleModel: this._styleModel
    });

    this._styleFormView = new Backbone.Form({
      model: this._styleFormModel
    });

    this._styleFormView.bind('change', function () {
      this.commit();
    });

    this.$el.append(this._styleFormView.render().el);
  },

  clean: function () {
    if (this._styleFormView) {
      this._styleFormView.remove();
    }
    cdb.core.View.prototype.clean.apply(this);
  }
});
