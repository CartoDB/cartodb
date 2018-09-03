<div class="CDB-Text Dialog-header u-inner">
  <div class="Dialog-headerIcon Dialog-headerIcon--negative">
    <i class="CDB-IconFont CDB-IconFont-cloud"></i>
  </div>
  <p class="Dialog-headerTitle">
    <%= _t('dashboard.views.account.serv_disc_dlg.serv_disc_dlg.disconnect', {title: title}) %>
  </p>
  <p class="Dialog-headerText">
  <% if (revoke_url) { %>
    <%= _t('dashboard.views.account.serv_disc_dlg.serv_disc_dlg.revoke') %>
  <% } else { %>
    <%= _t('dashboard.views.account.serv_disc_dlg.serv_disc_dlg.sure', {title: title}) %>
  <% } %>
  </p>
</div>

<% if (revoke_url) { %>
  <div class="Dialog-body">
    <p class="DefaultParagraph DefaultParagraph--short DefaultParagraph--centered DefaultParagraph--spaced">
      <%= _t('dashboard.views.account.serv_disc_dlg.serv_disc_dlg.revoke_auto', {title: title}) %>
    </p>
    <p class="DefaultParagraph DefaultParagraph--short DefaultParagraph--centered DefaultParagraph--spaced">
      <%= _t('dashboard.views.account.serv_disc_dlg.serv_disc_dlg.security', {title: title}) %>
    </p>
  </div>
<% } %>

<div class="Dialog-footer u-inner">
  <% if (revoke_url) { %>
    <a href="<%- revoke_url%>" target="_blank" class="Button Button-inner Button--inline Button--secondary ">
      <span><%= _t('dashboard.views.account.serv_disc_dlg.serv_disc_dlg.goto', {title: title}) %></span>
    </a>
  <% } else { %>
    <button class="CDB-Text Button Button--secondary Dialog-footerBtn Button--inline js-cancel">
      <span><%= _t('dashboard.views.account.serv_disc_dlg.serv_disc_dlg.cancel') %></span>
    </button>
    <button class="CDB-Text js-revoke Button Button--negative Button--inline">
      <span><%= _t('dashboard.views.account.serv_disc_dlg.serv_disc_dlg.revoke2') %></span>
    </button>
  <% } %>
</div>
