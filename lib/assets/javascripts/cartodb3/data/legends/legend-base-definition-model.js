var Backbone = require('backbone');
var _ = require('underscore');
var syncAbort = require('../backbone/sync-abort');

var CUSTOM_ATTRIBUTES = [
  'title'
];

/*
  Base model for a legend. It should have a reference to a layerDefinitionModel.
 */
module.exports = Backbone.Model.extend({
  defaults: {
    type: 'none',
    title: '',
    rawHTML: '',
    postHTMLSnippet: '',
    preHTMLSnippet: ''
  },

  sync: syncAbort,

  parse: function (r) {
    var attrs = _.extend({},
      _.omit(r, 'created_at', 'updated_at', 'definition', 'pre_html', 'post_html')
    );

    if (r.definition && r.definition.html) {
      attrs.rawHTML = r.definition.html;
    }

    if (r.conf) {
      attrs.customState = r.conf;
    }

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

    this._customState = _.pick(attrs, CUSTOM_ATTRIBUTES);
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
      _.omit(this.attributes, 'pre_html', 'post_html', 'customState')
    );
  },

  setAttributes: function (attrs) {
    // This method is called from the form, so we ensure all attributes come from the user

    var customState = _.reduce(CUSTOM_ATTRIBUTES, function (memo, key) {
      var val = attrs[key];
      if (val != null && val !== '') {
        memo[key] = true;
      } else {
        delete memo[key];
      }
      return memo;
    }, {});

    // Store the real values
    this._customState = _.pick(attrs, CUSTOM_ATTRIBUTES);

    // Set the current custom state to persist it
    var attributes = _.extend(attrs, {
      customState: customState
    });

    this.set(attributes);
  },

  // Overriding set
  set: function (key, val, options) {
    var attrs;
    if (typeof key === 'object') {
      attrs = key;
      options = val;
    } else {
      (attrs = {})[key] = val;
    }

    options || (options = {});

    // Override attributes with the current custom state, removing those attributes that are falsy
    var attributes = _.extend(attrs, _.pick(this._customState, _.identity));

    return Backbone.Model.prototype.set.call(this, attributes, options);
  }
});
