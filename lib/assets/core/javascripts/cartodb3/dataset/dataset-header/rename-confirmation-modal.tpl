<div class="Dialog-header">
  <div class="Dialog-headerIcon Dialog-headerIcon--alert">
    <i class="CDB-IconFont CDB-IconFont-question"></i>
  </div>
  <h2 class="CDB-Text CDB-Size-large u-bSpace">
    <%- _t('dataset.rename.title', { tableName: tableName }) %>
  </h2>
  <h3 class="CDB-Text CDB-Size-medium u-altTextColor">
    <%- _t('dataset.rename.desc') %>
  </h3>
</div>
<div class="Dialog-footer--simple u-inner">
  <button class="CDB-Button CDB-Button--secondary u-rSpace--m u-tSpace--m js-cancel">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
      <%- _t('dataset.rename.cancel') %>
    </span>
  </button>
  <button class="CDB-Button CDB-Button--alert u-tSpace--m js-confirm">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
      <%- _t('dataset.rename.confirm') %>
    </span>
  </button>
</div>
