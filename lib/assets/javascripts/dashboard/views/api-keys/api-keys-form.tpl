<section>
  <header class="ApiKeysForm-title">
    <button class="js-back">
      <i class="CDB-IconFont CDB-IconFont-arrowPrev u-rSpace--xl"></i>
    </button>
    <h3 class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor">Configure your key</h3>
  </header>

  <div class="js-api-keys-form"></div>

  <footer class="FormAccount-footer">
    <p class="FormAccount-footerText">Changes to the key permissions are not possible once key is generated</p>
    <% if (showSubmit) { %>
      <button type="submit" class="CDB-Button CDB-Button--primary js-submit">
        <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Save changes</span>
      </button>
    <% } %>
  </footer>
</section>
