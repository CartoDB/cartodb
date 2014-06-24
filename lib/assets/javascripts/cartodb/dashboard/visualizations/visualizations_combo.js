
  /**
   *  Visualizations combo for new Visualization dialog
   *
   */

  cdb.admin.VisualizationsCombo = cdb.forms.Combo.extend({

    _ITEM_TEMPLATE: _t(' \
      <div class="vis-info-item <%= username ? "shared" : "" %>">\
        <div class="value" title="<%= id %>" alt="<%= id %>"><%= id %></div>\
        <% if (username) { %>\
          <div class="by">\
            <% if (permission) { %>\
              <span class="permission round grey"><%= permission %></span>\
            <% } %>\
            <span class="username">by <%= username %></span>\
            <% if (avatar) { %>\
              <img class="avatar" src="<%= avatar %>" title="<%= username %>" alt="<%= username %>"/>\
            <% } %>\
          </div>\
        <% } %>\
      </div>\
    '),

    options: {
      minimumResultsForSearch: 20,
      placeholder: '',
      formatResult: true,
      matcher: true,
      dropdownCssClass: 'visualizations-combo'
    },

    initialize: function() {
      cdb.forms.Combo.prototype.initialize.call(this);
      _.bindAll(this, "_onUpdate", "_changeSelection", "_formatResult");
    },

    _getOptions: function() {
      var options = _.map(this.data, function(option) {
        if (option.username) {
          return '<option data-vis_id="' + option.vis_id + '" data-permission="'+ option.permission + '" data-name="' + option.name + '" ' + 
          '" data-avatar="' + option.avatar + '" data-username="' + option.username + '">' + option.name + '</option>';
        } else {
          return '<option>' + option.name + '</option>';
        }
      }).join("");

      if (this.options.placeholder) options = "<option></option>" + options;

      return options;
    },

    _formatResult: function(data) {
      var d = $(data.element).data();
      d.id = data.id;
      return  _.template(this._ITEM_TEMPLATE)(d)
    },

    _matcher: function(term, text, option) {
      var val = $(option).val();
      return val.toUpperCase().indexOf(term.toUpperCase())>=0;
    }

  });