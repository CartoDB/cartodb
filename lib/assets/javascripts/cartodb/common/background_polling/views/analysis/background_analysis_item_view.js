var cdb = require('cartodb.js');
var ViewFactory = require('../../../view_factory');

/**
 *  
 *
 */

module.exports = cdb.core.View.extend({

  className: 'ImportItem',
  tagName: 'li',

  events: {
    'click .js-abort':      '_removeItem'
    // 'click .js-show_error': '_showImportError',
    // 'click .js-show_stats': '_showImportStats',
    // 'click .js-close':      '_removeItem'
  },

  initialize: function() {
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('common/background_polling/views/analysis/background_analysis_item');
    this._initBinds();
  },

  render: function() {
    var totalItems = this.collection.getTotalAnalysis();
    var totalAnalyzed = this.collection.getCompletedAnalysis();

    console.log(totalItems, totalAnalyzed);

    var d = {
      totalItems: totalItems,
      totalAnalyzed: totalAnalyzed,
      progress: (totalAnalyzed / totalItems) * 100
    };

    this.$el.html(this.template(d));

    return this;
  },

  _initBinds: function() {
    this.collection.bind('change:state', this.render, this);
    this.collection.bind('remove', this.render, this);
  },

  _removeItem: function() {
    this.trigger('remove', this.collection, this);
    this.clean();
  }

  // _showImportStats: function() {
  //   (new TwitterImportDetailsDialog({
  //     clean_on_hide: true,
  //     user: this.user,
  //     model: this.model
  //   })).appendToBody();
  // },

  // _showImportError: function() {
  //   var dialog = ViewFactory.createDialogByView(
  //     new ErrorDetailsView({
  //       err: this.model.getError(),
  //       user: this.user
  //     })
  //   );
  //   dialog.appendToBody();
  // }

});
