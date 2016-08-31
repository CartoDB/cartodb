/**
 * Simple wizard. Acts as a base class for the different wizards
 */
cdb.admin.mod.SimpleWizard = cdb.core.View.extend({

  // modules available when this wizard is enabled
  MODULES: ['infowindow', 'legends'],


  initialize: function() {
    var self = this;
    this.cartoProperties = this.options.wizard_properties;
    this.type = this.type || 'polygon';

    this.add_related_model(this.cartoProperties);
    this.add_related_model(this.options.table);

    var proxyModel = new Backbone.Model();
    proxyModel.set(this.cartoProperties.attributes);

    var signalDisabled = false;
    this.cartoProperties.bind('change', function() {
      signalDisabled = true;
      proxyModel.set(this.cartoProperties.attributes);
      signalDisabled = false;
    }, this);

    proxyModel.bind('change', function() {
      if(proxyModel.changed["marker-fill"]){
        proxyModel.unset("marker-file");
        this.cartoProperties.unset("marker-file");
      }
      if (signalDisabled) return;
      this.cartoProperties.enableGeneration();
      this.cartoProperties.set(proxyModel.attributes);
    }, this);

    //TODO: change this when table support more than one geom type
    this.form = new cdb.forms.Form({
      form_data: this.cartoProperties.formData(this.type),
      model: proxyModel
    });
    this.addView(this.form);

    this._bindChanges();

    this.cartoProperties.bind('change:form', function() {
      this.form.updateForm(this.cartoProperties.formData(this.type));
      this.render();
    }, this);
  },

  _generateSQL: function() {
    return null;
  },

  isValid: function() {
    return true;
  },

  _bindChanges: function() {
    var self = this;

    this.cartoProperties.bind('change:text-name', this.showTextFields, this);
    this.cartoProperties.bind('change:text-allow-overlap', function(m, overlap) {
      // Overlap value is being returned as String, not as Boolean, seems like
      // custom selector transforms values to String always :_(
      this.cartoProperties.set({
        'text-placement-type': overlap === "true" ? 'dummy' : 'simple',
        'text-label-position-tolerance': overlap === "true" ? 0 : 10
      });
    }, this);
    this.cartoProperties.bind('change:marker-width', function(m, width) {
      if (this.cartoProperties.has('text-dy')) {
        this.cartoProperties.set('text-dy', -width);
      }
    }, this);

  },

  showTextFields: function() {

    var self = this;
    var v = self.form.getFieldByName('Label Font');

    if (!v) return;

    var vhalo       = self.form.getFieldByName('Label Halo');
    var voffset     = self.form.getFieldByName('Label Offset');
    var field       = self.form.getFieldByName('Label Text');
    var voverlap    = self.form.getFieldByName('Label Overlap');
    var vplacement  = self.form.getFieldByName('Label Placement');
    var tn = self.cartoProperties.get('text-name');
    if (!tn || tn === 'None') {
      v && v.hide();
      vhalo && vhalo.hide();
      voffset && voffset.hide();
      voverlap && voverlap.hide();
      vplacement && vplacement.hide();
      field.removeClass("border");
    } else {
      v && v.show();
      vhalo && vhalo.show();
      voffset && voffset.show();
      voverlap && voverlap.show();
      vplacement && vplacement.show();
      field.addClass("border");
    }

  },

  _unbindChanges: function() {
    this.cartoProperties.unbind(null, null, this);
  },

  render: function() {

    var $wrapper = $("<div>").addClass("wrapper")
    , $content = $("<div>").addClass("content");

    $content.append(this.form.render().el);
    $wrapper.append($content);

    // Remove old custom scroll
    if (this.custom_scroll) {
      this.removeView(this.custom_scroll);
      this.custom_scroll.clean();
    }

    // Add new custom scroll
    this.custom_scroll = new cdb.admin.CustomScrolls({
      el:     $wrapper,
      parent: $wrapper.parent()
    });

    this.addView(this.custom_scroll);

    this.$el.html($wrapper);
    this.showTextFields();

    return this;
  },

  // The safeHtml is rendered as-is, so called is responsibile for sanitizing content before calling this method
  renderError: function(safeHtml) {
    var $wrapper =    $("<div>").addClass("wrapper")
    , $no_columns = $("<div>").addClass("no_content").html(safeHtml);

    $wrapper.append($no_columns);
    this.$el.html($wrapper);
  },

  /**
  * search inside the source fields for the field by name.
  * Returns the field
  */
  _searchFieldByName: function(name) {
    return _.find(this.options.form || this.geomForm, function(f) {
      return f.name === name;
    });
  },

  /**
  *  Get number columns without cartodb_id
  */
  _getNumberColumns: function() {
    return _.filter(this.options.table.columnNamesByType('number'), function(c) {
      return c != "cartodb_id"
    });
  },

  _getColumns: function() {
    return _.filter(this.options.table.columnNames(), function(c) {
      return c != "cartodb_id";
    });
  },

  /**
  *  Get number, boolean and string columns without system columns
  */
  _getColorColumns: function() {
    var self = this;
    var columns = [];
    var sc = this.options.table.get('schema')
    _.each(sc, function(c) {
      if (!_.contains(self.options.table.hiddenColumns, c[0]) && c[1] != "date" && c[1] != "geometry") {
        columns.push(c[0])
      }
    });
    return columns;
  }

});
