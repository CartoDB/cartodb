var _ = require('underscore');
var cdb = require('cartodb.js');
var Backbone = require('backbone');
var AddWidgetsFormulaOptionView = require('./add-widgets-formula-option-view.js');
var AddWidgetsFormulaOptionModel = require('./add-widgets-formula-option-model.js');

/**
 * View to select formula widget options
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.buckets) throw new Error('buckets is required');
    if (!opts.selectedCollection) throw new Error('selectedCollection is required');

    this._selectedCollection = opts.selectedCollection;

    // Create models that are of interest from all the given buckets
    var models = _
      .reduce(opts.buckets, function (memo, bucket) {
        if (bucket[0].columnModel.get('type') === 'number') {
          var model = new AddWidgetsFormulaOptionModel({
            bucket: bucket
          });
          memo.push(model);
        }
        return memo;
      }, []);
    this._formulaOptions = new Backbone.Collection(models);
    this.listenTo(this._formulaOptions, 'change:selected', this._onSelectOption);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html('');
    this._formulaOptions.each(this._renderOption, this);
    return this;
  },

  _renderOption: function (m) {
    var view = new AddWidgetsFormulaOptionView({
      model: m
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _onSelectOption: function (m, isSelected) {
    if (isSelected) {
      this._selectedCollection.add(m);
    } else {
      this._selectedCollection.remove(m);
    }
  }

});
