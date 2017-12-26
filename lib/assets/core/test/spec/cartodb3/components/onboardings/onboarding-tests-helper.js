var addElement = function (className, top, left, width, height) {
  var div = document.createElement('div');
  document.body.appendChild(div);
  div.classList.add(className);
  div.style.position = 'absolute';
  div.style.top = '' + top + 'px';
  div.style.left = '' + left + 'px';
  div.style.width = '' + width + 'px';
  div.style.height = '' + height + 'px';

  return div;
};

var createOnboardingContainer = function (onboarding) {
  var onboardingContainer = document.createElement('div');
  onboardingContainer.style.position = 'absolute';
  onboardingContainer.style.top = '0';
  onboardingContainer.style.left = '0';
  onboardingContainer.appendChild(onboarding);
  document.body.appendChild(onboardingContainer);

  return onboardingContainer;
};

var assertHighlightPosition = function (view, prefix, top, left, width, height) {
  var $toolbar = view.$('.' + prefix + '-toolbarOverlay');
  var $topPad = view.$('.' + prefix + '-padTop');
  var $middlePad = view.$('.' + prefix + '-padMiddle');

  if ($toolbar.outerWidth() !== left) {
    throw new Error('Onboarding highlight expected to be at ' + left + ' left. Found at ' + $toolbar.outerWidth());
  }
  if ($topPad.outerHeight() !== top) {
    throw new Error('Onboarding highlight expected to be at ' + top + ' top. Found at ' + $topPad.outerHeight());
  }
  if ($middlePad.outerWidth() !== width) {
    throw new Error('Onboarding highlight expected to be ' + width + ' wide. Found ' + $middlePad.outerWidth());
  }
  if ($middlePad.outerHeight() !== height) {
    throw new Error('Onboarding highlight expected to be ' + height + ' high. Found ' + $middlePad.outerHeight());
  }

  return true;
};

module.exports = {
  addElement: addElement,
  createOnboardingContainer: createOnboardingContainer,
  assertHighlightPosition: assertHighlightPosition
};
