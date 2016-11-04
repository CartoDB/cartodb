var _ = require('underscore');
var Backbone = require('backbone');
var camshaftReference = require('./camshaft-reference');
var QueryGeometryModel = require('./query-geometry-model');
var QuerySchemaModel = require('./query-schema-model');
var nodeIds = require('../value-objects/analysis-node-ids');

/**
 * Base model for an analysis definition node.
 * May point to one or multiple nodes in turn (referenced by ids).
 */
module.exports = Backbone.Model.extend({

  initialize: function (attrs, opts) {
    if (!this.id) throw new Error('id is required');

    var modelOpts = {configModel: opts.configModel};
    var simpleGeom = this.get('simple_geom');
    this.querySchemaModel = new QuerySchemaModel(undefined, modelOpts);
    this.queryGeometryModel = new QueryGeometryModel({
      simple_geom: simpleGeom,
      status: simpleGeom ? 'fetched' : 'unfetched'
    }, modelOpts);

    this.listenTo(this.queryGeometryModel, 'change:simple_geom', this._onGeometryTypeChanged);
  },

  /**
   * @override {Backbone.prototype.parse}  flatten the provided analysis data and create source nodes if there are any.
   */
  parse: function (r, opts) {
    var sourceNames = camshaftReference.getSourceNamesForAnalysisType(r.type);

    var parsedParams = _.reduce(r.params, function (memo, val, name) {
      var sourceName = sourceNames[sourceNames.indexOf(name)];

      if (sourceName) {
        this.collection.add(val, opts);
        memo[name] = val.id;
      } else {
        memo[name] = val;
      }

      return memo;
    }, {}, this);

    var parsedOptions = _.reduce(r.options, function (memo, val, name) {
      memo[name] = val;
      return memo;
    }, {}, this);

    return _.defaults(
      _.omit(r, 'params', 'options'),
      parsedOptions,
      parsedParams
    );
  },

  /**
   * @override {Backbone.prototype.toJSON} unflatten the internal structure to the expected nested JSON data structure.
   * @param {Object} options
   * @param {Boolean} options.skipOptions - Add or not analysis options to the definition
   */
  toJSON: function (options) {
    options = options || {};

    var analysisParams = [];
    var paramsforJSON = {};
    var paramsForType = camshaftReference.paramsForType(this.get('type'));

    // Undo the parsing of the params previously done in .parse() (when model was created)
    for (var name in paramsForType) {
      var param = paramsForType[name];
      var val = this.get(name);

      if (param.type === 'node') {
        var node = this.collection.get(val);
        if (!node) {
          throw new Error('no node found for param "' + name + '" with id "' + val + '" in node ' + JSON.stringify(this.attributes));
        }
        val = node.toJSON(options);
      }

      paramsforJSON[name] = val;

      analysisParams.push(name);
    }

    var json = {
      id: this.get('id'),
      type: this.get('type'),
      params: paramsforJSON
    };

    var optionsAttrs = _.omit(this.attributes, analysisParams.concat('id', 'type', 'status'));
    if (!(options.skipOptions || _.isEmpty(optionsAttrs))) {
      json['options'] = optionsAttrs;
    }

    return json;
  },

  /**
   * @override {Backbone.prototype.isNew} for this.destroy() to work (not try to send DELETE request)
   */
  isNew: function () {
    return true;
  },

  canBeDeletedByUser: function () {
    return this.hasPrimarySource();
  },

  hasFailed: function () {
    return this.get('status') === 'failed';
  },

  isDone: function () {
    return this.get('status') === 'ready';
  },

  destroy: function () {
    if (this.querySchemaModel) {
      this.querySchemaModel.destroy();
      this.querySchemaModel = null;
    }

    return Backbone.Model.prototype.destroy.apply(this, arguments);
  },

  /**
   * Creates a new node that have same params as the current node, with only the id differing.
   * @param {String} newId - e.g. 'b1'
   * @return {Object} instance of analysis-definition-node-model
   */
  clone: function (newId) {
    if (!newId) throw new Error('newId is required');
    if (!_.isString(newId) || newId.length < 2) throw new Error('newId is required as a non-empty string');
    if (newId === this.id) throw new Error('newId must be different from current id, ' + this.id);

    var attrs = this.toJSON();
    attrs.id = newId;
    return this.collection.add(attrs);
  },

  linkedListBySameLetter: function () {
    var list = [this];
    var prev = this;
    var letter = this.letter();

    while (true) {
      var current = prev.getPrimarySource();
      if (current && current.letter() === letter) {
        list.push(current);
        prev = current;
      } else {
        break;
      }
    }

    return list;
  },

  /**
   * @return {Boolean, null} null if the geoemtry type of this node is not known,
   *   this is to indicate that the query model is not ready yet, up to caller to make the call or not
   */
  isValidAsInputForType: function (analysisType) {
    if (analysisType === 'source') return false;

    var geometry = this.queryGeometryModel.get('simple_geom');
    return geometry
      ? camshaftReference.isValidInputGeometryForType(geometry, analysisType)
      : null;
  },

  containsNode: function (other) {
    if (!other) return false;
    return this.id === other.id || this._sourcesContains(other);
  },

  _sourcesContains: function (other) {
    var primarySource = this.getPrimarySource();
    var secondarySource = this.getSecondarySource();
    return !!(
      (primarySource && primarySource.containsNode(other)) ||
      (secondarySource && secondarySource.containsNode(other))
    );
  },

  hasPrimarySource: function () {
    return !!this.getPrimarySource();
  },

  hasSecondarySource: function () {
    return !!this.getSecondarySource();
  },

  getPrimarySource: function () {
    return this.collection.get(this._getPrimarySourceId());
  },

  getSecondarySource: function () {
    // Assumption: there are only 1-2 sources, so secondary is the one that's not the primary
    var primarySourceId = this._getPrimarySourceId();
    var secondarySourceId = _.find(this.sourceIds(), function (sourceId) {
      return sourceId !== primarySourceId;
    });
    return this.collection.get(secondarySourceId);
  },

  /**
   * @return {Array} e.g. ['c3', 'b2']
   */
  sourceIds: function () {
    return _.map(this._sourceNames(), function (sourceName) {
      return this.get(sourceName);
    }, this);
  },

  changeSourceIds: function (currentId, newId, silenty) {
    this._sourceNames().forEach(function (sourceName) {
      if (this.get(sourceName) === currentId) {
        this.set(sourceName, newId, { silent: silenty });
      }
    }, this);
  },

  changeId: function (newId, silently) {
    var oldId = this.id;
    this.id = newId;
    this.set('id', newId, { silent: silently });

    if (silently) {
      delete this.collection._byId[oldId];
      this.collection._byId[newId] = this;
    }
  },

  letter: function () {
    return nodeIds.letter(this.id);
  },

  _getPrimarySourceId: function () {
    var primarySourceName = this.get('primary_source_name') || this._sourceNames()[0];
    return this.get(primarySourceName);
  },

  /**
   * @return {Array} e.g. ['polygons_source', 'points_source']
   */
  _sourceNames: function () {
    return camshaftReference.getSourceNamesForAnalysisType(this.get('type'));
  },

  _onGeometryTypeChanged: function (m, value) {
    this.set('simple_geom', value);
  }

});
