var cdb = require('cartodb.js');
var EditionToggleView = require('../../../../components/edition-toggle/edition-toggle-view');

module.exports = cdb.core.View.extend({
  render: function () {
    this.$el.html("buti bienvenido");
    this._initViews();
    return this;
  },

  _initViews: function () {
    var editionView = new EditionToggleView({});
    this.$el.append(editionView.render().el);
  }
});
