<li class="Modal-listActionsitem">
  <button class="CDB-Button CDB-Button--secondary CDB-Button--big js-close">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
      <%- _t('components.modals.maps-metadata.cancel-btn') %>
    </span>
  </button>
</li>
<li class="Modal-listActionsitem">
  <button class="CDB-Button CDB-Button--primary CDB-Button--big js-save <%- canFinish ? '' : 'is-disabled' %>">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase ">
      <%- _t('components.modals.maps-metadata.save-btn') %>
    </span>
  </button>
</li>

