<% if (state !== 'list' ) { %>
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m">
    <% if (state === 'selected') { %>
      <%- _t('components.modals.add-layer.imports.mailchimp.campaign-selected', { brand: 'MailChimp' }) %>
    <% } else { %>
      <%- _t('components.modals.add-layer.imports.mailchimp.map-campaign', { brand: 'MailChimp' }) %>
    <% } %>
  </h3>
  <p class="CDB-Text CDB-Size-medium u-altTextColor <% if (state === "error") { %>ImportPanel-headerDescription--negative<% } %>">
    <% if (state === "idle") { %>
      <%- _t('components.modals.add-layer.imports.mailchimp.state-idle', { brand: 'MailChimp' }) %>
    <% } %>
    <% if (state === "error") { %>
      <%- _t('components.modals.add-layer.imports.mailchimp.state-error', { brand: 'MailChimp' }) %>
    <% } %>
    <% if (state === "token") { %>
      <%- _t('components.modals.add-layer.imports.mailchimp.state-token', { brand: 'MailChimp' }) %>
    <% } %>
    <% if (state === "oauth") { %>
      <%- _t('components.modals.add-layer.imports.mailchimp.state-oauth', { brand: 'MailChimp' }) %>
    <% } %>
    <% if (state === "retrieving") { %>
      <%- _t('components.modals.add-layer.imports.mailchimp.state-retrieving', { brand: 'MailChimp' }) %>
    <% } %>
    <% if (state === "selected") { %>
      <%- _t('components.modals.add-layer.imports.mailchimp.state-selected', { brand: 'MailChimp' }) %>
    <% } %>
  </p>
  <% if (state === "selected") { %>
    <button class="NavButton NavButton--back ImportPanel-headerButton js-back">
      <i class="CDB-IconFont CDB-IconFont-arrowPrev"></i>
    </button>
  <% } %>
<% } %>
