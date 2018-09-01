<div class="js-info">
  <h1 class="Sessions-title u-tspace-m">
    <% if (state === "success") { %>
      <%- _t('dashboard.confirmation.confirm_info.account_ready') %>
    <% } else if (state === "failure") { %>
      <%- _t('dashboard.confirmation.confirm_info.problem') %>
    <% } else { %>
      <%- _t('dashboard.confirmation.confirm_info.account_created') %>
    <% } %>
  </h1>
  <p class="Sessions-description">
    <% if (state === "success") { %>
      <% if (googleSignup) { %>
        <%- _t('dashboard.confirmation.confirm_info.redir_dashboard') %>
      <% } else if (!requiresValidationEmail) { %>
        <%- _t('dashboard.confirmation.confirm_info.redir_login') %>
      <% } else { %>
        <%- _t('dashboard.confirmation.confirm_info.check_email') %>
      <% }%>
    <% } else if (state === "failure") { %>
      <%- _t('dashboard.confirmation.confirm_info.problem_contact') %>
    <% } else { %>
      <%- _t('dashboard.confirmation.confirm_info.take_time') %>
    <% } %>
  </p>
</div>
