<section>
  <header class="ApiKeysForm-title">
    <button class="js-back">
      <i class="CDB-IconFont CDB-IconFont-arrowPrev u-actionTextColor u-rSpace--xl"></i>
    </button>
    <h3 class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor">
      <% if (modelIsNew) { %>
        Configure your key
      <% } else { %>
        Your API key details
      <% } %>
    </h3>
  </header>

  <div class="js-api-keys-form"></div>
  <div class="js-api-keys-tables"></div>

  <footer class="Editor-footer u-tSpace-m">
    <p class="CDB-Text CDB-Size-medium u-altTextColor">Changes to the key permissions are not possible once key is generated</p>

    <% if (modelIsNew) { %>
      <button type="submit" class="CDB-Button CDB-Button--primary CDB-Button--loading is-disabled js-submit">
        <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Save changes</span>
        <div class="CDB-Button-loader CDB-LoaderIcon is-white">
          <svg class="CDB-LoaderIcon-spinner" viewbox="0 0 50 50">
            <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"/>
          </svg>
        </div>
      </button>
    <% } %>
  </footer>
  <div class="CDB-Text CDB-Size-small u-errorTextColor js-error">
  </div>
</section>
