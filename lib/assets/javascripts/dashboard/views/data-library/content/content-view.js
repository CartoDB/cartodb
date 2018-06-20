const CoreView = require('backbone/core-view');
const randomQuote = require('builder/components/loading/random-quote');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'collection',
  'model',
  'template'
];
/*
 *  Content result default view
 */

module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    this.$el.html(this._template({
      defaultUrl: '',
      page: this._collection.options.get('page'),
      isSearching: this._model.get('is_searching'),
      tag: this._collection.options.get('tags'),
      q: this._collection.options.get('q'),
      quote: randomQuote(),
      type: this._collection.options.get('type'),
      totalItems: this._collection.size(),
      totalEntries: this._collection.total_entries,
      msg: ''
    }));

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._collection, 'change remove add reset', this.render);
  }
});
