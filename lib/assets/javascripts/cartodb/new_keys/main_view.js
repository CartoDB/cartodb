var $ = require('jquery');
var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
// var HeaderView = require('new_common/header_view');
var SupportView = require('new_common/support_view');

module.exports = cdb.core.View.extend({

  initialize: function() {
    this.user = this.options.user;
    this._initViews();
  },

  _initViews: function() {
    var self = this;

    // var headerView = new HeaderView({
    //   el:         this.$('#header'), //pre-rendered in DOM by Rails app
    //   model:      this.user,
    //   router:     this.router,
    //   localStorage: this.localStorage
    // });
    // headerView.render();

    var supportView = new SupportView({
      el: this.$('#support-banner'),
      user: this.user
    });

    
    this.$('.Form-copy').each(function(i, el){
      // Copy
      $(el).zclip({
        path: cdb.config.get('assets_url') + "/flash/ZeroClipboard.swf",
        copy: function(){
          return $(this).parent().find(".Form-input").val();
        }
      });
      // Tooltip
      self.addView(
        new cdb.common.TipsyTooltip({
          el: self.$(el),
          title: function(e) {
            return $(this).attr('data-title')
          }
        })
      )
    });


    supportView.render();
  }

});
