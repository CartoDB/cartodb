// form validation

var alwaysTrueValidator = function(form) { return true };
var columnExistsValidator = function(form) {
  var field = form.Column;
  return field.form.property.extra.length > 0;
};


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
      var opts = {};
      if (!this.table.previous('schema')) {
        opts.silent = true;
      }
      this._fillColumns(opts);
      if (opts.silent) {
        this._previousAttributes = _.clone(this.attributes);
      }
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
            extra = extra.concat(
              _.without(self.table.columnNamesByType(c[kc]), 'cartodb_id')
            )
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
    return this.validators[type](this.attributes);
  },

  // return true if this form was valid before the current change
  // this method should be only called during a change event
  wasValid: function(type) {
    return this.validators[type](this.previousAttributes());
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
    this._savedStates = {};

    this.cartoStylesGeneration = new cdb.admin.CartoStyles(_.extend({}, 
      this.layer.get('wizard_properties'), {
      table: this.table
    })
    );

    // bind loading and load
    this.cartoStylesGeneration.bind('load', function() { this.trigger('load'); }, this)
    this.cartoStylesGeneration.bind('loading', function() { this.trigger('loading'); }, this) 

    this.table.bind('columnRename', function(newName, oldName) {
      if (this.isDisabled()) return;
      var attrs = {};
      // search for columns
      for(var k in this.attributes) {
        if(this.get(k) === oldName) {
          attrs[k] = newName;
        }
      }
      this.set(attrs);
    }, this);
    // when table schema changes regenerate styles
    // notice this not update properties, only regenerate 
    // the style
    this.table.bind('change:schema', function() {
      if (!this.isDisabled() && this.table.previous('schema') !== undefined) this.cartoStylesGeneration.regenerate();
    }, this);

    this.table.bind('change', function() {
      if(!this.table.changedAttributes()) {
        return;
      }
      var geoTypeChanged = this.table.geometryTypeChanged();
      if(geoTypeChanged) this.trigger('change:form');
      var prev = this.table.previous('geometry_types');
      var current = this.table.geomColumnTypes();
      if((!prev || prev.length === 0) && !this.get('type')) {
        this.active('polygon');
        return;
      }
      if (!current || current.length === 0) return;
      if (!prev || prev.length === 0) return;
      if (geoTypeChanged) {
        this.active('polygon', {}, { persist: false });
      }
    }, this);

    this.linkLayer(this.layer);

    this.bindGenerator();

    // unbind previous form and bind the new one
    this.bind('change:type', this._updateForm);
    this._updateForm();


    // stats
    this.bind('change', function(model, opt) {
      // Send change event for statistical purposes
      this._sendChange(model, opt);
    }, this);

    // generator should be always filled in case sql
    // or table schema is changed
    this._fillGenerator({ silent: true });

  },

  _updateForm: function() {
    //unbind all forms
    for(var k in this.forms) {
      var forms = this.forms[k];
      for(var f in forms) {
        var form = forms[f];
        form.unbind(null, null, this);
      }
    }

    var t = this.get('type');
    if (t) {
      var f = this._form(t);
      f.bind('change', function() {
        if (!f.isValid(this.get('type'))) {
          this.active('polygon');
        }
        if(!f.wasValid(this.get('type'))) {
          if(!this.isDisabled()) {
            // when the form had no column previously
            // that means the wizard was invalid
            this.active(this.get('type'), null, { persist: false });
          }
        }
        this.trigger('change:form');
      }, this);
    }
  },

  _form: function(type, geomType) {
    var form = this.forms[type] || (this.forms[type] = {});
    geomType = geomType || this.table.geomColumnTypes()[0] || 'point';
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

  // save current state
  saveCurrent: function(type, geom) {
    var k = type + "_" + geom;
    this._savedStates[k] = _.clone(this.attributes);
  },

  getSaved: function(type, geom) {
    var k = type + "_" + geom;
    return this._savedStates[k] || {};
  },

  // active a wizard type
  active: function(type, props, opts) {
    opts = _.defaults(opts || {}, { persist: true });

    // if the geometry is undefined the wizard can't be applied
    var currentGeom = this.table.geomColumnTypes()[0];
    if (!currentGeom) {
      return;
    }

    // previously category map was called color. this avoids
    // color wizard is enabled since it's compatible with category
    if (type === "color") type = 'category';

    // if the geometry type has changed do not allow to persist previous
    // properties. This avoids cartocss properties from different 
    // geometries are mixed
    if (this.get('geometry_type') && currentGeom !== this.get('geometry_type')) {
      opts.persist = false;
    }

    // get the default props for current type and use previously saved
    // attributes to override them
    var geomForm = this.defaultStyleForType(type);
    var current = (opts.persist && type === this.get('type')) ? this.attributes: {};
    _.extend(geomForm, this.getSaved(type, currentGeom), current, props);
    geomForm.type = type;
    geomForm.geometry_type = currentGeom;

    // if the geometry is invalid, do not save previous attributes
    var t = this.get('type');
    var gt = this.get('geometry_type');
    if(t && gt && this._form(t, gt).isValid(t)) {
      this.saveCurrent(t, gt);
    }
    this.clear({ silent: true });
    this.cartoStylesGeneration.unset('metadata', {silent: true});
    this.cartoStylesGeneration.unset('properties', { silent: true });
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

  _fillGenerator: function(opts) {
      this.cartoStylesGeneration.set({
        'properties': _.clone(this.attributes),
        'type': this.get('type')
      }, opts);
  },

  _updateGenerator: function() {
      var t = this.get('type');
      var isValid = this._form(t).isValid(t);
      this._fillGenerator({ silent: !isValid});
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
          properties: _.omit(self.attributes, 'type', 'metadata')
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
      var meta = self.cartoStylesGeneration.get('metadata');
      if (meta) {
        self.set('metadata', meta);
      } else {
        self.unset('metadata');
      }
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
    if(parser.errors().length) return {};
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

  // Set description for carto properties when they change
  // (Statistical purposes)
  _EVENTS: {
    'polygon-pattern-file': 'Pattern file chosen for polygon-fill',
    'marker-file':          'Marker file chosen for marker-fill'
  },

  /**
   *  If a cartocss property has changed, it will
   *  send an event if it was previously defined.
   */
  _sendChange: function(m, c) {
    if (!c || c.unset) return false;

    var self = this;
    _.each(m.changedAttributes(), function(v ,p) {
      if (v && self._EVENTS[p]) {
        cdb.god.trigger('mixpanel', self._EVENTS[p], { value: m.get(p) });
      }
    });
  }

});
