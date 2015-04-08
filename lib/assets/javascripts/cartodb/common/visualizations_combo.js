
  /**
   *  Combo with all available visualizations (table or derived)
   *
   *  - It will show visualizations owner if user belongs
   *    to a organization.
   *
   *
   *  new cdb.ui.common.VisualizationsSelector({
   *    model:  visualizations_model,
   *    user:   user_model
   *  });
   *
   */

  cdb.ui.common.VisualizationsSelector = cdb.core.View.extend({

    className: 'visualizations-selector',

    events: {
      'select change': '_onComboChange'
    },

    initialize: function() {
      if (!this.model || !this.options.user) {
        cdb.log.info('Visualizations and user models are required')
      }

      this.user = this.options.user;

      this._initBinds();
    },

    render: function() {
      this.clearSubViews();

      // Create element to render combo
      var $div = $('<div>');
      this.$el.append($div);

      // Create combo
      var combo = new cdb.forms.VisualizationCombo({
        el:       $div,
        property: "table",
        width:    "100%",
        extra:    this._generateList()
      });
      combo.bind('change', this._onComboChange, this);

      this.$el.append(combo.render().el);
      this.addView(combo);

      // Send signal of change when combo is initialized again
      this._onComboChange();

      return this;
    },

    _initBinds: function() {
      this.model.bind('reset', this.render, this);
    },

    _generateList: function() {
      return this.model.map(function(mdl){
        var obj = {
          vis_id:     mdl.get('id'),
          name:       mdl.get('name'),
          username:   '',
          avatar:     '',
          permission: ''
        };
        
        if (this.user.isInsideOrg() && mdl.permission.owner) {
          var d = mdl.permission.owner.renderData(this.user);
          obj = _.extend(obj, {
            username:   d.username,
            avatar:     d.avatar_url,
            permission: mdl.permission.getPermission(this.user) === cdb.admin.Permission.READ_ONLY ? 'READ': null
          })
        }

        return obj;
      }, this);
    },

    _onComboChange: function() {
      this.trigger('change', this.getSelected(), this);
    },

    enable: function() {
      this.$("select").select2('enable')
    },

    disable: function() {
      this.$("select").select2('disable')
    },

    getSelected: function() {
      var d = $(this.$("select").select2('data').element).data();

      if (_.isEmpty(d) || !d.vis_id || d.vis_id === "undefined") {
        return null
      } else {
        return $(this.$("select").select2('data').element).data();  
      }
    }

  })




  /**
   *  Proper visualization combo,
   *  extended from cdb.forms.Combo
   *
   */

  cdb.forms.VisualizationCombo = cdb.forms.Combo.extend({

    _ITEM_TEMPLATE: _t(' \
      <div class="vis-info-item <%- username ? "shared" : "" %>">\
        <div class="value" title="<%- id %>" alt="<%- id %>"><%- id %></div>\
        <% if (username) { %>\
          <div class="by">\
            <% if (permission) { %>\
              <span class="permission round grey"><%- permission %></span>\
            <% } %>\
            <span class="username">by <%- username %></span>\
            <% if (avatar) { %>\
              <img class="avatar" src="<%= avatar %>" title="<%- username %>" alt="<%- username %>"/>\
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
      dropdownCssClass: 'visualizations-dropdown'
    },

    initialize: function() {
      _.bindAll(this, "_onUpdate", "_changeSelection", "_formatResult");
      cdb.forms.Combo.prototype.initialize.call(this);
    },

    _getOptions: function() {
      var options = _.map(this.data, function(option) {
      return '<option data-vis_id="' + option.vis_id + '" data-permission="'+ option.permission + '" data-name="' + option.name + '" ' + 
          '" data-avatar="' + option.avatar + '" data-username="' + option.username + '">' + option.name + '</option>';
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