var cdb = require('cartodb.js');
var _ = require('underscore');
var Backbone = require('backbone');
require('../../../components/form-components/index');
var StylesFactory = require('../styles-factory');
var StyleLabelsFormModel = require('./simple-style-form/style-label-properties-form-model');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-new-analysis': '_openAddAnalysis'
  },

  initialize: function (opts) {
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');

    this._layerTableModel = opts.layerTableModel;
    this._styleModel = opts.styleModel;

    this._setInternals();
    this._initBinds();
  },

  render: function () {
    // this._removeFormViews();
    this.clearSubViews();
    this.$el.html(this.template());
    // this._initPropertiesFormView();
    this._initLabelsEnabler();
    // if (this._styleAggregationFormModel) {
    //   this._initAggregationFormView();
    // }
    return this;
  },

  _initBinds: function () {
    this._styleModel.bind('change:type', function () {
      this._setInternals();
      this.render();
    }, this);
    this.add_related_model(this._styleModel);
  },

  _setInternals: function () {
    this.template = StylesFactory.getFormTemplateByType(this._styleModel.get('type'));
    // this._stylePropertiesFormModel = StylesFactory.createStylePropertiesFormModel(this._styleModel, this._layerTableModel);
    // this._styleAggregationFormModel = StylesFactory.createStyleAggregationFormModel(this._styleModel, this._layerTableModel);
  },

  // _removeFormViews: function () {
  //   if (this._stylePropertiesFormView) {
  //     this._stylePropertiesFormView.remove();
  //   }
  //   if (this._styleAggregationFormView) {
  //     this._styleAggregationFormView.remove();
  //   }
  // },

  // _initAggregationFormView: function () {
  //   this._styleAggregationFormView = new Backbone.Form({
  //     model: this._stylePropertiesFormModel
  //   });
  //
  //   this._styleAggregationFormView.bind('change', function () {
  //     this.commit();
  //   });
  //
  //   this.$('.js-aggregationForm').append(this._styleAggregationFormView.render().el);
  // },
  //
  // _initPropertiesFormView: function () {
  //
  // },

  _initLabelsEnabler: function () {
    this._enablerModel = new Backbone.Model({
      enabler: this._styleModel.get('labels').enabled
    });
    this._enablerView = new Backbone.Form.editors.Enabler({
      model: this._enablerModel,
      title: 'hello',
      key: 'enabler'
    });

    this._enablerModel.bind('change', this._setLabelsFormView, this);
    this._setLabelsFormView();
    this.$('.js-propertiesForm').append(this._enablerView.render().el);
  },

  _setLabelsFormView: function () {
    var isEnabled = this._enablerModel.get('enabler');
    if (isEnabled) {
      this._genLabelsFormView();
    } else {
      this._removeLabelsFormView();
    }

    var d = this._styleModel.get('labels');
    this._styleModel.set('labels', _.extend(d, { enabled: isEnabled }));
  },

  _genLabelsFormView: function () {
    this._labelsFormModel = new StyleLabelsFormModel({}, {
      layerTableModel: this._layerTableModel,
      styleModel: this._styleModel
    });

    this._labelsFormView = new Backbone.Form({
      className: 'Editor-formInner--nested',
      model: this._labelsFormModel
    });

    this._labelsFormView.bind('change', function () {
      this.commit();
    });

    this.$('.js-propertiesForm').append(this._labelsFormView.render().el);
  },

  _removeLabelsFormView: function () {
    if (this._labelsFormView) {
      this._labelsFormView.remove();
      this._labelsFormView.$el.empty();
    }
  },

  clean: function () {
    // this._removeLabelPropertiesFormView();
    cdb.core.View.prototype.clean.call(this);
  }
});
