<% if (canUpgrade) { %>
  <a href="<%- upgradeUrl %>" class="PrivacyToggler js-toggler PrivacyToggler--<%- privacy %> is-disabled"
    data-title="<%- _t('components.modals.add-layer.footer.privacy-change-not-allowed') %>">
    <i class="CDB-IconFont CDB-IconFont-<%- icon %>"></i>
  </a>
<% } else {%>
  <button type="button" class="PrivacyToggler js-toggler PrivacyToggler--<%- privacy %> <%- isDisabled ? 'is-disabled' : '' %>"
    data-title="
      <% if (!isDisabled) { %>
        <%- _t('components.modals.add-layer.footer.privacy-change', { privacy: privacy.toLowerCase() }) %>.<br /><%- _t('components.modals.add-layer.footer.privacy-click', { nextPrivacy: nextPrivacy.toLowerCase() }) %>.
      <% } else { %>
        <%- _t('components.modals.add-layer.footer.privacy-change-banned') %>
      <% } %>
    ">
    <i class="CDB-IconFont CDB-IconFont-<%- icon %>"></i>
  </button>
<% } %>
