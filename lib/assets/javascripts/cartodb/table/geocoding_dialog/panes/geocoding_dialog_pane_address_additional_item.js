
  /**
   *  Items for additional columns within geocoding
   *  address panel.
   *
   */


  cdb.admin.GeocodingDialog.Pane.Address.Additional.Item = cdb.core.View.extend({

    tagName: 'li',

    _TEXTS: {
      placeholder:  _t('Select column or type it')
    },

    initialize: function() {
      this.template = cdb.templates.getTemplate('table/views/geocoding_dialog/geocoding_dialog_pane_address_additional_item');
    },

    render: function() {
      this.$el.append(this.template( this.model.attributes ));

      this._initViews();

      return this;
    },

    _initViews: function() {
      var select = new cdb.forms.CustomTextCombo({
        model:        this.model,
        property:     'columnValue',
        text:         'columnText',
        width:        '176px',
        placeholder:  this._TEXTS.placeholder,
        extra:        this.options.columns_list
      });

      this.$('.geocoding-pane-select').append(select.render().el);
      this.addView(select);
    }

  });