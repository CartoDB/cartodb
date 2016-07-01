<div class="Dialog-header">
  <div class="Dialog-headerIcon Dialog-headerIcon--neutral">
    <i class="CDB-IconFont CDB-IconFont-downloadCircle"></i>
  </div>
  <h2 class="CDB-Text CDB-Size-large u-bSpace">
    <%- _t('editor.maps.export.title', { name: name }) %>
  </h2>
  <h3 class="CDB-Text CDB-Size-medium u-altTextColor">
    <%- _t('editor.maps.export.desc') %>
  </h3>
</div>
<div class="Dialog-footer--simple u-inner">
  <button class="CDB-Button CDB-Button--secondary u-rSpace--m u-tSpace--m js-cancel">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
      <%- _t('editor.maps.export.cancel') %>
    </span>
  </button>
  <button class="CDB-Button CDB-Button--primary u-tSpace--m js-confirm">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
      <%- _t('editor.maps.export.confirm') %>
    </span>
  </button>
</div>
