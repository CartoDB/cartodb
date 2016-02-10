var cdb = require('cartodb.js');
var template = require('./stack-layout.tpl');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!this.collection || !this.collection.size()) {
      throw new Error('A collection of stack views should be provided');
    }
    this.model = new cdb.core.Model({
      position: 0,
      currentView: null
    });
    this.template = this.options.template || template;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(this.template());
    this._genNewStackViewByPos(0);
    return this;
  },

  _nextStep: function () {
    var currentPos = this.model.get('position');
    var stackSize = this.collection.size();
    var nextPos = ++currentPos;

    if (nextPos >= stackSize) {
      throw new Error('There is no ' + nextPos + ' stack view in the collection');
    }

    this._removeOldStackView();
    this._genNewStackViewByPos(nextPos, arguments);
  },

  _prevStep: function () {
    var currentPos = this.model.get('position');
    var prevPos = --currentPos;

    if (prevPos < 0) {
      throw new Error('There is no ' + prevPos + ' stack view in the collection');
    }

    this._removeOldStackView();
    this._genNewStackViewByPos(prevPos, arguments);
  },

  _removeOldStackView: function () {
    var oldView = this.model.get('currentView');
    if (oldView) {
      oldView.clean();
      this.removeView(oldView);
    }
  },

  _genNewStackViewByPos: function (pos, args) {
    var nextView = this.collection.at(pos).get('createStackView').apply(this, [this._nextStep.bind(this), this._prevStep.bind(this)].concat(args));
    this.$('.js-current').html(nextView.render().el);
    this.addView(nextView);
    this.model.set({
      position: pos,
      currentView: nextView
    });
  }

});
