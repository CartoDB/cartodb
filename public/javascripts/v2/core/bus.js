

App.modules.Bus = function(app) {

    app.Bus = Class.extend({

        init: function() {
            _.extend(this, Backbone.Events);
        },

        on: function(event_name, callback) {
            this.bind(event_name, callback);
        },

        emit: function() {
            this.trigger.apply(this, arguments);
        },

        // attach events to events on the bus
        // works in the same way backbone events do
        link: function(obj, events) {
            var self = this;
            _(events).each(function(v, k) {
                var fn = obj[v];
                if(typeof fn === "function") { 
                    self.on(k, fn);
                } else {
                    app.Log.log("error finding: ", v);
                }
            });
        },

        // attach event_name of object to the bus so
        // all the events triggered will be triggered by the bus too
        attach: function(obj, event_name) {
            var self = this;
            obj.bind(event_name,function() {
                var args = Array.prototype.slice.call(arguments);
                self.emit.apply(self, [event_name].concat(args));
            });
        }

    });

};
