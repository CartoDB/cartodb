import Vue from 'vue';

function validateSelector (selector) {
  if (!selector || typeof selector !== 'string') {
    // eslint-disable-next-line
    console.error(`[v-portal] invalid selector ${selector}. It must be a non-empty string`)
    return null;
  }
  const root = document.querySelector(selector);
  if (!root) {
    // eslint-disable-next-line
    console.error(`[v-portal] dom node not found for selector ${selector}`)
    return null;
  }
  return root;
}

// this directive is useful for moving elements deep in the app tree to the bottom of the DOM
// useful for things like modal popups and PDF modals
const portal = Vue.directive('portal', {
  inserted: (el, binding) => {
    const selector = binding.value;
    const root = validateSelector(selector);
    if (root) {
      root.appendChild(el);
    }
  },
  componentUpdated: (el, binding) => {
    const root = validateSelector(binding.value);
    if (!root.contains(el)) {
      root.appendChild(el);
    }
  },
  unbind: (el, binding) => {
    const root = validateSelector(binding.value);
    if (root.contains(el)) {
      root.removeChild(el);
    }
  }
});

export default portal;
