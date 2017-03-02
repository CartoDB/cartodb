<div class="u-flex u-justifyCenter">
  <div class="Modal-inner Modal-inner--grid u-flex u-justifyCenter">
    <div class="Modal-icon">
      <i class="CDB-IconFont CDB-IconFont-question"></i>
    </div>
    <div>
      <h2 class=" CDB-Text CDB-Size-huge is-light u-bSpace--xl">
        <%- _t('dataset.rename.title', { tableName: tableName }) %>
      </h2>
      <p class="CDB-Text CDB-Size-large u-altTextColor"><%- _t('dataset.rename.desc') %></p>
      <ul class="Modal-listActions u-flex u-alignCenter">
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--secondary CDB-Button--big js-cancel">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
              <%- _t('dataset.rename.cancel') %>
            </span>
          </button>
        </li>
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--primary CDB-Button--big js-confirm">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
              <%- _t('dataset.rename.confirm') %>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</div>