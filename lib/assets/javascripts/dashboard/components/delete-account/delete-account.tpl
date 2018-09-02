<form accept-charset="UTF-8" class="js-form">
  <div class="CDB-Text Dialog-header u-inner">
    <div class="Dialog-headerIcon Dialog-headerIcon--negative">
      <i class="CDB-IconFont CDB-IconFont-defaultUser"></i>
    </div>
    <p class="Dialog-headerTitle"><%= _t('dashboard.components.delete_account.delete_account.about_delete') %></p>
    <p class="Dialog-headerText">
      <%= _t('dashboard.components.delete_account.delete_account.remember') %><br/>
      <%= _t('dashboard.components.delete_account.delete_account.are_you_sure') %><br/>
      <% if (passwordNeeded) { %>
        <%= _t('dashboard.components.delete_account.delete_account.provide_password') %>
      <% } %>
    </p>
  </div>

  <% if (passwordNeeded) { %>
    <div class="CDB-Text Dialog-body">
      <div class="Form-row Form-row--centered has-label">
        <div class="Form-rowLabel">
          <label class="Form-label"><%= _t('dashboard.components.delete_account.delete_account.your_password') %></label>
        </div>
        <div class="Form-rowData">
          <input
            type="password"
            id="deletion_password_confirmation"
            name="deletion_password_confirmation"
            class="CDB-InputText CDB-Text Form-input Form-input--long <%- isLoading ? 'is-disabled' : '' %>"
            value=""
          />
        </div>
      </div>
    </div>
  <% } %>

  <% if (error) { %>
    <p class="CDB-Text CDB-Size-medium u-errorTextColor u-flex u-justifyCenter"><%- error %></p>
  <% } %>

  <div class="Dialog-footer u-inner">
    <button type="button" class="CDB-Button CDB-Button--secondary js-cancel">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.components.delete_account.delete_account.cancel') %></span>
    </button>
    <button type="submit" class="CDB-Button CDB-Button--error js-ok">
      <% if (isLoading) { %>
        <div class="CDB-LoaderIcon CDB-LoaderIcon--small u-iBlock">
          <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
            <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
          </svg>
        </div>
      <% } else { %>
        <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.components.delete_account.delete_account.delete_account') %></span>
      <% } %>
    </button>
  </div>
</form>
