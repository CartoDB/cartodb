/**
   *  Advanced combo with extra parameters
   *
   */

  cdb.forms.ColumnTypeCombo = cdb.forms.Combo.extend({

    options: {
      minimumResultsForSearch: 20,
      placeholder: '',
      formatResult: true,
      matcher: true,
      dropdownCssClass: 'column-type'
    },

    _formatResult: function (data, label, query) {
      // Titlecase column name if synced table
      var name = '';
      if (data.alias) {
        name = data.alias;
      } else {
        name = data.id.slice();
      }

      // if (table.table.get('synchronization') && table.table.get('synchronization').from_external_source){
      //   name = Sugar.String.titleize(name);
      // }

      return '<span class="value">' + name + '</span>';
    },

    _matcher: function (term, text, option) {
      var val = $(option).val();
      var val_alias = $(option).attr('alias');

      return (val.toUpperCase().indexOf(term.toUpperCase()) >= 0 || val_alias.toUpperCase().indexOf(term.toUpperCase()) >= 0);
    }
  });
