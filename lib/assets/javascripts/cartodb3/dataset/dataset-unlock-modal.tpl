<div class="Dialog-header">
  <div class="Dialog-headerIcon Dialog-headerIcon--positive">
    <i class="CDB-IconFont CDB-IconFont-unlock"></i>
  </div>
  <h2 class="CDB-Text CDB-Size-large u-bSpace">
    <%- _t('dataset.unlock.title', { tableName: tableName }) %>
  </h2>
  <h3 class="CDB-Text CDB-Size-medium u-altTextColor">
    <%- _t('dataset.unlock.desc') %>
  </h3>
</div>
<div class="Dialog-footer--simple u-inner">
  <button class="CDB-Button CDB-Button--secondary u-rSpace--m u-tSpace--m js-cancel">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
      <%- _t('dataset.unlock.cancel') %>
    </span>
  </button>
  <button class="CDB-Button CDB-Button--primary u-tSpace--m js-confirm">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
      <%- _t('dataset.unlock.confirm') %>
    </span>
  </button>
</div>
