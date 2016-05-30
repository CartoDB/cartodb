var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');

var RampListView = require('./ramp-list-view');

var DEFAULT_RAMP = {
  '3': ['#FFFFFF', '#999999', '#000000'],
  '4': ['#FFFFFF', '#BFBFBF', '#8F8F8F', '#000000'],
  '5': ['#FFFFFF', '#CCCCCC', '#A3A3A3', '#828282', '#000000'],
  '6': ['#FFFFFF', '#D6D6D6', '#B4B4B4', '#979797', '#7F7F7F', '#000000'],
  '7': ['#FFFFFF', '#DBDBDB', '#BCBCBC', '#A1A1A1', '#8A8A8A', '#777777', '#000000']
};

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    this._bins = this.model.get('categories').length;
    this._showSearch = opts.showSearch || false;
    this._typeLabel = opts.typeLabel;

    this._rampList = new Backbone.Collection();

    var ramp = _.map(this.model.get('categories'), function (category) {
      return category.color;
    }, this);

    this._rampList.add({ name: 'test', val: ramp }); // TODO: remove name param?

    this._initViews();
  },

  render: function () {
    this.$el.append(this._rampListView.render().$el);
    return this;
  },

  _initViews: function () {
    this._rampListView = new RampListView({
      model: this.model,
      isCustomizable: this.options.isCustomizable,
      bins: this._bins,
      customRampLists: this._rampList,
      showSearch: this._showSearch,
      typeLabel: this.typeLabel
    });

    this._rampListView.bind('selectItem', this._onSelectItem, this);

    this._rampListView.bind('customize', function () {
      var item = this._rampList.add({ name: 'test', val: this._getDefaultRamp() }); // TODO: name param
      this.trigger('selectItem', item.get('val'), this);
    }, this);
  },

  _getDefaultRamp: function () {
    return _.map(DEFAULT_RAMP[this._bins], function (color) {
      return color;
    }, this);
  },

  _onSelectItem: function (item) {
    this.trigger('selectItem', item.get('val'), this);
  }
});
