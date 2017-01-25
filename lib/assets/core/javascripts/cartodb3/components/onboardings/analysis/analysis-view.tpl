<div class="Onboarding-fake"></div>
<div class="Onboarding-contentWrapper">
  <div class="Onboarding-body">
    <p class="CDB-Text Onboarding-headerTitle"><%- _t('analyses-onboarding.' + type + '.title') %></p>
    <p class="CDB-Text Onboarding-headerText"><%- _t('analyses-onboarding.finished') %></p>

    <div class="js-content"></div>

    <div class="Onboarding-footer">
      <div class="Onboarding-footerButtons">
        <button class="CDB-Button CDB-Button--secondary CDB-Button--white CDB-Button--big Onboarding-footer--marginRight js-close">
          <span class="CDB-Button-Text CDB-Text u-upperCase is-semibold CDB-Size-medium"><%- _t('analyses-onboarding.done') %></span>
        </button>

        <button class="CDB-Button CDB-Button--primary CDB-Button--big js-style">
          <span class="CDB-Button-Text CDB-Text u-upperCase is-semibold CDB-Size-medium"><%- _t('analyses-onboarding.style-analysis') %></span>
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

