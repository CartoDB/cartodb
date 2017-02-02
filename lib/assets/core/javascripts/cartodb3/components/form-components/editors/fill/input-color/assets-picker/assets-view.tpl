<div class="Modal">
  <div class="Modal-header">
    <div class="Modal-headerContainer">
      <h2 class="CDB-Text CDB-Size-huge is-light u-bSpace"><%- _t('components.modals.add-asset.modal-title') %></h2>
      <h3 class="CDB-Text CDB-Size-medium u-altTextColor"><button class="u-actionTextColor js-upload"><%- _t('components.modals.add-asset.upload-asset') %></button> <%- _t('components.modals.add-asset.modal-desc') %></h3>
    </div>
  </div>

  <div class="Modal-container">
    <div class="Modal-navigation">
      <nav class="CDB-NavMenu u-inner">
        <ul class="CDB-Size-medium CDB-Text is-semibold js-menu"></ul>
      </nav>
    </div>
    <div class="Tab-paneContent Publish-modalContent Modal-inner Modal-inner--with-navigation js-content"></div>
    </div>
  </div>

  <div class="Modal-footer">
    <div class="Modal-footerContainer u-flex u-justifySpace">

      <div class="CDB-Text CDB-Size-medium js-disclaimer">
        <% if (disclaimer) { %>
        <%= disclaimer %>
        <% } %>
      </div>

      <button class="CDB-Button CDB-Button--primary is-disabled js-add">
        <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.add-asset.set-image') %></span>
      </button>
    </div>
  </div>
</div>
<form accept-charset="UTF-8" enctype="multipart/form-data" method="post">
  <input type="file" accept="image/jpeg,image/jpg,image/gif,image/png,image/svg+xml" class="js-fileInput" style="position: absolute; clip: rect(0px 0px 0px 0px); opacity: 0;" multiple="multiple">
</form>
