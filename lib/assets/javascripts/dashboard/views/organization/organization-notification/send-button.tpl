<p class="Md-counter CDB-Text CDB-Size-medium u-secondaryTextColor u-rSpace--xl <% if (isNegative) { %>Md-counter--negative<% } %>"><%= counter %></p>

<button class="OrganizationNotifications-button CDB-Button CDB-Button--primary <% if (isDisabled) { %>is-disabled<% } %> js-button js-save">
  <div class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase u-flex">
    <% if (isLoading) { %>
      <div class="CDB-LoaderIcon CDB-LoaderIcon--small u-iBlock">
        <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
          <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
        </svg>
      </div>
      <%= _t('dashboard.views.organization.org_notif.sending') %>
    <% } else { %>
      <%= _t('dashboard.views.organization.org_notif.send') %>
    <% } %>
  </div>
</button>
