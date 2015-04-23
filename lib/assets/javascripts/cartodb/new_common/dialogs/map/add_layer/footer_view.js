var $ = require('jquery');
var cdb = require('cartodb.js');
var TypeGuessingTogglerView = require('../../create/footer/type_guessing_toggler_view');

/**
 * Footer view for the add layer modal.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-ok': '_finish'
  },

  initialize: function() {
    this.elder('initialize');
    this._template = cdb.templates.getTemplate('new_common/dialogs/map/add_layer/footer');
    this._typeGuessingTogglerView = new TypeGuessingTogglerView({
      model: this.model
    });
    this._initBinds();
  },

  // implements cdb.ui.common.Dialog.prototype.render
  render: function() {
    this.clearSubViews();

    var $el = $(
      this._template({
        canFinish: this.model.canFinish(),
        listing: this.model.get('listing')
      })
    );
    $el.find('.js-footer-info').append(this._typeGuessingTogglerView.render().el);
    this.$el.html($el);

    return this;
  },

  _initBinds: function() {
    this.model.upload.bind('change', this.render, this);
    this.model.bind('change:listing', this._update, this);
    this.model.selectedDatasets.bind('all', this._update, this);
  },

  _update: function() {
    switch (this.model.get('listing')) {
      case 'scratch':
        this.hide();
        break;
      default:
        this.render().show();
    }
  },

  _finish: function(e) {
    this.killEvent(e);
    if (this.model.canFinish()) {
      this.model.finish();
    }
  }

});
