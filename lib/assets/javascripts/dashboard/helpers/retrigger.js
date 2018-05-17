// This used to be on core-model
/**
  * Listen for an event on another object and triggers on itself, with the same name or a new one
  * @method retrigger
  * @param ev {String} event who triggers the action
  * @param obj {Object} object where the event happens
  * @param obj {Object} [optional] name of the retriggered event
  * @todo [xabel]: This method is repeated here and in the base view definition. There's should be a way to make it unique
  */
module.exports = function (ev, obj, retrigEvent) {
  if (!retrigEvent) {
    retrigEvent = ev;
  }
  obj.bind && obj.bind(ev, () => {
    this.trigger(retrigEvent);
  }, this);
};
