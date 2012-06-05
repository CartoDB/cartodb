

App.modules.Error = function(app) {
    var ErrorDialog = Backbone.View.extend({
        el: $("#error_dialog"),

        events: {
            'click #ok': 'close'
        },

        initialize: function() {
            _.bindAll(this, 'close', 'show');
            this.msg = this.options.msg;
            this.$("#error_text").html(this.msg);
            if(this.options.hide_close === true) {
                this.$("#ok").hide();
            }
        },

        show: function() {
            this.el.fadeIn('fast');
        },

        close: function(e) {
            e.preventDefault();
            this.el.hide();
        }

    });

    function show_error(msg, hide_close) {
        var dlg = new ErrorDialog({
            msg: msg,
            hide_close: hide_close});
        dlg.show();
    }

    app.Error = {};
    app.Error.show = show_error;

};
