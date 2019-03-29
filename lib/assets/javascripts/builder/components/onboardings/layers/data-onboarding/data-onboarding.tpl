<div class="LayerOnboarding-toolbarOverlay"></div>

<div class="LayerOnboarding-pads LayerOnboarding-pads--left">
  <div class="LayerOnboarding-padTop"></div>
  <div class="LayerOnboarding-padMiddle js-highlight">
    <div class="LayerOnboarding-body is-step0 js-step">
      <div class="LayerOnboarding-step is-step1">
        <p class="CDB-Text LayerOnboarding-headerTitle">1/4</p>
        <p class="CDB-Text LayerOnboarding-headerText"><%- _t('data-onboarding.layer-options.title')%></p>
        <p class="CDB-Text LayerOnboarding-description">
          <%- _t('data-onboarding.layer-options.description')%>
        </p>
      </div>
      <div class="LayerOnboarding-step is-step2">
        <p class="CDB-Text LayerOnboarding-headerTitle">2/4</p>
        <p class="CDB-Text LayerOnboarding-headerText"><%- _t('data-onboarding.data-tab.title')%></p>
        <p class="CDB-Text LayerOnboarding-description">
          <%- _t('data-onboarding.data-tab.description')%>
        </p>
      </div>

      <div class="LayerOnboarding-step is-step3">
        <p class="CDB-Text LayerOnboarding-headerTitle">3/4</p>
        <p class="CDB-Text LayerOnboarding-headerText"><%- _t('data-onboarding.sql-editor.title')%></p>
        <p class="CDB-Text LayerOnboarding-description">
          <%- _t('data-onboarding.sql-editor.description')%>
        </p>
      </div>

      <div class="LayerOnboarding-step is-step4">
        <p class="CDB-Text LayerOnboarding-headerTitle">4/4</p>
        <p class="CDB-Text LayerOnboarding-headerText is-step4"><%- _t('data-onboarding.add-geometry.title')%></p>
        <p class="CDB-Text LayerOnboarding-description is-step4">
          <%- _t('data-onboarding.add-geometry.description')%>
        </p>
      </div>

      <div class="LayerOnboarding-footer is-step1 is-step2 is-step3">
        <div class="LayerOnboarding-footerButtons">
          <button class="CDB-Button CDB-Button--secondary CDB-Button--white CDB-Button--big Onboarding-footer--marginRight js-close">
            <span class="CDB-Button-Text CDB-Text u-upperCase is-semibold CDB-Size-medium"><%- _t('data-onboarding.exit')%></span>
          </button>

          <button class="CDB-Button CDB-Button--primary CDB-Button--big js-next">
            <span class="CDB-Button-Text CDB-Text u-upperCase is-semibold CDB-Size-medium"><%- _t('data-onboarding.next')%></span>
          </button>
        </div>
      </div>

      <div class="LayerOnboarding-footer is-step4">
        <div class="LayerOnboarding-footerButtons">
          <button class="CDB-Button CDB-Button--primary CDB-Button--big js-close">
            <span class="CDB-Button-Text CDB-Text u-upperCase is-semibold CDB-Size-medium"><%- _t('data-onboarding.add-geometry.edit-layer') %></span>
          </button>
        </div>
      </div>
    </div>
  </div>
  <div class="LayerOnboarding-padBottom"></div>
</div>

<div class="LayerOnboarding-contentWrapper is-step0 js-step">
  <div class="LayerOnboarding-contentBody is-step0 js-step">
    <div class="LayerOnboarding-header is-step0">
      <p class="CDB-Text LayerOnboarding-headerTitle"><%- _t('data-onboarding.title')%></p>

      <p class="CDB-Text LayerOnboarding-description">
        <%= _t('data-onboarding.description')%>
      </p>
    </div>

    <div class="LayerOnboarding-footer is-step0">
      <div class="LayerOnboarding-footerButtons">
        <button class="CDB-Button CDB-Button--secondary CDB-Button--white CDB-Button--big Onboarding-footer--marginRight js-start">
          <span class="CDB-Button-Text CDB-Text u-upperCase is-semibold CDB-Size-medium"><%- _t('data-onboarding.take-tour')%></span>
        </button>

        <button class="CDB-Button CDB-Button--primary CDB-Button--big js-close">
          <span class="CDB-Button-Text CDB-Text u-upperCase is-semibold CDB-Size-medium"><%- _t('data-onboarding.edit-layer')%></span>
        </button>
      </div>
    </div>
  </div>
</div>
