<form accept-charset="UTF-8" action="<%- formAction %>" method="post" class="js-form">
  <input name="utf8" type="hidden" value="&#x2713;" />
  <input name="authenticity_token" type="hidden" value="<%- authenticityToken %>" />
  <input name="_method" type="hidden" value="delete" />

  <div class="CDB-Text Dialog-header u-inner">
    <div class="Dialog-headerIcon Dialog-headerIcon--negative">
      <i class="CDB-IconFont CDB-IconFont-defaultUser"></i>
    </div>
    <p class="Dialog-headerTitle"><%= _t('dashboard.views.organization.about_del_usr', {username: username}) %></p>
    <p class="Dialog-headerText">
      <%= _t('dashboard.views.organization.all_lost', {username: username}) %>
      <% if (passwordNeeded) { %>
        <%= _t('dashboard.views.organization.type_passwd') %>
      <% } %>
    </p>
  </div>

  <% if (passwordNeeded) { %>
    <div class="CDB-Text Dialog-body">
      <div class="Form-row Form-row--centered has-label">
        <div class="Form-rowLabel">
          <label class="Form-label"><%- _t('dashboard.views.organization.your_passwd') %></label>
        </div>
        <div class="Form-rowData">
          <input type="password" id="deletion_password_confirmation" name="password_confirmation" class="CDB-InputText CDB-Text Form-input Form-input--long" value=""/>
        </div>
      </div>
    </div>
  <% } %>

  <div class="CDB-Text Dialog-footer u-inner">
    <button class="CDB-Button CDB-Button--secondary Dialog-footerBtn js-cancel" type="button">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%- _t('dashboard.views.organization.cancel') %></span>
    </button>
    <button type="submit" class="CDB-Button CDB-Button--error js-ok">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%- _t('dashboard.views.organization.delete_usr', {username: username}) %></span>
    </button>
  </div>
</form>
