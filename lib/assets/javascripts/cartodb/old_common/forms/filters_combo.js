
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

    _formatResult: function(data) {
      return  '<span class="value">' + data.id + '</span>'
    },

    _matcher: function(term, text, option) {
      var val = $(option).val();
      return val.toUpperCase().indexOf(term.toUpperCase())>=0;
    }

  });
