import {
  mount
} from '@vue/test-utils';

import Welcome from 'new-dashboard/components/Home/Welcome';

describe('Welcome.vue', () => {
  let welcomeWrapper;
  beforeEach(() => {
    welcomeWrapper = mount(Welcome);
  });

  describe('basic behaviour', () => {
    it('should have a greeting', () => {});
    it('should have custom text greeting', () => {});
    it('should have several links', () => {});
    it('should have a compact option', () => {});
  });
});
