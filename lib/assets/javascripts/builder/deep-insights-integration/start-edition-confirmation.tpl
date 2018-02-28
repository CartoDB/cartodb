<div class="u-flex u-justifyCenter">
  <div class="Modal-inner Modal-inner--grid u-flex u-justifyCenter">
    <div class="Modal-icon">
      <svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 25l2.262-6.787 16.59-16.59c.832-.83 2.185-.83 3.016 0l1.508 1.51c.83.83.83 2.182 0 3.015l-16.59 16.59L1 25zM21.36 9.165L16.835 4.64l4.525 4.525zM7.787 22.738l-4.525-4.525 4.525 4.525z" stroke="#F19243" fill="none" fill-rule="evenodd"/>
      </svg>
    </div>
    <div>
      <h2 class=" CDB-Text CDB-Size-huge is-light u-bSpace--m"><%- _t('components.modals.edit-feature.confirmation.title') %></h2>
      <p class="CDB-Text CDB-Size-medium u-altTextColor"><%- _t('components.modals.edit-feature.confirmation.desc') %></p>
      <ul class="Modal-listActions u-flex u-alignCenter">
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--secondary CDB-Button--big js-cancel">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
              <%- _t('components.modals.edit-feature.confirmation.cancel') %>
            </span>
          </button>
        </li>
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--primary CDB-Button--big js-confirm">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.edit-feature.confirmation.continue') %></span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</div>
