var $ = require('jquery');
var CoreView = require('backbone/core-view');
var TableHeadItemView = require('./table-head-item-view');
var template = require('./table-head.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'columnsCollection',
  'tableViewModel',
  'queryGeometryModel',
  'canHideColumns',
  'modals'
];

/*
 *  Main table head view
 */
module.exports = CoreView.extend({
  className: 'Table-head',
  tagName: 'table',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._lastHeadItemView = null;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.append(template());
    this._columnsCollection.each(this._renderColumnHead, this);
    return this;
  },

  _initBinds: function () {
    this._queryGeometryModel.bind('change:simple_geom', this.render, this);
    this.add_related_model(this._queryGeometryModel);
    this._tableViewModel.bind('change:sort_order change:order_by', this.render, this);
    this.add_related_model(this._tableViewModel);
    this._columnsCollection.bind('reset', function () {
      this.render();

      if (this._newColumn) {
        var scrollWidth = this.$el.get(0).scrollWidth;

        setTimeout(function () {
          this._scrollToLeft({
            pos: scrollWidth
          });
          this._focusLastHeadItem();
        }.bind(this), 500);

        delete this._newColumn;
      }
    }, this);
    this._columnsCollection.bind('add', function (model) {
      this._newColumn = model;
    }, this);
    this.add_related_model(this._columnsCollection);
  },

  _renderColumnHead: function (model) {
    var columnName = model.get('name');

    if (!this._tableViewModel.isCustomQueryApplied() && columnName === 'the_geom_webmercator') {
      return;
    }

    if (this._canHideColumns && columnName === 'center' && model.isGeometryColumn()) {
      return;
    }

    var view = new TableHeadItemView({
      model: model,
      modals: this._modals,
      columnsCollection: this._columnsCollection,
      tableViewModel: this._tableViewModel,
      simpleGeometry: this._queryGeometryModel.get('simple_geom')
    });
    this.$('.js-headRow').append(view.render().el);
    this.addView(view);

    this._lastHeadItemView = view;
  },

  _scrollToLeft: function (opts) {
    opts = opts || {};
    $('.Table').animate({
      scrollLeft: opts.pos || 0
    }, opts.speed || 'slow');
  },

  _focusLastHeadItem: function () {
    if (this._lastHeadItemView) {
      this._lastHeadItemView.focusInput();
    }
  }
});
