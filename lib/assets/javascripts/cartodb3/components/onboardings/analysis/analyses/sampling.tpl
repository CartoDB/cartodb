<div class="Onboarding-contentWrapper">
  <div class="Onboarding-contentBody">
    <p class="CDB-Text Onboarding-headerTitle"><%- type %></p>
    <p class="CDB-Text Onboarding-headerText">has been finished</p>

    <p class="CDB-Text Onboarding-headerDescription">
      New data has been changed in your dataset.
    </p>

    <p class="CDB-Text Onboarding-description">
      Very often calculating the difference between the last temporal column of your data and the predicted value, and styling your map by that difference gives a good way for looking at your prediction
    </p>

    <div class="Onboarding-footer">
      <div class="Onboarding-footerButtons">
        <button class="CDB-Button CDB-Button--secondary CDB-Button--white CDB-Button--big Onboarding-footer--marginRight js-close">
          <span class="CDB-Button-Text CDB-Text u-upperCase is-semibold CDB-Size-medium">Done</span>
        </button>

        <button class="CDB-Button CDB-Button--primary CDB-Button--big js-style">
          <span class="CDB-Button-Text CDB-Text u-upperCase is-semibold CDB-Size-medium">Style this column</span>
        </button>
      </div>

      <div class="u-iBlock">
        <input class="CDB-Checkbox js-forget" type="checkbox" name="forget-me" value="true">
        <span class="u-iBlock CDB-Checkbox-face"></span>
        <label class="Checkbox-label CDB-Text CDB-Size-small u-altTextColor u-lSpace">Never show me this message.</label>
      </div>
    </div>
  </div>
</div>

