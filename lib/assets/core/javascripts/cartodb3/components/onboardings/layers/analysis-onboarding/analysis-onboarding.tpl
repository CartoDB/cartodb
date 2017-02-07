<div class="LayerOnboarding-toolbarOverlay"></div>

<div class="LayerOnboarding-pads LayerOnboarding-pads--left">
  <div class="LayerOnboarding-padTop"></div>
  <div class="LayerOnboarding-padMiddle"></div>
</div>

<div class="LayerOnboarding-contentWrapper LayerOnboarding-contentWrapper--analysis is-step0 js-step">
  <div class="LayerOnboarding-contentBody LayerOnboarding-contentBody--analysis is-step0 js-step">
    <div class="Onboarding-body">
      <p class="CDB-Text Onboarding-headerTitle"><%- _t('analysis-onboarding.title')%></p>

      <p class="CDB-Text Onboarding-headerDescription"><%- _t('analysis-onboarding.description')%></p>

      <ul class="Onboarding-list">
        <li class="Onboarding-listItem">
          <p class="CDB-Text Onboarding-description"><%- _t('analysis-onboarding.description-list.item1')%></p>
        </li>

        <li class="Onboarding-listItem">
          <p class="CDB-Text Onboarding-description"><%- _t('analysis-onboarding.description-list.item2')%></p>
        </li>

        <li class="Onboarding-listItem">
          <p class="CDB-Text Onboarding-description"><%- _t('analysis-onboarding.description-list.item3')%></p>
        </li>

        <li class="Onboarding-listItem">
          <p class="CDB-Text Onboarding-description"><%- _t('analysis-onboarding.description-list.item4')%></p>
        </li>
      </ul>
    </div>

    <div class="Onboarding-footer">
      <div class="Onboarding-footerButtons">
        <button class="CDB-Button CDB-Button--secondary CDB-Button--white CDB-Button--big Onboarding-footer--marginRight js-close">
          <span class="CDB-Button-Text CDB-Text u-upperCase is-semibold CDB-Size-medium"><%- _t('analysis-onboarding.done')%></span>
        </button>

        <button class="CDB-Button CDB-Button--primary CDB-Button--big js-add-analysis">
          <span class="CDB-Button-Text CDB-Text u-upperCase is-semibold CDB-Size-medium"><%- _t('analysis-onboarding.add-analysis')%></span>
        </button>
      </div>

      <div class="u-iBlock">
        <input class="CDB-Checkbox js-forget" type="checkbox" id="forget-me" name="forget-me" value="true">
        <span class="u-iBlock CDB-Checkbox-face"></span>
        <label for="forget-me" class="Onboarding-forgetLabel Checkbox-label CDB-Text CDB-Size-small u-altTextColor u-lSpace"><%- _t('analyses-onboarding.never-show-message') %></label>
      </div>
    </div>
  </div>
</div>
