<% if (status === 'fetching') { %>
  <div class="InputColorCategory-loader CDB-Box-modal InputColorCategory-loader">
    <div class="CDB-LoaderIcon is-dark">
      <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
        <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
      </svg>
    </div>
  </div>
<% } else if (status === 'error') { %>
  <div class="u-flex u-alignCenter u-justifyCenter CDB-Text CDB-Size-medium u-bSpace--m u-tSpace--m u-errorTextColor"><%- _t('components.backbone-forms.select.error', {
    type: type
  }) %></div>
<% } %>