<header class="ApiKeysForm-title">
  <button class="js-back">
    <i class="CDB-IconFont CDB-IconFont-arrowPrev u-rSpace--xl"></i>
  </button>
  <h3 class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor">Configure your key</h3>
</header>

<form class="js-api-keys-form">
  <div class="FormAccount-row">
    <div class="FormAccount-rowLabel">
      <label class="CDB-Text CDB-Size-medium u-mainTextColor">Name</label>
    </div>
    <div class="FormAccount-rowData">
      <input
        name="name"
        class="CDB-InputText CDB-Text FormAccount-input"
        placeholder="Application name"
        required="required"
        type="text">
    </div>
  </div>

  <div class="FormAccount-row">
    <div class="FormAccount-rowLabel">
      <label class="CDB-Text CDB-Size-medium u-mainTextColor">API Key</label>
    </div>
    <div class="FormAccount-rowData">
      <input
        name="token"
        class="CDB-InputText CDB-Text FormAccount-input"
        placeholder="Application name"
        required="required"
        type="text">
    </div>
  </div>

  <div class="FormAccount-row">
    <div class="FormAccount-rowLabel">
      <label class="CDB-Text CDB-Size-medium u-mainTextColor">Type</label>
    </div>
    <div class="FormAccount-rowData">
      <fieldset name="type">
        <div class="u-iblock CDB-Text CDB-Size-medium u-rSpace--xl">
          <input class="CDB-Checkbox" type="checkbox" name="sql" value="true">
          <span class="u-iBlock CDB-Checkbox-face"></span>
          <label class="u-iBlock u-lSpace u-upperCase u-rSpace">SQL</label>
        </div>

        <div class="u-iblock CDB-Text CDB-Size-medium u-rSpace--xl">
          <input class="CDB-Checkbox" type="checkbox" name="map" value="true">
          <span class="u-iBlock CDB-Checkbox-face"></span>
          <label class="u-iBlock u-lSpace u-upperCase u-rSpace">Map</label>
        </div>

        <div class="u-iblock CDB-Text CDB-Size-medium u-rSpace--xl">
          <input class="CDB-Checkbox" type="checkbox" name="import" value="true">
          <span class="u-iBlock CDB-Checkbox-face"></span>
          <label class="u-iBlock u-lSpace u-upperCase u-rSpace">Import</label>
        </div>

        <div class="u-iblock CDB-Text CDB-Size-medium u-rSpace--xl">
          <input class="CDB-Checkbox" type="checkbox" name="analysis" value="true">
          <span class="u-iBlock CDB-Checkbox-face"></span>
          <label class="u-iBlock u-lSpace u-upperCase u-rSpace">Analysis</label>
        </div>
      </fieldset>
    </div>
  </div>

  <div class="ApiKeysForm-datasets">
    <div class="ApiKeysForm-datasetsHeader">
      <input type="text" placeholder="Search by..." class="CDB-InputTextPlain CDB-Text">
    </div>
    <ul class="ApiKeysForm-datasetsList">
      <li class="ApiKeysForm-datasetsListItem u-flex u-justifySpace">
        <a href="#">10m populated places</a>
        <fieldset>
          <div class="u-iblock CDB-Text CDB-Size-medium u-rSpace--xl">
            <input class="CDB-Checkbox" type="checkbox" name="read" value="true">
            <span class="u-iBlock CDB-Checkbox-face"></span>
            <label class="u-iBlock u-lSpace u-upperCase u-rSpace">Read</label>
          </div>

          <div class="u-iblock CDB-Text CDB-Size-medium u-rSpace--xl">
            <input class="CDB-Checkbox" type="checkbox" name="insert" value="true">
            <span class="u-iBlock CDB-Checkbox-face"></span>
            <label class="u-iBlock u-lSpace u-upperCase u-rSpace">Insert</label>
          </div>

          <div class="u-iblock CDB-Text CDB-Size-medium u-rSpace--xl">
            <input class="CDB-Checkbox" type="checkbox" name="write" value="true">
            <span class="u-iBlock CDB-Checkbox-face"></span>
            <label class="u-iBlock u-lSpace u-upperCase u-rSpace">Write</label>
          </div>

          <div class="u-iblock CDB-Text CDB-Size-medium u-rSpace--xl">
            <input class="CDB-Checkbox" type="checkbox" name="delete" value="true">
            <span class="u-iBlock CDB-Checkbox-face"></span>
            <label class="u-iBlock u-lSpace u-upperCase u-rSpace">Delete</label>
          </div>
        </fieldset>
      </li>

      <li class="ApiKeysForm-datasetsListItem u-flex u-justifySpace">
        <a href="#">some other dataset</a>
        <fieldset>
          <div class="u-iblock CDB-Text CDB-Size-medium u-rSpace--xl">
            <input class="CDB-Checkbox" type="checkbox" name="read" value="true">
            <span class="u-iBlock CDB-Checkbox-face"></span>
            <label class="u-iBlock u-lSpace u-upperCase u-rSpace">Read</label>
          </div>

          <div class="u-iblock CDB-Text CDB-Size-medium u-rSpace--xl">
            <input class="CDB-Checkbox" type="checkbox" name="insert" value="true">
            <span class="u-iBlock CDB-Checkbox-face"></span>
            <label class="u-iBlock u-lSpace u-upperCase u-rSpace">Insert</label>
          </div>

          <div class="u-iblock CDB-Text CDB-Size-medium u-rSpace--xl">
            <input class="CDB-Checkbox" type="checkbox" name="write" value="true">
            <span class="u-iBlock CDB-Checkbox-face"></span>
            <label class="u-iBlock u-lSpace u-upperCase u-rSpace">Write</label>
          </div>

          <div class="u-iblock CDB-Text CDB-Size-medium u-rSpace--xl">
            <input class="CDB-Checkbox" type="checkbox" name="delete" value="true">
            <span class="u-iBlock CDB-Checkbox-face"></span>
            <label class="u-iBlock u-lSpace u-upperCase u-rSpace">Delete</label>
          </div>
        </fieldset>
      </li>
    </ul>
  </div>

  <div class="FormAccount-footer">
    <p class="FormAccount-footerText"></p>
    <button type="submit" class="CDB-Button CDB-Button--primary">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Save changes</span>
    </button>
  </div>
</form>
