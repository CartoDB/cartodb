var Backbone = require('backbone');
var _ = require('underscore');
var syncAbort = require('../backbone/sync-abort');

/*
  Base model for a legend. It should have a reference to a layerDefinitionModel.
 */
module.exports = Backbone.Model.extend({
  defaults: {
    type: 'none',
    title: '',
    postHTMLSnippet: '',
    preHTMLSnippet: ''
  },

  sync: syncAbort,

  parse: function (r) {
    var attrs = _.extend({},
      _.omit(r, 'created_at', 'updated_at', 'definition', 'pre_html', 'post_html')
    );

    attrs.preHTMLSnippet = r.pre_html;
    attrs.postHTMLSnippet = r.post_html;
    return attrs;
  },

  urlRoot: function () {
    var baseUrl = this.configModel.get('base_url');
    return baseUrl + '/api/v3/viz/' + this.vizId + '/layer/' + this.layerDefinitionModel.id + '/legends';
  },

  initialize: function (attrs, opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.vizId) throw new Error('vizId is required');

    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.configModel = opts.configModel;
    this.vizId = opts.vizId;
  },

  getStyles: function () {
    return this.layerDefinitionModel && this.layerDefinitionModel.styleModel || null;
  },

  fetch: function () {
    throw new Error('This model should not make any fetch calls. It should be created from the vizJSON.');
  },

  getType: function () {
    return this.get('type');
  },

  toJSON: function () {
    return _.extend(
      this.attributes,
      {
        type: this.getType()
      }
    );
  },

  getAttributes: function () {
    return _.extend(
      {},
      _.pick(this.attributes, _.keys(this.defaults)),
      _.omit(this.attributes, 'pre_html', 'post_html')
    );
  },

  hasCustomHtml: function () {
    return false;
  }
});
