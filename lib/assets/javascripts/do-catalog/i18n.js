import Vue from 'vue';
import VueI18n from 'vue-i18n';

import en from 'new-dashboard/i18n/locales/en';

Vue.use(VueI18n);

const i18n = new VueI18n({
  locale: 'en',
  messages: {
    en
  }
});

export default i18n;
