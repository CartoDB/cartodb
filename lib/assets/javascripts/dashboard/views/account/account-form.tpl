<form accept-charset="UTF-8">

  <!-- Username -->
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

  <!-- Change password -->
  <% if (!hidePasswordFields) { %>
    <div class="VerticalAligned--FormRow">
      <div class="FormAccount-row">
        <div class="FormAccount-rowLabel">
          <label class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor"><%= _t('account.views.form.new_password') %></label>
        </div>
        <div class="FormAccount-rowData">
          <input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med <% if (errors['new_password']) { %>has-error<% } %> <% if (!canChangePassword) { %>is-disabled<% } %>" id="user_new_password" name="user[new_password]" size="30" type="password" autocomplete="off" <% if (!canChangePassword) { %>readonly="readonly"<% } %>>
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
          <input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med <% if (!canChangePassword) { %>is-disabled<% } %>" id="confirm_password" name="user[confirm_password]" size="30" type="password" autocomplete="off" <% if (!canChangePassword) { %>readonly="readonly"<% } %>>
        </div>
      </div>
    </div>
  <% } %>

  <%= accountFormExtension %>

  <!-- Multifactor authentication -->
  <div class="FormAccount-row">
    <div class="FormAccount-rowLabel">
      <label class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor">
        <%= _t('account.views.form.multifactor_authentication') %>
      </label>
    </div>
    <div class="FormAccount-rowData u-tspace-s u-vspace-s">
      <div class="Toggler">
        <input name="user[mfa]" type="hidden" value="0">
        <input class="js-toggle-mfa" id="mfa" name="user[mfa]" type="checkbox" value="1" <% if (mfaEnabled) { %>checked="checked"<% } %>>
        <label for="mfa"></label>
      </div>
      <div class="FormAccount-rowInfo u-lSpace--xl">
        <p class="CDB-Text CDB-Size-medium js-mfa-label">
          <%= mfaEnabled ? _t('account.views.form.mfa_enabled') : _t('account.views.form.mfa_disabled') %>
        </p>
      </div>
    </div>
    <div class="FormAccount-rowData u-tspace-xs u-vspace-s">
      <p class="CDB-Text CDB-Size-small u-altTextColor"><%= _t('account.views.form.mfa_description') %></p>
    </div>
  </div>

  <!-- Account type -->
  <% if (isCartoDBHosted) { %>
    <% if ((isOrgAdmin || isOrgOwner) && licenseExpiration) { %>
      <div class="FormAccount-title">
        <p class="FormAccount-titleText"><%= _t('account.views.form.account_type') %></p>
      </div>

      <span class="FormAccount-separator"></span>

      <div class="FormAccount-row">
        <div class="FormAccount-rowLabel">
          <label
            class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor"><%= _t('account.views.form.license_expiration') %>
          </label>
        </div>
        <div class="FormAccount-rowData">
          <input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med is-disabled" id="license-expiration"
            name="license-expiration" readonly="readonly" size="30" type="text" value="<%= licenseExpiration %>">
          <div class="FormAccount-rowInfo FormAccount-rowInfo--marginLeft">
            <p class="CDB-Text CDB-Size-small u-altTextColor"><%= _t('account.views.form.license_renew_info') %></p>
          </div>
        </div>
      </div>
    <% } %>
  <% } else { %>
    <% if (!isInsideOrg && !isFree2020User || isOrgOwner) { %>
    <div class="FormAccount-title">
      <p class="FormAccount-titleText"><%= _t('account.views.form.account_type') %></p>
    </div>

    <span class="FormAccount-separator"></span>

    <div class="FormAccount-row">
      <div class="FormAccount-rowLabel">
        <label
          class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor"><%= _t('account.views.form.billing_plan') %></label>
      </div>
      <div class="FormAccount-rowData">
        <div class="FormAccount-planTag CDB-Size-medium"><%= planName %></div>
        <div class="FormAccount-rowInfo FormAccount-rowInfo--marginLeft">
          <p class="FormAccount-rowInfoText CDB-Size-medium"><a href="<%= planUrl %>"
              class="FormAccount-link"><%= _t('account.views.form.view_details') %></a></p>
        </div>
      </div>
    </div>
    <% } %>
  <% } %>

  <!-- Email settings -->
  <% if (Object.keys(notifications).length > 0) { %>
    <div class="FormAccount-title">
      <p class="FormAccount-titleText"><%= _t('account.views.form.email_section.title') %></p>
    </div>

    <span class="FormAccount-separator"></span>

    <div class="FormAccount-row FormAccount-row--mediumMarginBottom">
      <p class="CDB-Text CDB-Size-medium"><%= _t('account.views.form.email_section.description') %></p>
    </div>
    
    <div class="FormAccount-row">
      <!-- One row per notification (eg: do_subscriptions) -->
      <% Object.keys(notifications).forEach(function (notificationKey) { %>
      <div class="FormAccount-rowData FormAccount-rowData--listItemWithAction">
        <label class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor">
          <!-- extract to a 'description' property -->
          <%= _t('account.views.form.email_section.notifications.' + notificationKey) %>
        </label>
        
        <div class="FormAccount-rowData">
          <div class="Toggler">
            <input name="<%='notifications[' + notificationKey + ']'%>" type="hidden" value="0">
            <input class="js-toggle-notification <%='js-toggle-notification-' + notificationKey%>" id="<%=notificationKey%>" name="<%='notifications[' + notificationKey + ']'%>" type="checkbox" value="1" <% if (notifications[notificationKey]) { %>checked="checked"<% } %>>
            <label for="<%=notificationKey%>"></label>
          </div>
        
          <div class="FormAccount-rowInfo u-lSpace--xl">
            <p class="CDB-Text CDB-Size-medium <%='js-notification-label-' + notificationKey%>">
              <%= notifications[notificationKey] ? _t('account.views.form.email_section.notifications.enabled') : _t('account.views.form.email_section.notifications.disabled') %>
            </p>
          </div>
        </div>
      </div>
      <% }); %>
    </div> 
  <% } %>

  <!-- Delete account -->
  <div class="FormAccount-footer <% if (cantBeDeletedReason) { %>FormAccount-footer--noMarginBottom<% } %>">
    <% if (cantBeDeletedReason) { %>
      <p class="FormAccount-footerText">
        <i class="CDB-IconFont CDB-IconFont-info FormAccount-footerIcon"></i>
        <span><%= cantBeDeletedReason %></span>
      </p>
    <% } else { %>
      <p class="FormAccount-footerText"></p>
    <% } %>

    <button type="submit" class="CDB-Button CDB-Button--primary js-save">
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
