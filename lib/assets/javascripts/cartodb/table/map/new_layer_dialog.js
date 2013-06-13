/**
 *  Dialog to add a new layer from any of your
 *  existing tables.
 *
 */

cdb.admin.NewLayerDialog = cdb.admin.BaseDialog.extend({

  _TEXTS: {
    title: _t('Add Layer'),
    description: _t('You can import data to this map or add one of your existing tables.')
  },

  // do not remove
  events: cdb.core.View.extendEvents({}),

  initialize: function() {
    // dialog options
    _.extend(this.options, {
      title: this._TEXTS.title,
      description: this._TEXTS.description,
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: this._TEXTS.title,
      cancel_button_classes: 'margin15',
      modal_type: "creation",
      modal_class: 'new_layer_dialog',
      width: 572
    });
    this.ok = this.options.ok;

    this.tableSelection = new cdb.core.Model();
    this.constructor.__super__.initialize.apply(this);
    this.setWizard(this.options.wizard_option);
    this.tables = new cdb.admin.Tables();
    // Due to an api limitation, it is only posible
    // to get 300 tables per page.
    this.tables.options.set({ per_page:300 });
    this.active = false;
  },

  render_content: function() {
    this.$content = $("<div>");
    var temp_content = this.getTemplate('table/views/new_layer_dialog');

    this.$content.append(temp_content());

    this.tables.fetch();
    this.tables.bind('reset', this._onReset, this);
    this.tables.bind('error', this._onError, this);
    this.add_related_model(this.tables);
    this.disableOkButton();

    return this.$content;
  },

  _onReset: function() {
    this.tables.unbind(null, null, this);

    if (this.tableCombo) this.tableCombo.clean();

    var tableList = this.tables.pluck('name');
    this.result = tableList[0];
    
    this._onComboChange(this.result);
    this.enableOkButton();

    this.tableCombo = new cdb.forms.Combo({
      el: this.$content.find('.tableListCombo'),
      model: this.tableSelection,
      property: "table",
      width: '468px',
      extra: tableList
    });

    this.tableCombo.bind('change', this._onComboChange, this)
    this.tableCombo.render();

    // Show list and hide loader
    this._hideLoader();
    this._showList();
    this._hideError();

    this.active = true;
  },

  _onComboChange: function(table_name) {
    var self = this;
    this.result = table_name;

    // Remove all warnings
    this._hidePrivacyChange();
    this._hideGeoWarning();
    
    // Get table from tables collection
    var table = this.tables.find(function(table){ return table.get('name') == table_name; });
    
    // Check if table has any georeference data and warn the user :S
    var table_metadata = new cdb.admin.CartoDBTableMetadata({ id: table.get('id') });
    table_metadata.fetch({
      success: function(m) {
        // Check if actual table is the same requested
        if (self.result == m.get('name') && m.get('geometry_types').length == 0) {
          self._showGeoWarning();
        }
      }
    });

    // Check if table is private and warn the user that the visualization will turn to private
    if (table.get('privacy').toLowerCase() == "private") {
      this._showPrivacyChange();
    }
  },

  _onError: function() {
    this._hideLoader();
    this._removeList();
    this._showError();
  },

  // toggle views functions

  _showGeoWarning: function() { this.$('p.warning.geo').fadeIn(); },

  _hideGeoWarning: function() { this.$('p.warning.geo').fadeOut(); },

  _showPrivacyChange: function() { this.$('p.warning.privacy').fadeIn(); },

  _hidePrivacyChange: function() { this.$('p.warning.privacy').fadeOut(); },

  _showLoader: function() { this.$('span.loader').fadeIn(); },

  _hideLoader: function() { this.$('span.loader').hide(); },

  _showError: function() { this.$('p.warning.error').fadeIn(); },

  _hideError: function() { this.$('p.warning.error').fadeOut(); },

  _showList: function() { this.$('ul.options').css('opacity', 1); },

  _removeList: function() { this.$('ul.options').remove(); },

  _ok: function(e) {
    if (e) e.preventDefault();

    if (this.active) {
      this.ok && this.ok(this.result);
      this.hide();
    }
  }
});
