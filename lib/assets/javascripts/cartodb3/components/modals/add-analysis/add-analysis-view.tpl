<div class="Modal">
  <div class="Modal-header">
    <div class="Modal-headerContainer">
      <h2 class="CDB-Text CDB-Size-huge is-light u-bSpace"><%- _t('components.modals.add-analysis.modal-title') %></h2>
      <h3 class="CDB-Text CDB-Size-medium u-altTextColor"><%- _t('components.modals.add-analysis.modal-desc') %></h3>
    </div>
  </div>
  <div class="Modal-container">
    <div class="Modal-navigation">
      <ul class="Modal-navigationInner CDB-Text is-semibold CDB-Size-medium js-menu">
        <li class="CDB-NavMenu-item is-selected">
          <button class="CDB-NavMenu-link u-upperCase">Create and clean</button>
        </li>
        <li class="CDB-NavMenu-item">
          <button class="CDB-NavMenu-link u-upperCase">Transform</button>
        </li>
        <li class="CDB-NavMenu-item">
          <button class="CDB-NavMenu-link u-upperCase">Analyze and predict</button>
        </li>
      </ul>
    </div>
    <div class="Modal-inner Modal-inner--with-navigation js-body"></div>
  </div>
  <div class="Modal-footer">
    <div class="Modal-footerContainer u-flex u-justifyEnd">
      <button class="CDB-Button CDB-Button--primary is-disabled js-add">
        <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.add-analysis.add-btn') %></span>
      </button>
    </div>
  </div>
</div>
