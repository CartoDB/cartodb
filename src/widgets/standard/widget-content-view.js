var _ = require('underscore');
var cdb = require('cartodb.js');
var contentTemplate = require('./widget-content-template.tpl');
var placeholderTemplate = require('./widget-placeholder-template.tpl');

/**
 * Default widget content view:
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-body',

  initialize: function () {
    this._dataviewModel = this.model.dataviewModel;

    // TODO inheritance strikes again; this should always be called, but some views override _initBinds,
    // so make sure this is always called
    this.model.bind('change:title', this.render, this);
    this.model.bind('change:collapsed', this._onCollapsedChange, this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    var data = this._dataviewModel.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;
    this.$el.html(
      contentTemplate({
        title: this.model.get('title'),
        itemsCount: !isDataEmpty ? data.length : '-'
      })
    );

    if (isDataEmpty) {
      this._addPlaceholder();
    }

    return this;
  },

  _initBinds: function () {
    this._dataviewModel.bind('change:data', this.render, this);
    this.add_related_model(this._dataviewModel);
  },

  _onCollapsedChange: function (m, isCollapsed) {
    this._dataviewModel.set('enabled', !isCollapsed);
  },

  _addPlaceholder: function () {
    if (placeholderTemplate) {
      this.$('.js-content').append(placeholderTemplate());
    } else {
      cdb.log.info("Placeholder template doesn't exist");
    }
  }
});
