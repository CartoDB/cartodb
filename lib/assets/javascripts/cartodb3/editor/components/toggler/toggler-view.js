var cdb = require('cartodb.js');
var template = require('./toggler.tpl');

module.exports = cdb.core.View.extend({

  className: 'Toggle',

  events: {
    'click .js-input': '_onClick'
  },

  initialize: function (opts) {
    if (!opts.collection) throw new Error('Collection should be provided');
    if (!opts.editorModel) throw new Error('editorModel should be provided');

    this.listenTo(this.collection, 'change', this.render);
    this.add_related_model(this.collection);

    this._editorModel = opts.editorModel;
    this._labelsArray = opts.labels;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var checked = this.collection.at(1).get('selected');
    var _template = template({
      labels: this._labelsArray,
      checked: checked
    });

    this.$el.append(_template);
    return this;
  },

  _onClick: function () {
    if (this.$('.js-input').prop('checked')) {
      this._editorModel.set({edition: true});
      this.collection.at(1).set({selected: true});
    } else {
      this._editorModel.set({edition: false});
      this.collection.at(0).set({selected: true});
    }

    this.collection.trigger('toggle');
  }
});
