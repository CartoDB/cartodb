<div class="Modal">
  <div class="Modal-header">
    <div class="Modal-headerContainer">
      <h2 class="CDB-Text CDB-Size-huge is-light u-bSpace"><%- _t('components.modals.add-asset.modal-title') %></h2>
      <h3 class="CDB-Text CDB-Size-medium u-altTextColor"><%- _t('components.modals.add-asset.modal-desc') %></h3>
    </div>
  </div>
  <div class="Modal-container">
    <div class="Modal-inner js-body">
      <%- _t('components.modals.add-asset.your-uploads') %>
      <div class="js-uploads"></div>

      <%- _t('components.modals.add-asset.simple-icons') %>
      <div class="js-simpleIcons"></div>

      <%- _t('components.modals.add-asset.pin-icons') %>
      <div class="js-pinIcons"></div>
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
