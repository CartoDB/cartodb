<form accept-charset="UTF-8" action="<%- formAction %>" method="post" class="js-form">
  <input name="utf8" type="hidden" value="&#x2713;" />
  <input name="authenticity_token" type="hidden" value="<%- authenticityToken %>" />
  <input name="_method" type="hidden" value="delete" />

  <div class="CDB-Text Dialog-header u-inner">
    <div class="Dialog-headerIcon Dialog-headerIcon--negative">
      <i class="CDB-IconFont CDB-IconFont-keys"></i>
    </div>
    <p class="Dialog-headerTitle">You are about to delete your application</p>
    <p class="Dialog-headerText">Remember, once you delete it there is no going back</p>
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

  <div class="Dialog-footer u-inner">
    <button type="button" class="CDB-Button CDB-Button--secondary js-cancel">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Cancel</span>
    </button>
    <button type="submit" class="CDB-Button CDB-Button--error js-save">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Delete this application</span>
    </button>
  </div>
</form>
