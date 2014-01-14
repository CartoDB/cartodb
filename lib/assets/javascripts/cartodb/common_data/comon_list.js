
  /**
   *  Common tables view 
   */

  cdb.admin.CommonTablesView = cdb.core.View.extend({
    tagName: 'table',

    initialize: function() {
      var self = this;
      this.options.user.bind('change', this.render, this);
      this.collection.bind('change', this.render, this);
    },

    render: function() {
      var self = this;

      // Clean sub views
      this.$el.html('');
      this.clearSubViews();
      
      // Create new ones
      this.collection.each(function(m, i) {
        self._addTable(m);
      });
    },

    _addTable: function(t) {
      var self = this
        , tr = new cdb.admin.CommonTableView({ 
          model: t,
          user: this.options.user
        }).bind('create', function(e){
          self.trigger('create', e);
        }).bind('upgrade', function(e){
          self.trigger('upgrade', e);
        })

      this.$el.append(tr.render().el);
      this.addView(tr);
    }
  });



  /**
   *  Common table view renderer
   */

  cdb.admin.CommonTableView = cdb.core.View.extend({
    
    tagName: 'tr',

    events: {
      'click a.copy': '_copyTable',
      'click a.name': '_copyTable'
    },

    initialize: function() {
      _.bindAll(this, '_copyTable');

      _.defaults(this.options, this.default_options);

      this.template = cdb.templates.getTemplate('common_data/views/common_list_item');

      this.bind("clear", this._reclean);
    },

    render: function() {
      var data = this.model.toJSON();

      // Sanitize table size
      data.quota = this._bytesToSize(data.size);

      // Over quota?
      data.over_quota = this._isOverQuota();

      this.$el.html(this.template(data));

      this.$('a.copy').tipsy({
        fade: true,
        gravity: "s"
      });

      return this;
    },

    _bytesToSize: function(size) {
      var bytes = parseInt(size)
        , sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes == 0) return '0 KB';
      var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      var value = (bytes / Math.pow(1024, i)).toFixed(2);

      if (value % 1 == 0) {
        value = parseInt(value)
      }

      return value + " " + sizes[i];
    },


    _isOverQuota: function() {
      return (this.model.get("size") > +this.options.user.get('remaining_byte_quota') || +this.options.user.get("remaining_table_quota") == 0) 
              && (this.options.user.get("table_quota") !== null)
              && (this.options.user.get("quota_in_bytes") !== null);
    },


    _copyTable: function(e) {
      this.killEvent(e);
      // trigger what type of event, if user needs to upgrade or can create the table
      var _e =  this._isOverQuota() ? 'upgrade' : 'create';
      this.trigger(_e, e);
    },

    _reclean: function() {
      this.$('a.copy').tipsy('destroy');
    }
  });