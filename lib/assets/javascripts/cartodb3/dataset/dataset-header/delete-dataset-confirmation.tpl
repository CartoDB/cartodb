<div class="Dialog-header">
  <div class="Dialog-headerIcon Dialog-headerIcon--negative">
    <i class="CDB-IconFont CDB-IconFont-trash"></i>
  </div>
  <h2 class="CDB-Text CDB-Size-large u-bSpace u-errorTextColor">
    <%- _t('dataset.delete.title', { tableName: tableName }) %>
  </h2>
  <h3 class="CDB-Text CDB-Size-medium u-altTextColor">
    <%- _t('dataset.delete.desc') %>
  </h3>
</div>
<div class="Dialog-footer--simple u-inner">
  <button class="CDB-Button CDB-Button--secondary u-rSpace--m u-tSpace--m js-cancel">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
      <%- _t('dataset.delete.cancel') %>
    </span>
  </button>
  <button class="CDB-Button CDB-Button--error u-tSpace--m js-confirm">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
      <%- _t('dataset.delete.confirm') %>
    </span>
  </button>
</div>
