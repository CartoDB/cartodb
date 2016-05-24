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
    var checked = this.collection.at(1).get('selected');

    this.$el.html(
      template({
        labels: this._labelsArray,
        checked: checked
      })
    );
    return this;
  },

  _onClick: function () {
    if (this.$('.js-input').prop('checked')) {
      this.collection.at(1).set({selected: true});
      this._editorModel.set({edition: true});
    } else {
      this.collection.at(0).set({selected: true});
      this._editorModel.set({edition: false});
    }

    this.collection.trigger('toggle');
  }
});
