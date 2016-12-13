var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../views/base_dialog/view');
var ViewFactory = require('../../view_factory');
var FormView = require('./edit_vis_form_view');
var EditVisMetadataModel = require('./edit_vis_metadata_dialog_model');
var randomQuote = require('../../view_helpers/random_quote');
var _ = require('underscore-cdb-v3');


/**
 *  Edit visualization (dataset or map) dialog
 *
 */
module.exports = BaseDialog.extend({

  events: BaseDialog.extendEvents({
    'click .js-back': '_showForm'
  }),

  className: 'Dialog is-opening EditVisMetadata',

  initialize: function() {
    this.elder('initialize');

    if (!this.options.vis) {
      throw new TypeError('vis model is required');
    }

    this.vis = this.options.vis;
    this.user = this.options.user;
    this.dataLayer = this.options.dataLayer;
    this.model = new EditVisMetadataModel({}, {
      vis: this.vis,
      dataLayer: this.dataLayer,
      user: this.user
    });
    this.template = cdb.templates.getTemplate('common/dialogs/edit_vis_metadata/edit_vis_metadata_dialog');
  },

  render: function() {
    this.clearSubViews();
    BaseDialog.prototype.render.call(this);
    this.$('.content').addClass('Dialog-content--expanded');
    this._initViews();
    return this;
  },

  render_content: function() {
    var visType = this.vis.isVisualization() ? 'map' : 'dataset';
    return this.template({
      visType: visType,
      visTypeCapitalized: visType.charAt(0).toUpperCase() + visType.slice(1),
      isNameEditable: this.model.isNameEditable(),
      isMetadataEditable: this.model.isMetadataEditable()
    });
  },

  _initViews: function() {
    // Panes
    this._panes = new cdb.ui.common.TabPane({
      el: this.$('.js-content')
    });

    // Create form
    var form = new FormView({
      el: this.$('.js-form'),
      model: this.model,
      user: this.user,
      maxLength: this.options.maxLength
    });

    form.bind('onPrivacy', this._showPrivacy, this);
    form.bind('onSubmit', this._saveAttributes, this);
    this._panes.addTab('form', form.render());

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

  _saveAttributes: function() {
    var self = this;
    var newAttrs = _.omit(this.model.toJSON(), 'privacy');
    var oldAttrs = {
      name: this.vis.get('name'),
      description: this.vis.get('description'),
      tags: this.vis.get('tags')
    };
    if (this.model.isDataset()) {
      oldAttrs.source = this.vis.get('source');
      oldAttrs.attributions = this.vis.get('attributions');
      oldAttrs.license = this.vis.get('license');
    }

    if (!_.isEmpty(this.vis.changedAttributes(newAttrs))) {
      this._panes.active('loading');
      this.vis.save(newAttrs,{
        success: function() {
          self.options.onDone && self.options.onDone(oldAttrs.name !== newAttrs.name);
          self.hide();
        },
        error: function() {
          self.vis.set(oldAttrs);
          self._panes.active('error');
        }
      })
    } else {
      this.hide();
    }
  },

  _showPrivacy: function() {
    this.options.onShowPrivacy && this.options.onShowPrivacy();
    this.hide();
  },

  _showForm: function() {
    this._panes.active('form');
  }

});
