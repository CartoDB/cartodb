var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var ColumnSelectorView = require('./column_selector_view');
var randomQuote = require('../../view_helpers/random_quote');

/**
 * View to select an individual column.
 * The selector type is passed to the child view of class ColumnSelectorView.
 */
module.exports = cdb.core.View.extend({

  className: 'List',

  events: {
    'click .js-select-all': '_onClickSelectAll',
    'click': 'killEvent'
  },

  initialize: function() {
    this.model = new cdb.core.Model({
      showSelectAllToggle: this.options.selectorType === 'switch' || false,
      enforceSingleSelected: this.options.selectorType === 'radio' || false,
      loading: this.options.loading
    });
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html('');

    if (this.collection.length > 0) {
      var chain = this.collection.chain();
      if (this.options.excludeFilter) {
        chain = chain.reject(this.options.excludeFilter);
      }
      chain.each(this._addColumnSelectorView, this);

      this._renderSelectAllToggle();
    } else if (this.model.get('loading')) {
      this._renderLoading();
    }

    return this;
  },

  _renderLoading: function() {
    this.$el.html(
      this.getTemplate('common/templates/loading')({
        title: 'Fetching ' + this.model.get('loading'),
        quote: randomQuote()
      })
    );
  },

  _addColumnSelectorView: function(model) {
    var view = new ColumnSelectorView(
      _.chain({
        column: model
      })
      .extend(this.options)
      .omit(['el', 'collection'])
      .value()
    );
    this.addView(view);
    this.$el.append(view.render().$el);
  },

  _renderSelectAllToggle: function() {
    if (this.model.get('showSelectAllToggle')) {
      this.$el.append(
        this.getTemplate('common/dialogs/merge_datasets/columns_selector_toggle_all')({
          areAllSelected: this._areAllSelected()
        })
      );
    }
  },

  _initBinds: function() {
    this.collection.bind('reset', this.render, this);
    this.collection.bind('change:selected', this._onChangeSelected, this);
    this.add_related_model(this.collection);

    this.model.bind('change:loading', this.render, this);
  },

  _onChangeSelected: function(model, isSelected) {
    if (isSelected && this.model.get('enforceSingleSelected')) {
      this._unselectAllExcept(model);
      this.collection.sort();
      this.render(); // to re-render with new sort order
    }
    this.$('.js-select-all input').prop('checked', this._areAllSelected());
  },

  _unselectAllExcept: function(exceptionModel) {
    this.collection.each(function(m) {
      if (m !== exceptionModel) {
        m.set('selected', false);
      }
    });
  },

  _onClickSelectAll: function() {
    var invertedAllSelected = !this._areAllSelected();
    this.collection.chain()
    .reject(function(m) {
      return m.get('disabled');
    })
    .each(function(m) {
      m.set('selected', invertedAllSelected);
    });
  },

  _areAllSelected: function() {
    return this.collection.all(function(m) {
      return m.get('selected');
    });
  }

});
