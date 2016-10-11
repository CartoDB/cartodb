<div class="Modal">
  <div class="Modal-header">
    <div class="Modal-headerContainer">
      <div class="u-rSpace--xl u-actionTextColor js-back Editor-HeaderInfoEditorShape">
        <button>
          <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
        </button>
      </div>
      <h2 class="CDB-Text CDB-Size-huge is-light u-bSpace"><%- _t('components.modals.add-analysis.modal-title') %></h2>
      <h3 class="CDB-Text CDB-Size-medium u-altTextColor"><%- _t('components.modals.add-analysis.modal-desc') %></h3>
    </div>
  </div>
  <div class="Modal-container">
    <div class="Modal-analysisContainer">
      <div class="Modal-inner">
        <div class="Analysis-animation <% if (genericType) { %>is-<%- genericType %><% } %> js-animation is-rounded u-flex u-alignCenter u-justifyCenter"></div>

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
</div>

