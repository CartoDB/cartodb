import Vue from 'vue';

Vue.directive('clickOutside', {
  bind: function (element, binding, vnode) {
    element.clickOutsideEvent = function (event) {
      if (!element.contains(event.target)) {
        vnode.context[binding.expression](event);
      }
    };

    document.body.addEventListener('click', element.clickOutsideEvent, { passive: true });
  },
  unbind: function (element) {
    document.body.removeEventListener('click', element.clickOutsideEvent, { passive: true });
  }
});
