<form accept-charset="UTF-8">
  <div class="FormAccount-row">
    <div class="FormAccount-rowLabel">
      <label class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor"><%= _t('account.views.form.username') %></label>
    </div>
    <div class="FormAccount-rowData">
      <input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med is-disabled" id="user_username" name="user[username]" readonly="readonly" size="30" type="text" value="<%= username %>">

      <div class="FormAccount-rowInfo FormAccount-rowInfo--marginLeft">
        <p class="CDB-Text CDB-Size-small u-altTextColor"><%= _t('account.views.form.subdomain_info') %></p>
      </div>
    </div>
  </div>

  <% if (!hidePasswordFields) { %>
    <% if (shouldDisplayOldPassword) { %>
      <div class="FormAccount-row">
        <div class="FormAccount-rowLabel">
          <label class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor"><%= _t('account.views.form.old_password') %></label>
        </div>
        <div class="FormAccount-rowData">
          <input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med <% if (errors['old_password']) { %>has-error<% } %> <% if (!canChangePassword) { %>is-disabled<% } %>" id="user_old_password" name="user[old_password]" size="30" type="password" <% if (!canChangePassword) { %>readonly="readonly"<% } %>>
        </div>
        <div class="FormAccount-rowInfo">
          <% if (errors['old_password']) { %>
            <p class="FormAccount-rowInfoText FormAccount-rowInfoText--error u-tSpace"><%= errors['old_password'][0] %></p>
          <% } %>
        </div>
      </div>
    <% } %>

    <div class="VerticalAligned--FormRow">
      <div class="FormAccount-row">
        <div class="FormAccount-rowLabel">
          <label class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor"><%= _t('account.views.form.new_password') %></label>
        </div>
        <div class="FormAccount-rowData">
          <input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med <% if (errors['new_password']) { %>has-error<% } %> <% if (!canChangePassword) { %>is-disabled<% } %>" id="user_new_password" name="user[new_password]" size="30" type="password" <% if (!canChangePassword) { %>readonly="readonly"<% } %>>
        </div>
        <div class="FormAccount-rowInfo">
          <% if (errors['new_password']) { %>
            <p class="FormAccount-rowInfoText FormAccount-rowInfoText--error u-tSpace"><%= errors['new_password'][0] %></p>
          <% } %>
        </div>
      </div>

      <div class="FormAccount-row js-confirmPassword">
        <div class="FormAccount-rowLabel">
          <label class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor"><%= _t('account.views.form.confirm_password') %></label>
        </div>
        <div class="FormAccount-rowData">
          <input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med <% if (!canChangePassword) { %>is-disabled<% } %>" id="confirm_password" name="user[confirm_password]" size="30" type="password" <% if (!canChangePassword) { %>readonly="readonly"<% } %>>
        </div>
      </div>
    </div>
  <% } %>

  <% if ((!isInsideOrg || isOrgOwner) && !isCartoDBHosted) { %>
    <div class="FormAccount-title">
      <p class="FormAccount-titleText"><%= _t('account.views.form.account_type') %></p>
    </div>

    <span class="FormAccount-separator"></span>

    <div class="FormAccount-row">
      <div class="FormAccount-rowLabel">
        <label class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor"><%= _t('account.views.form.billing_plan') %></label>
      </div>
      <div class="FormAccount-rowData">
        <div class="FormAccount-planTag CDB-Size-medium"><%= planName %></div>
        <div class="FormAccount-rowInfo FormAccount-rowInfo--marginLeft">
          <p class="FormAccount-rowInfoText CDB-Size-medium"><a href="<%= planUrl %>" class="FormAccount-link"><%= _t('account.views.form.view_details') %></a></p>
        </div>
      </div>
    </div>
  <% } %>

  <% if (services.length > 0) { %>
    <div class="FormAccount-title">
      <p class="FormAccount-titleText"><%= _t('account.views.form.connect_external_datasources') %></p>
    </div>

    <span class="FormAccount-separator"></span>

    <div class="js-datasourcesContent"></div>
  <% } %>

  <div class="FormAccount-footer <% if (cantBeDeletedReason) { %>FormAccount-footer--noMarginBottom<% } %>">
    <% if (cantBeDeletedReason) { %>
      <p class="FormAccount-footerText">
        <i class="CDB-IconFont CDB-IconFont-info FormAccount-footerIcon"></i>
        <span><%= cantBeDeletedReason %></span>
      </p>
    <% } else { %>
      <p class="FormAccount-footerText"></p>
    <% } %>

    <button type="submit" class="CDB-Button CDB-Button--primary">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('account.views.form.save_changes') %></span>
    </button>
  </div>

  <% if (!cantBeDeletedReason) { %>
    <div class="FormAccount-title">
      <p class="FormAccount-titleText"><%= _t('account.views.form.delete_account') %></p>
    </div>

    <span class="FormAccount-separator"></span>

    <div class="FormAccount-row FormAccount-row--wideMarginBottom">
      <div class="FormAccount-rowLabel">
        <label class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor"><%= _t('account.views.form.confirm') %></label>
      </div>
      <div class="FormAccount-rowData">
        <span class="FormAccount-button--deleteAccount CDB-Size-medium js-deleteAccount"><%= _t('account.views.form.delete_all') %></span>
      </div>
    </div>
  <% } %>
</form>
