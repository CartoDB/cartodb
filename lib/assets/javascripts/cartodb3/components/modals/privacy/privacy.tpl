<div class="Dialog-header Dialog-header--expanded Modal-header js-header">
  <div class="Dialog-headerIcon Dialog-headerIcon--neutral">
    <i class="CDB-IconFont CDB-IconFont-unlock"></i>
  </div>
  <h2 class="CDB-Text CDB-Size-large u-bSpace"><%- name %> <%- _t('components.modals.privacy.privacy') %></h2>
  <h3 class="CDB-Text CDB-Size-medium u-altTextColor"><%- _t('components.modals.privacy.subtitle') %></h3>
</div>

<div class="Modal-body">
  <div class="Modal-body-inner">
    <ul class="u-flex js-list"></ul>

    <div class="js-footer">
      <ul class="Modal-actions">
        <li class="Modal-actions-button">
          <button class="CDB-Button CDB-Button--secondary js-cancel">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.privacy.cancel-btn') %></span>
          </button>
        </li>
        <li class="Modal-actions-button">
          <button class="CDB-Button CDB-Button--primary js-save">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.privacy.save-btn') %></span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</div>