export function forceChildToEmitEvent (elementWrapper, eventName, payload) {
  elementWrapper.vm.$children[0].$emit(eventName, payload);
}
