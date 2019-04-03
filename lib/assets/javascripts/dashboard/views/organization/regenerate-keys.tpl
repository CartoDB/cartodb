<%
if (scope === 'organization') {
  person_scope = _t('dashboard.views.organization.you_and_org');
} else if (scope === 'organization_user') {
  person_scope = _t('dashboard.views.organization.the_user');
} else {
  person_scope = _t('dashboard.views.organization.you');
}
if (type === "api") {
  typeStr = _t('dashboard.views.organization.api');
} else {
  typeStr = _t('dashboard.views.organization.oauth');
}
%>

<div class="CDB-Text Dialog-header u-inner">
  <div class="Dialog-headerIcon Dialog-headerIcon--negative">
    <i class="CDB-IconFont CDB-IconFont-keys"></i>
  </div>
  <p class="Dialog-headerTitle u-ellipsLongText">
  <% if (scope === 'organization') { %>
    <%= _t('dashboard.views.organization.about_regen_all', {type: typeStr}) %>
  <% } else if (scope === 'organization_user') { %>
    <%= _t('dashboard.views.organization.about_regen_user', {type: typeStr}) %>
  <% } else { %>
    <%= _t('dashboard.views.organization.about_regen_your', {type: typeStr}) %>
  <% } %>
  </p>
  <p class="Dialog-headerText">
    <% if (type === "api") { %>
      <%= _t('dashboard.views.organization.update_api', {scope: person_scope}) %>
    <% } else { %>
      <%= _t('dashboard.views.organization.update_oauth', {scope: person_scope}) %>
    <% } %>
  </p>
</div>
<form action="<%- form_action %>" method="post">
  <% if (passwordNeeded) { %>
    <div class="CDB-Text Dialog-body">
      <div class="Form-row Form-row--centered has-label">
        <div class="Form-rowLabel">
          <label class="Form-label"><%= _t('dashboard.views.organization.your_passwd') %></label>
        </div>
        <div class="Form-rowData">
          <input type="password" id="deletion_password_confirmation" name="password_confirmation" class="CDB-InputText CDB-Text Form-input Form-input--long" value=""/>
        </div>
      </div>
    </div>
  <% } %>

  <div class="Dialog-footer u-inner">
    <button type="button" class="CDB-Button CDB-Button--secondary js-cancel">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.organization.cancel') %></span>
    </button>

    <input name="utf8" type="hidden" value="&#x2713;" />
    <input name="_method" type="hidden" value="<%- method %>" />
    <input name="authenticity_token" type="hidden" value="<%- authenticity_token %>" />
    <button type="submit" class="CDB-Button CDB-Button--error">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.organization.type', {type: typeStr}) %></span>
    </button>
  </div>
</form>
