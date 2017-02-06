<div class="DataOnboarding-toolbarOverlay"></div>

<div class="DataOnboarding-pads DataOnboarding-pads--left">
  <div class="DataOnboarding-padTop"></div>
  <div class="DataOnboarding-padMiddle">
    <div class="DataOnboarding-body is-step0 js-step">
      <div class="DataOnboarding-step is-step1">
        <p class="CDB-Text Onboarding-headerTitle">1/4</p>
        <p class="CDB-Text Onboarding-headerText"><%- _t('data-onboarding.layer-options')%></p>
        <p class="CDB-Text DataOnboarding-description">
          <%- _t('data-onboarding.layer-options.description')%>
        </p>
      </div>
      <div class="DataOnboarding-step is-step2">
        <p class="CDB-Text Onboarding-headerTitle">2/4</p>
        <p class="CDB-Text Onboarding-headerText"><%- _t('data-onboarding.configurator.title')%></p>
        <p class="CDB-Text DataOnboarding-description">
          <%- _t('data-onboarding.configurator.description')%>
        </p>
      </div>

      <div class="DataOnboarding-step is-step3">
        <p class="CDB-Text Onboarding-headerTitle">3/4</p>
        <p class="CDB-Text Onboarding-headerText"><%- _t('data-onboarding.map.title')%></p>
        <p class="CDB-Text DataOnboarding-description">
          <%- _t('data-onboarding.map.description')%>
        </p>
      </div>

      <div class="DataOnboarding-footer is-step1 is-step2 is-step3">
        <div class="DataOnboarding-footerButtons">
          <button class="CDB-Button CDB-Button--secondary CDB-Button--white CDB-Button--big Onboarding-footer--marginRight js-close">
            <span class="CDB-Button-Text CDB-Text u-upperCase is-semibold CDB-Size-medium"><%- _t('data-onboarding.skip')%></span>
          </button>

          <button class="CDB-Button CDB-Button--primary CDB-Button--big js-next">
            <span class="CDB-Button-Text CDB-Text u-upperCase is-semibold CDB-Size-medium"><%- _t('data-onboarding.next')%></span>
          </button>
        </div>
      </div>

    </div>
  </div>
  <div class="DataOnboarding-padBottom"></div>
</div>


<div class="DataOnboarding-contentWrapper is-step0 js-step">
  <div class="DataOnboarding-contentBody is-step0 js-step">
    <div class="DataOnboarding-header is-step0">
      <p class="CDB-Text Onboarding-headerTitle"><%- _t('data-onboarding.title')%></p>

      <p class="CDB-Text DataOnboarding-description">
        <%- _t('data-onboarding.description')%>
      </p>
    </div>

    <div class="DataOnboarding-footer is-step0">
      <div class="DataOnboarding-footerButtons">
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

<div class="DataOnboarding-pads DataOnboarding-pads--right is-step0 js-step">
  <div class="DataOnboarding-padTop"></div>
  <div class="DataOnboarding-padBottom">
    <div class="DataOnboarding-body is-step0 js-step">
      <div class="DataOnboarding-step is-step4">
        <p class="CDB-Text Onboarding-headerTitle">4/4</p>
        <p class="CDB-Text Onboarding-headerText"><%- _t('data-onboarding.widgets.title')%></p>
        <p class="CDB-Text DataOnboarding-description">
          <%- _t('data-onboarding.widgets.description')%>
        </p>
      </div>

      <div class="DataOnboarding-footer is-step4">
        <div class="DataOnboarding-footerButtons">
          <button class="CDB-Button CDB-Button--primary CDB-Button--big js-close">
            <span class="CDB-Button-Text CDB-Text u-upperCase is-semibold CDB-Size-medium"><%- _t('data-onboarding.edit-map')%></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<% if (hasWidgets) { %>
  <div class="DataOnboarding-widgetsOverlay"></div>
<% } %>
<!--<div class="BuilderOnboarding-shadow"></div>-->
