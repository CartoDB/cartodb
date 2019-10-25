import Vue from 'vue';

Vue.directive('clickOutside', {
  bind: function (element, binding, vnode) {
    element.clickOutsideEvent = function (event) {
      if (!element.contains(event.target)) {
        vnode.context[binding.expression](event);
      }
    };

    element.addClickEvent = function (event) {
      document.body.addEventListener('click', element.clickOutsideEvent, { passive: true });
    };

    element.addEventListener('click', element.addClickEvent, { passive: true });
  },
  unbind: function (element) {
    document.body.removeEventListener('click', element.clickOutsideEvent, { passive: true });
    element.removeEventListener('click', element.addClickEvent, { passive: true });
  }
});
