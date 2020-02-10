<form accept-charset="UTF-8" action="<%- formAction %>" method="post" class="js-form">
  <input name="utf8" type="hidden" value="&#x2713;" />
  <input name="authenticity_token" type="hidden" value="<%- authenticityToken %>" />
  <input name="_method" type="hidden" value="delete" />

  <div class="CDB-Text Dialog-header u-inner">
    <div class="Dialog-headerIcon Dialog-headerIcon--negative">
      <i class="CDB-IconFont CDB-IconFont-defaultUser"></i>
    </div>
    <p class="Dialog-headerTitle">You are about to delete <%- username %>'s account.</p>
    <p class="Dialog-headerText">
      By deleting this account all <%- username %>'s maps and datasets will be lost,
      but extra credits will be reassigned to your user.
      <% if (passwordNeeded) { %>
        Type your password, please.
      <% } %>
    </p>
  </div>

  <% if (passwordNeeded) { %>
    <div class="CDB-Text Dialog-body">
      <div class="Form-row Form-row--centered has-label">
        <div class="Form-rowLabel">
          <label class="Form-label">Your password</label>
        </div>
        <div class="Form-rowData">
          <input type="password" autocomplete="off" id="deletion_password_confirmation" name="password_confirmation" class="CDB-InputText CDB-Text Form-input Form-input--long" value=""/>
        </div>
      </div>
    </div>
  <% } %>

  <div class="CDB-Text Dialog-footer u-inner">
    <button class="CDB-Button CDB-Button--secondary Dialog-footerBtn js-cancel" type="button">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Cancel</span>
    </button>
    <button type="submit" class="CDB-Button CDB-Button--error js-ok">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Yes, delete <%- username %> account</span>
    </button>
  </div>
</form>
