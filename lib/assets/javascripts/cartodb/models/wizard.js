// form validation

var alwaysTrueValidator = function(form) { return true };
var columnExistsValidator = function(form) {
  var field = form.get('Column');
  return field.form.property.extra.length > 0;
}


//
// defines a form schema, what fields contains and so on
//
cdb.admin.FormSchema = cdb.core.Model.extend({

  validators: {
    polygon: alwaysTrueValidator,
    intensity: alwaysTrueValidator,
    bubble: columnExistsValidator,
    choropleth: columnExistsValidator,
    color: columnExistsValidator,
    category: columnExistsValidator,
    density: alwaysTrueValidator,
    torque: columnExistsValidator,
  },

  initialize: function() {
    this.table = this.get('table');
    this.unset('table');
    if(!this.table) throw new Error('table is undefined');

    // validate type
    // it should be polygon, bubble or some of the defined wizard types
    var type = this.get('type');
    if(!type) {
      throw new Error('type is undefined');
    }

    // get the default values
    var form_data = this.defaultFor(type);
    if (!form_data) {
      throw new Error('invalid type: ' + type);
    }
    // assign index to be able to compose the order
    form_data.forEach(function(v, i) { v.index = i });
    this.set(_.object(_.pluck(form_data, 'name'), form_data),  { silent: true });
    this._fillColumns();
    this.table.bind('change:schema', function() {
      this._fillColumns();
    }, this);

  },

  toJSON: function() {
    var form_data = _.values(_.omit(this.attributes, 'type'));
    form_data.sort(function(a, b) { return a.index - b.index; });
    return form_data;
  },

  _fillColumns: function(opts) {
    var self = this;
    // lazy shallow copy
    var attrs = JSON.parse(JSON.stringify(this.attributes));
    _.each(attrs, function(field) {
      for (var k in field.form) {
        var f = field.form[k];
        if (f.columns) {
          var c = f.columns.split('|');
          var extra = [];
          if (f.extra_default) extra = f.extra_default.slice();
          for(var kc in c) {
            extra = extra.concat(self.table.columnNamesByType(c[kc]));
          }
          if (!f.value) f.value = extra[0];
          else if (!_.contains(f.value, extra)) {
            f.value = extra[0];
          }
          f.extra = extra;
        }
      }
    });
    this.set(attrs, opts);
  },

  defaultFor: function(type) {
    var form_data = cdb.admin.forms.get(type)[this.table.geomColumnTypes()[0] || 'point'];
    return form_data;
  },

  // return the default style properties
  // based on forms value
  style: function() {
    var default_data = {};
    _(this.attributes).each(function(field) {
      _(field.form).each(function(v, k) {
        default_data[k] =  v.value;
      });
    });
    return default_data;
  },

  isValid: function(type) {
    return this.validators[type](this);
  }

});

cdb.admin.WizardProperties = cdb.core.Model.extend({

  initialize: function() {
    // params
    this.table = this.get('table');
    this.unset('table');
    if(!this.table) throw new Error('table is undefined');

    this.layer = this.get('layer');
    this.unset('layer');
    if(!this.layer) throw new Error('layer is undefined');

    // stores forms for geometrys and type
    this.forms = {};

    this.cartoStylesGeneration = new cdb.admin.CartoStyles(_.extend({}, 
      this.layer.get('wizard_properties'), {
      table: this.table
    })
    );


    // when table schema changes regenerate styles
    // notice this not update properties, only regenerate 
    // the style
    this.table.bind('change:schema', function() {
      if (!this.isDisabled() && this.table.previous('schema') !== undefined) this.cartoStylesGeneration.regenerate();
    }, this);

    this.table.bind('change', function() {
      var geoTypeChanged = this.table.geometryTypeChanged();
      var prev = this.table.previous('geometry_types');
      var current = this.table.geomColumnTypes();
      if (!current || current.length === 0) return;
      if (!prev || prev.length === 0) return;
      if (geoTypeChanged) {
        this.active('polygon');
      }
    }, this);

    this.linkLayer(this.layer);

    this.bindGenerator();

    // unbind previous form and bind the new one
    this.bind('change:type', this._updateForm);
    this._updateForm();

  },

  _updateForm: function() {
    var prev_type = this.previous('type');
    if (prev_type) {
      this._form(prev_type).unbind(null, null, this);
    }
    var t = this.get('type');
    if (t) {
      this._form(t).bind('change', function() {
        this.trigger('change:form');
      }, this);
    }
  },

  _form: function(type) {
    var form = this.forms[type] || (this.forms[type] = {});
    var geomType = this.table.geomColumnTypes()[0] || 'point';
    if (!form[geomType]) {
      form[geomType] = new cdb.admin.FormSchema({
        table: this.table,
        type: type
      });
    }
    return form[geomType];
  },

  formData: function(type) {
    var self = this;
    var form = this._form(type);
    return form.toJSON();
  },

  defaultStyleForType: function(type) {
    return this._form(type).style();
  },

  // active a wizard type
  active: function(type, props) {
    if (type === "color") type = 'category';
    var geomForm = this.defaultStyleForType(type);
    _.extend(geomForm, props);
    geomForm.type = type;
    this.clear({ silent: true });
    this.cartoStylesGeneration.unset('metadata');
    this.set(geomForm);
  },

  // the style generation can be disabled because of a custom style
  isDisabled: function() {
    return this.layer.get('tile_style_custom');
  },

  properties: function(props) {
    if (!props) return this;
    var vars = _.extend(
      { type: props.type },
      props.properties
    );
    return this.set(vars);
  },

  _updateGenerator: function() {
      this.cartoStylesGeneration.set({
        'properties': _.clone(this.attributes),
        'type': this.get('type')
      });
  },

  bindGenerator: function() {
    // every time properties change update the generator
    this.bind('change', this._updateGenerator, this);
  },

  unbindGenerator: function() {
    this.unbind('change', this._updateGenerator, this);
  },

  linkLayer: function(layer) {
    var self = this;

    this.properties(layer.get('wizard_properties'));

    layer.bind('change:wizard_properties', function() {
      if (!_.isEqual(
        layer.previous('wizard_properties'), 
        layer.get('wizard_properties'))
      ) {
      this.properties(layer.get('wizard_properties'));
      }
    }, this);

    this.bind('change', function() {
      layer.attributes.wizard_properties = {
          type: self.get('type'),
          properties: _.omit(self.attributes, 'type')
      };
    }, layer);

    layer.bind('change:tile_style', function() {
      if(this.isDisabled()) {
        this.set(this.propertiesFromStyle(layer.get('tile_style')), { silent: true });
      }
    }, this);

    layer.bind('change:query', function() {
      if(!this.isDisabled()) this.cartoStylesGeneration.regenerate();
    }, this);

    var changeLayerStyle = function(st, sql, layerType) {
      layerType = layerType || 'CartoDB';

      // update metadata from cartocss generation
      self.unbindGenerator();
      self.set('metadata', self.cartoStylesGeneration.get('metadata'));
      self.bindGenerator();

      var attrs = {
        tile_style: st,
        type: layerType,
        tile_style_custom: false
      };

      if(sql) {
        attrs.query_wrapper = sql.replace('__wrapped', '(<%= sql %>)');//"with __wrapped as (<%= sql %>) " + sql;
      } else {
        attrs.query_wrapper = null;
      }
      attrs.query_generated = attrs.query_wrapper !== null;

      // update the layer model 
      layer.save(attrs, { no_override: true });
    };

    // this is the sole entry point where the cartocss is changed.
    this.cartoStylesGeneration.bind('change:style change:sql', function() {
      var st = this.cartoStylesGeneration.get('style');
      if(st) {
        changeLayerStyle(
          st, 
          this.cartoStylesGeneration.get('sql'),
          this.get('layer-type')
        );
      }
    }, this);


  },

  unlinkLayer: function(layer) {
    this.unbind(null, null, layer);
    layer.unbind(null, null, this);
  },

  getEnabledWizards: function() {
    var _enableMap = {
      'point': ['polygon', 'choropleth', 'bubble', 'density', 'category', 'intensity', 'torque'],
      'line':['polygon', 'choropleth', 'category', 'bubble'],
      'polygon': ['polygon', 'choropleth', 'category', 'bubble']
    };
    return _enableMap[this.table.geomColumnTypes()[0] || 'point'];
  },

  //MOVE to the model
  propertiesFromStyle: function(cartocss) {
    var parser = new cdb.admin.CartoParser();
    var parsed = parser.parse(cartocss);
    if (!parsed) return {};
    var rules = parsed.getDefaultRules();
    if(parser.errors().length) return;
    var props = {};
    var t = this.get('type');
    var valid_attrs =_.uniq(_.keys(this.attributes).concat(_.keys(this._form(t).style())));
    if (rules) {
      for(var p in valid_attrs) {
        var prop = valid_attrs[p];
        var rule = rules[prop];
        if (rule) {
          rule = rule.eval();
          if (!tree.Reference.validValue(parser.parse_env, rule.name, rule.value)) {
            return {};
          }
          var v = rule.value.eval(this.parse_env);
          if (v.is === 'color') {
            v = v.toString();
          } else if (v.is === 'uri') {
            v = 'url(' + v.toString() + ')';
          } else {
            v = v.value;
          }
          props[prop] = v;
        }
      }
      return props;
    }
    return {};
  },

});
