var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./area-of-influence-form.tpl');
var DistanceConverter = require('./distance-converter');

var AREA_OF_INFLUENCE_TYPES = {
  buffer: {
    templateData: {
      parametersDataFields: 'type,distance,radius'
    },
    parse: function (attrs) {
      var parsedAttrs = {type: 'buffer'};

      try {
        parsedAttrs.radius = DistanceConverter.toDistance(attrs.radius, attrs.distance);
        parsedAttrs.distance = attrs.distance;
      } catch (err) {
        parsedAttrs.radius = 100;
        parsedAttrs.distance = 'meters';
      }

      return parsedAttrs;
    },
    createSchema: function (m) {
      return {
        source: {
          type: 'Select',
          text: _t('editor.layers.analysis-form.source'),
          options: [ m.get('source') ],
          editorAttrs: { disabled: true }
        },
        type: {
          type: 'Radio',
          text: _t('editor.layers.analysis-form.type'),
          options: [
            {
              val: 'buffer',
              label: _t('editor.layers.analysis-form.distance')
            }, {
              val: 'trade-area',
              label: _t('editor.layers.analysis-form.time')
            }
          ]
        },
        distance: {
          type: 'Radio',
          text: _t('editor.layers.analysis-form.distance'),
          options: _.map(DistanceConverter.OPTIONS, function (d) {
            return {
              val: d.distance,
              label: m.distanceLabel(d.distance)
            };
          })
        },
        radius: {
          type: 'Number',
          label: _t('editor.layers.analysis-form.radius'),
          validators: ['required', {
            type: 'interval',
            min: 1,
            max: 100
          }]
        }
      };
    },
    toNodeAttrs: function (attrs) {
      return _.defaults(
        {
          radius: DistanceConverter.toMeters(attrs.radius, attrs.distance)
        },
        attrs, 'distance'
      );
    }
  },

  'trade-area': {
    templateData: {
      parametersDataFields: 'type,kind,time,isolines,dissolved'
    },
    parse: function (attrs) {
      return {
        type: 'trade-area',
        kind: attrs.kind || 'walk',
        isolines: parseFloat(attrs.isolines) || 1,
        time: parseFloat(attrs.time) || 100,
        dissolved: attrs.dissolved === true
      };
    },
    createSchema: function (m) {
      return {
        source: {
          type: 'Select',
          title: _t('editor.layers.analysis-form.source'),
          options: [ m.get('source') ],
          editorAttrs: { disabled: true }
        },
        type: {
          type: 'Radio',
          title: _t('editor.layers.analysis-form.type'),
          options: [
            {
              val: 'buffer',
              label: _t('editor.layers.analysis-form.distance')
            }, {
              val: 'trade-area',
              label: _t('editor.layers.analysis-form.time')
            }
          ]
        },
        kind: {
          type: 'Select',
          title: _t('editor.layers.analysis-form.by'),
          options: [
            {
              val: 'walk',
              label: _t('editor.layers.analysis-form.by-walk')
            }, {
              val: 'car',
              label: _t('editor.layers.analysis-form.by-car')
            }
          ]
        },
        isolines: {
          type: 'Number',
          title: _t('editor.layers.analysis-form.tracts'),
          validators: ['required', {
            type: 'interval',
            min: 1,
            max: 6
          }]
        },
        time: {
          type: 'Number',
          title: _t('editor.layers.analysis-form.time'),
          validators: ['required', {
            type: 'interval',
            min: 1,
            max: 3600
          }]
        },
        dissolved: {
          type: 'Radio',
          title: _t('editor.layers.analysis-form.boundaries'),
          options: [
            {
              val: 'false',
              label: _t('editor.layers.analysis-form.intact')
            }, {
              val: 'true',
              label: _t('editor.layers.analysis-form.dissolved')
            }
          ]
        }
      };
    },
    toNodeAttrs: function (attrs) {
      return _.defaults(
        {
          dissolved: attrs.dissolved === 'true'
        },
        attrs
      );
    }
  }
};

module.exports = BaseAnalysisFormModel.extend({

  parse: function (attrs) {
    return _.defaults(
      _.pick(attrs, 'id', 'source'), // maintain default attrs
      this._typeDef(attrs.type).parse(attrs)
    );
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._setSchema();

    this.on('change:type', this._updateSchema, this);
  },

  distanceLabel: function (distance) {
    switch (distance) {
      case 'meters':
        return _t('editor.layers.analysis-form.meters');
      case 'kilometers':
        return _t('editor.layers.analysis-form.kilometers');
      case 'miles':
        return _t('editor.layers.analysis-form.miles');
      default:
        return '';
    }
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return this._typeDef().templateData;
  },

  applyChanges: function (nodeDefModel) {
    var attrs = this._typeDef().toNodeAttrs(this.attributes);
    nodeDefModel.clear({silent: true});
    nodeDefModel.set(attrs);
  },

  _updateSchema: function () {
    this._replaceAttrs();
    this._setSchema();
  },

  _setSchema: function () {
    this.setSchema(this._typeDef().createSchema(this));
  },

  _replaceAttrs: function () {
    var attrs = this.parse(this.attributes);
    this.clear({silent: true});
    this.set('type', attrs.type, {silent: true}); // re-set type to avoid change:type event to trigger again
    this.set(attrs);
  },

  _typeDef: function (type) {
    type = type || this.get('type');
    return AREA_OF_INFLUENCE_TYPES[type];
  }

});
