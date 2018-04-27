<div class="CDB-Text Editor-formInner">
  <label class="CDB-Legend u-upperCase CDB-Text is-semibold CDB-Size-small">Datasets</label>

  <div class="CDB-Box-modal ApiKeysForm-box-modal">
    <% if (showSearch) { %>
      <div class="CDB-Box-modalHeader">
        <div class="CDB-Box-modalHeaderItem">
          <input type="text" name="text" placeholder="Search by name" class="CDB-InputTextPlain CDB-Text js-search">
        </div>
      </div>
    <% } %>

    <ul class="js-datasets-list"></ul>
  </div>
</div>
