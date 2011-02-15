/*!
 * jQuery.Hive Plugin
 *  http://github.com/rwldrn
 *  http://pollenjs.com
 *
 *  Copyright 2010, Rick Waldron
 *  Dual licensed under the MIT or GPL Version 2 licenses.
 *
 *  v0.2.00
 *  (see source for other credits)
 */

(function (jQuery) {
  /** 
   * jQuery.Hive  -> The Hive is a property of jQuery
   **/   
  jQuery.Hive = (function() {

    var /* @private */
    //  Thread ID Cache
    _threadsById    = {},
    //  Thread Cache
    _threads        = [], 
    //  Thread Callback Cache
    _fnCache        = {},
    //  Last thread id
    _lastThreadInt  = 0
    ;
    function _addMessageListener(worker, callback) {
    
      worker.addEventListener('message', function (event) { 
        var fn    = callback, 
            response = event.data;
        
        
        jQuery.event.trigger( 'workerMessageReceived' );

        if ( response.SEND_TO ) {
        
          _msg  = {
            "message"    : response.message,
            "SEND_TO"    : +response.SEND_TO,  
            "SEND_FROM"  : +response.SEND_FROM
          };
          
          jQuery.Hive.get(response.SEND_TO).send(_msg);

          //  If direct message return immediately, do not fire receive callback
          return true;
        }
        
        return callback.call( worker, response  ); 

      }, false);      
    }
    /* @private */
    
    /* @public  */
    return {

      /** 
       * jQuery.Hive.options -> Setup properties for jQuery.Hive.create( [options] )
       **/     
      options:  {
        /** 
         * jQuery.Hive.options.count -> Set property from jQuery.Hive.create( { count: [int] } ), number of threads to create
         **/     
        count:    1,  
        /** 
         * jQuery.Hive.options.worker -> Set string property from jQuery.Hive.create( { worker: [file-name] } ), name of worker file
         **/     
        worker: '',
        /** 
         * jQuery.Hive.options.receive -> Set callback from jQuery.Hive.create( { receive: [callback] } ), callback to execute when worker receives message (can be global or worker specific)
         **/     
        receive: jQuery.noop,
        /** 
         * jQuery.Hive.options.created -> Set callback from jQuery.Hive.create( { created: [callback] } ), callback to execute when workers have been created
         **/     
        created: jQuery.noop,
        /** 
         * jQuery.Hive.options.special -> NOT IMPLEMENTED/INCOMPLETE  - Set callback as a second argument to $().send()
         **/     
        special: '',        
        /** 
         * jQuery.Hive.options.error() -> NOT IMPLEMENTED/INCOMPLETE  - Error handler
         **/ 
        error:      function (event) {
          //  INCOMPLETE
        }
      },
      /** 
       * jQuery.Hive.create( options ) -> Array, create workers, returns array of all workers
       **/   
      create: function ( options ) {
        
        //  If no worker file is specified throw exception
        if ( jQuery.Hive.options.worker == '' &&  !options.worker  ) {
          throw "No Worker file specified";
        }
        
        var i = 0,
        _options        = jQuery.extend({}, jQuery.Hive.options, options);
        _options.count  = options.count ? options.count   : 1;

        //  If threads exist, new threads to cache
        if ( _threads.length > 0 ) {
          
          //  force thread count starting position to avoid overwriting existing threads        
          i       = _lastThreadInt + 1;
          //  set count to reflect added threads
          _options.count   = _lastThreadInt + _options.count + 1;
        }
        
        //  Create specified number of threads
        for ( ; i < _options.count; i++ ) {

          var 
          //  Create new worker thread
          thread = new Worker( _options.worker );
          
          //  Garbage collect
          jQuery(window).unload( function () { 
            thread.terminate();
          });

          //  Save this worker's identity
          thread.WORKER_ID  = (function (i) { return i; })(i);
          thread.id         = thread.WORKER_ID; // duplicitous... TODO: clean up   

          //  Define Hive properties
          thread.send       = jQuery.Hive.send;
          thread.special    = '';
          thread.onerror    = _options.error;

          var _wrapReceived  = function onmessage(event) {
            return _options.receive.call(this, event);
          };          
          
          thread.receive    = _wrapReceived;
          
          _addMessageListener(thread, _wrapReceived);

          //  Store this callback in the Hive cache with assoc worker ID
          _fnCache[thread.id]  = {
            active:   [ _wrapReceived ],
            inactive: []
          };
          
          //  Store this worker in the Hive cache - by ID
          _threadsById[thread.id]   = thread;
          
          //  Store last thread id created
          _lastThreadInt            = thread.id;
          
          //  Store this worker in the Hive cache
          _threads.push( thread );
        }

        //  If a created callback is defined, wrap and fire
        if ( _options.created ) {
          var _wrapCreated  = function () {
            _options.created.call(this, _threads);
            return _threads;
          };
          _wrapCreated();
          
          jQuery.Hive.created = _wrapCreated;
        }
        
        
        jQuery.event.trigger( 'workerCreated' );
        
        
        //  Allows assignment to var
        return _threads;
      },
      /** 
       * jQuery.Hive.destroy( [id] ) -> destroy all or specified worker by id
       **/      
      destroy:  function ( id ) {
        if ( id ) {
          delete _threadsById[id];
          delete _fnCache[id];

          _threads  = jQuery.map(_threads, function (obj) {
                                              if ( obj.id != id ) {
                                                return obj;
                                              }
                                            });
          return _threads;
        }

        //  Delete All
        jQuery.Hive.options.count   = 0;
        _threads.length = 0;
        
        _threadsById  = {};
        _fnCache      = {};
        
        
        jQuery.event.trigger( 'workerDestroyed' );
        
        return _threads;
      },
      /** 
       * jQuery.Hive.get( id ).send( message, callback ) -> Send [message] to worker thread, set optional receive callback 
       *  -->   SIMPLER ALTERNATIVE:  $.Hive.get(id).send( [message], function () {} )
       *  -->   Allows for passing a jQuery.Hive.get(id) object to $() ie. $( $.Hive.get(id) ).send( [message] )
       **/     
      send:  function ( message, /*not implemented*/callback ) {

        var _msg  = message, _msgStr;

        /*not implemented*/
        if ( callback ) {
          _addMessageListener(this, callback, true);
        }

        //  if message is not an object (string || array)
        //  normalize it into an object
        if ( typeof message == 'string' || jQuery.isArray(message) ) {
          _msg  = {
            "message" : message
          };
        }

        if ( !message.SEND_FROM ) {
          _msg.SEND_FROM = this.WORKER_ID;
        }

        _msg.WORKER_ID  = this.WORKER_ID;
        //_msgStr         = JSON.stringify(_msg);

        //this.postMessage(_msgStr);

        

        this.postMessage(_msg);


        this._lastMessage = _msgStr;
        
        
        jQuery.event.trigger( 'workerMessageSent' );
        

        return this;
      },        
      /** 
       * jQuery.Hive.get( [id] ) -> Return all or specified worker by [id], [id] argument is optional
       *  -->   $.Hive.get() returns all worker objects in the $.Hive
       *  -->   $.Hive.get(1) returns the worker object whose ID is 1
       **/     
      get: function ( id ) {
        if ( id !== undefined ) {
          //  Returns specified worker by [id] from private object cache
          return _threadsById[id];
        }
        //  Returns array of all existing worker threads
        return _threads;
      }
    }
  })();
  
  /** 
   *  jQuery.( $.Hive.get( id ) ).send( message ) -> Send [message] to worker thread 
   *  -->   SIMPLER ALTERNATIVE:  $.Hive.get(id).send( [message] )
   *  -->   Allows for passing a $.Hive.get(id) object to $() ie. $( $.Hive.get(id) ).send( [message] )
   **/    
  jQuery.fn.send    = function(message, callback) {
    return this.each(function (i, thread) {
      thread.send(message, callback);
    });
  };

})(jQuery); 
