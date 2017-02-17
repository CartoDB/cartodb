<div class="LayerOnboarding-toolbarOverlay"></div>

<div class="LayerOnboarding-pads LayerOnboarding-pads--left">
  <div class="LayerOnboarding-padTop"></div>
  <div class="LayerOnboarding-padMiddle"></div>
</div>

<div class="LayerOnboarding-contentWrapper LayerOnboarding-contentWrapper--analysis is-step0 js-step">
  <div class="LayerOnboarding-contentBody LayerOnboarding-contentBody--analysis is-step0 js-step">
    <div class="Onboarding-body">
      <p class="CDB-Text LayerOnboarding-headerTitle"><%= _t('style-onboarding.georeference.title', { name: name })%></p>

      <p class="CDB-Text Onboarding-headerDescription"><%- _t('style-onboarding.georeference.description')%></p>
    </div>

    <div class="LayerOnboarding-footer">
      <div class="LayerOnboarding-footerButtons">
        <button class="CDB-Button CDB-Button--secondary CDB-Button--white CDB-Button--big Onboarding-footer--marginRight js-close">
          <span class="CDB-Button-Text CDB-Text u-upperCase is-semibold CDB-Size-medium"><%- _t('style-onboarding.georeference.skip')%></span>
        </button>

        <button class="CDB-Button CDB-Button--primary CDB-Button--big js-add-analysis">
          <span class="CDB-Button-Text CDB-Text u-upperCase is-semibold CDB-Size-medium"><%- _t('style-onboarding.georeference.georeference')%></span>
        </button>
      </div>

      <div class="u-iBlock">
        <input class="CDB-Checkbox js-forget" type="checkbox" id="forget-me" name="forget-me" value="true">
        <span class="u-iBlock CDB-Checkbox-face"></span>
        <label for="forget-me" class="Onboarding-forgetLabel Checkbox-label CDB-Text CDB-Size-small u-whiteTextColor is-light u-lSpace"><%- _t('style-onboarding.never-show-message') %></label>
      </div>
    </div>
  </div>
</div>
