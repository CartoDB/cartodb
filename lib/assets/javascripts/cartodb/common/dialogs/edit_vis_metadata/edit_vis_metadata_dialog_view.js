var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');
var _ = require('underscore');


/**
 *  Edit visualization (dataset or map) dialog
 *
 */


module.exports = BaseDialog.extend({

  events: function() {
    return _.extend({}, BaseDialog.prototype.events, {
      'click .js-back': '_showForm'
    });
  },

  className: 'Dialog is-opening EditMetadata',

  initialize: function() {
    this.elder('initialize');

    if (!this.options.vis) {
      throw new TypeError('vis model is required');
    }

    this.vis = this.options.vis;
    this.user = this.options.user;
    this._template = cdb.templates.getTemplate('common/dialogs/edit_vis_metadata/edit_vis_metadata_dialog');
  },

  render: function() {
    this.clearSubViews();
    BaseDialog.prototype.render.call(this);
    this.$('.content').addClass('Dialog-content--expanded');
    this._initViews();
    return this;
  },

  render_content: function() {
    return this._template({
      visType: this.vis.isVisualization() ? 'map' : 'dataset'
    });
  },

  _initViews: function() {
    var self = this;

    // Panes
    this._panes = new cdb.ui.common.TabPane({
      el: this.$('.js-content')
    });

    // Create form
    // var form = new FormView({
    //   el: this.$('.js-form'),
    //   vis: this.vis,
    //   row: this.row
    // });

    // form.bind('onSubmit', this._changeAttributes, this);
    // form.bind('onError', this._scrollToError, this);
    // this._panes.addTab('form', form.render());

    // Create loading
    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Saving new data...',
        quote: randomQuote()
      }).render()
    );

    // Create error
    this._panes.addTab('error',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: 'Sorry, something went wrong but you can get <button class="Button--link js-back">back to the form</button>.'
      }).render()
    );

    this._panes.active('form');
  },

  _showForm: function() {
    this._panes.active('form');
  },

  _ok: function() {
    this.options.done && this.options.done();
    this.elder('_ok');
  },

  _cancel: function() {
    this.options.done && this.options.done();
    this.elder('_cancel');
  }

});