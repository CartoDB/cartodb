<div class="Modal-header">
  <div class="Modal-headerContainer">
    <div class="CDB-HeaderInfo">
      <button class="u-rSpace--xl CDB-HeaderInfo-back u-actionTextColor js-back">
        <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
      </button>
      <div class="CDB-HeaderInfo-inner">
        <h2 class="CDB-Text CDB-Size-huge is-light u-bSpace"><%- _t('components.modals.add-analysis.modal-title') %></h2>
        <h3 class="CDB-Text CDB-Size-medium u-altTextColor"><%- _t('components.modals.add-analysis.modal-desc') %></h3>
      </div>
    </div>
  </div>
</div>
<div class="Modal-container">
  <div class="Modal-analysisContainer">
    <ul class="CDB-NavMenu-inner CDB-Text is-semibold CDB-Size-small">
      <li class="CDB-NavMenu-item u-upperCase">
        <%= _t('analysis-category.' + category) %>
      </li>
      <li class="CDB-NavMenu-item u-upperCase">
        >
      </li>
      <li class="CDB-NavMenu-item u-upperCase">
        <%- title %>
      </li>
    </ul>
    <div class="Modal-inner">
      <div class="Analysis-animation <% if (genericType) { %>is-<%- genericType %><% } %> js-animation is-rounded"></div>
      <h2 class="CDB-Text CDB-Size-huge is-light u-bSpace"><%- title %></h2>
      <p class="CDB-Text Onboarding-description">
        <%- _t('analyses-onboarding.' + genericType + '.description') %>
      </p>
    </div>
  </div>
</div>
<div class="Modal-footer">
  <div class="Modal-footerContainer u-flex u-justifyEnd">
    <button class="CDB-Button CDB-Button--primary js-add">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.add-analysis.add-btn') %></span>
    </button>
  </div>
</div>

