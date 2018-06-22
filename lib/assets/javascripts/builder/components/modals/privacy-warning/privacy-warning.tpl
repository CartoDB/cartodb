<div class="u-flex u-justifyCenter">
  <div class="Modal-inner Modal-inner--grid u-flex u-justifyCenter">
    <div class="Modal-icon">
      <div class="Modal-icon--svg js-icon-warning"></div>
    </div>
    <div>
      <h2 class="CDB-Text CDB-Size-huge is-light u-bSpace--xl">
        <%- _t('components.modals.privacy-warning.title.' + type + '.' + selectedPrivacyType) %>
      </h2>
      <p class="CDB-Text CDB-Size-large u-altTextColor">
          <%- _t('components.modals.privacy-warning.description.' + selectedPrivacyType) %>
      </p>
      <ul class="Modal-listActions u-flex u-alignCenter">
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--secondary CDB-Button--big js-cancel">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
                <%- _t('components.modals.privacy-warning.cancel') %>
            </span>
          </button>
        </li>
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--primary CDB-Button--big js-confirm">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
                <%- _t('components.modals.privacy-warning.confirm') %>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</div>
