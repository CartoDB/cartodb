var cdb = require('cartodb-deep-insights.js');
var Backbone = require('backbone');
var template = require('./analysis-tradeArea-form.tpl');
require('../../../../components/form-components/index');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.analysisModel) throw new Error('analysisModel is required');
    this.model = opts.analysisModel;
  },

  render: function () {
    this.$el.append(template());
    this._initViews();
    return this;
  },

  _initViews: function () {
    this._analysisFormModel = new cdb.core.Model({
      source: this.model.get('source_id'),
      kind: this.model.get('kind'),
      time: this.model.get('time')
    });
    this._analysisFormModel.schema = {
      source: {
        type: 'Select',
        options: [this.model.get('source_id')]
      },
      kind: {
        type: 'Select',
        options: ['walk', 'drive', 'bike']
      },
      time: {
        type: 'Number'
      }
    };
    this._analysisFormView = new Backbone.Form({
      model: this._analysisFormModel
    });

    this._analysisFormView.bind('change', function () {
      var errors = this.commit();
      console.log('errors', errors);
    });

    this.$el.append(this._analysisFormView.render().el);
    this.addView(this._analysisFormView);
  }
});
