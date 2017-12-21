var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var randomQuote = require('../../view_helpers/random_quote.js');
var ErrorDetailsView = require('../../views/error_details_view');

/**
 * View for the last step of all merge kinds, creates the actual merged table.
 * TODO: taken from old code, cdb.admin.MergeTableDialog.merge, could this be done in a better way?
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    _.bindAll(this, '_onMergeSuccess', '_onMergeError');
    this._startMerge();
  },

  render: function() {
    this.$el.html(
      this.getTemplate('common/templates/loading')({
        title: 'Merging datasets and generating the new one…',
        quote: randomQuote()
      })
    );
    return this;
  },

  _startMerge: function() {
    // TODO: taken from old code, cdb.admin.MergeTableDialog.merge
    //   could this be done in a better way?
    $.ajax({
      type: 'POST',
      url: cdb.config.prefixUrl() + '/api/v1/imports',
      data: {
        table_name: this.model.get('tableName') + '_merge',
        sql: this.model.get('sql')
      },
      success: this._onMergeSuccess,
      error: this._onMergeError
    });
  },

  _onMergeSuccess: function(r) {
    var imp = this.importation = new cdb.admin.Import({
      item_queue_id: r.item_queue_id
    });
    this.add_related_model(imp);

    // Bind complete event
    imp.bind('importComplete', function() {
      imp.unbind();
      window.location.href = cdb.config.prefixUrl() + "/tables/" + (imp.get("table_name") || imp.get("table_id")) + "/";
    }, this);

    var self = this;
    imp.bind('importError', function(e) {
      self._showError(
        e.attributes.error_code,
        e.attributes.get_error_text.title,
        e.attributes.get_error_text.what_about,
        e.attributes.item_queue_id
      );
    }, this);
    imp.pollCheck();
  },

  _onMergeError: function(e) {
    try {
      this._showError(
        e.attributes.error_code,
        e.attributes.get_error_text.title,
        e.attributes.get_error_text.what_about,
        e.attributes.item_queue_id
      );
    } catch(err) {
      this._showError('99999', 'Unknown', '');
    }
  },

  //Show the error when duplication fails
  _showError: function(number, title, what_about, item_queue_id) {
    var view = new ErrorDetailsView({
      err: {
        error_code: number,
        title: title,
        what_about: what_about,
        item_queue_id: item_queue_id
      },
      user: this.model.get('user')
    });
    this.addView(view);
    this.$el.html(view.render().el);
  }

});
