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

<div class="Modal-inner Modal-inner--with-navigation js-content">
  <div class="Dialog-content Dialog-content--expanded">
    <div class="ScrollView">
      <div class="ScrollView-content">
        <div class="Modal-analysisContainer">
          <ul class="CDB-NavMenu-inner CDB-Text is-semibold CDB-Size-small SubmenuModal u-flex u-alignCenter">
            <li class="CDB-NavMenu-item u-upperCase u-secondaryTextColor SubmenuModal-item u-flex u-alignCenter">
              <%= _t('analysis-category.' + category) %>
            </li>
            <li class="CDB-NavMenu-item u-upperCase SubmenuModal-item u-flex u-alignCenter">
              <%- title %>
            </li>
          </ul>
          <div class="Modal-inner u-justifyCenter">
            <div class="Analysis-moreInfo">
              <div class="Analysis-animation <% if (genericType) { %>is-<%- genericType %><% } %> has-autoplay js-animation is-rounded"></div>
              <h2 class="CDB-Text CDB-Size-huge is-light Analysis-moreInfoTitle"><%- title %></h2>
              <p class="CDB-Text CDB-Size-medium u-secondaryTextColor">
                <%- _t('analyses-onboarding.' + genericType + '.description', analysisParams) %>
              </p>
            </div>
          </div>
        </div>
      </div>
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

