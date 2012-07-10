
var GOD = (function() {
  var subscribers = [];
  var debug = false;


  function unsubscribe(event) {
    debug && console.log("Unsubscribe ->", event.ev);
    subscribers = _.filter(subscribers,function(sub){
      return sub != event
    });
  }

  function subscribe(event,type) {
    debug && console.log("Subscribe ->", event);
    subscribers.push({ev:event,type:type});
  }

  function _signal(event) {
    debug && console.log("Signal to ", event.ev);
    $(window).trigger(event.ev);
    unsubscribe(event);
  }

  function _signalAll() {
    if (!_.isEmpty(subscribers)) {
      _.each(subscribers, _signal);
    }
  }

  function _signalLast() {
    if (!_.isEmpty(subscribers)) {
      _signal(_.last(subscribers))
    }
  }

  // send signal to all the other subscribers
  function broadcast(protectedEvent,type) {
    _.each(subscribers, function(event) {
      event.ev != protectedEvent && type <= event.type && _signal(event);
    });
  }

  function _unBindEscKey() {
    $(document).unbind("keyup");
  }

  function _bindEscKey() {
    $(document).keyup(function(e) {
      e.stopPropagation();
      e.keyCode == 27 && _signalLast();
    });
  }

  $(function() {
    _bindEscKey();
    $('html').click(_signalLast);
  });

  return {
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    broadcast: broadcast,
    bindEsc: _bindEscKey,
    unbindEsc: _unBindEscKey
  };
})();