<div class="Modal">
  <div class="Modal-header">
    <div class="Modal-headerContainer">
      <h2 class="CDB-Text CDB-Size-huge is-light u-bSpace"><%- _t('components.modals.add-asset.modal-title') %></h2>
      <h3 class="CDB-Text CDB-Size-medium u-altTextColor"><%- _t('components.modals.add-asset.modal-desc') %></h3>
    </div>
  </div>

  <div class="Modal-container">
    <div class="Tab-pane">
      <div class="Modal-navigation">
        <ul class="Modal-navigationInner CDB-Text is-semibold CDB-Size-medium js-menu">
          <li class="CDB-NavMenu-item is-selected">
              <button class="CDB-NavMenu-link u-upperCase"><%- _t('components.modals.add-asset.your-uploads') %></button>
          </li>
        </ul>
      </div>
      <div class="Modal-inner Modal-inner--with-navigation">
        <div class="ScrollView">
          <div class="ScrollView-content js-body js-uploads"></div>
        </div>
      </div>
    </div>
  </div>

  <div class="Modal-footer">
    <div class="Modal-footerContainer u-flex u-justifyEnd">
      <button class="CDB-Button CDB-Button--primary is-disabled js-add">
        <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.add-asset.set-image') %></span>
      </button>
    </div>
  </div>
</div>



