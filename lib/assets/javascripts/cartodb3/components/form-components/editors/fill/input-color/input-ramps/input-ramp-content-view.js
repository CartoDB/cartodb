var CoreView = require('backbone/core-view');
var template = require('./input-ramp-content-view.tpl');
var RampListView = require('./input-ramp-list-view');

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack',
    'click .js-quantification': '_onClickQuantification',
    'click .js-bins': '_onClickBins'
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var view = new RampListView({
      model: this.model,
      bins: this.model.get('bins'),
      showSearch: false
    });

    this.$el.append(template({
      bins: this.model.get('bins'),
      attribute: this.model.get('attribute'),
      quantification: this.model.get('quantification')
    }));

    view.on('selectItem', function (item) {
      this.trigger('selectItem', item);
    }, this);

    this.$('.js-content').append(view.render().$el);

    return this;
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  _onClickQuantification: function (e) {
    this.killEvent(e);
    this.trigger('selectQuantification', this);
  },

  _onClickBins: function (e) {
    this.killEvent(e);
    this.trigger('selectBins', this);
  }
});
