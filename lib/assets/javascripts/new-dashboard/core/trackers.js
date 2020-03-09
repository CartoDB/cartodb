import { TrackJS } from 'trackjs';
import store from '../store';

// TrackJS Configuration
const isTrackJSEnabled = store.state.config.trackjs_enabled;

if (isTrackJSEnabled) {
  TrackJS.install({
    token: store.state.config.trackjs_customer,
    application: store.state.config.trackjs_app_key,
    userId: store.state.user.username,
    version: __ASSETS_VERSION__ + '-nd' // eslint-disable-line
  });
}

// Google Tag Manager
const tagManagerId = store.state.config.google_tag_manager_id;

if (tagManagerId) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    userId: store.state.user.id,
    userAccountType: store.state.user.account_type,
    userSignUpDate: Date.parse(store.state.user.created_at) / 1000,
    userJobRole: store.state.user.job_role,
    userInTrialPeriod: store.state.user.show_trial_reminder.toString()
  });

  /* eslint-disable */
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer', store.state.config.google_tag_manager_id);
  /* eslint-enable */
}
