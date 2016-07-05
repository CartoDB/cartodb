<div class="Dialog-header">
  <div class="Dialog-headerIcon Dialog-headerIcon--neutral">
    <i class="CDB-IconFont CDB-IconFont-alarm"></i>
  </div>
  <h2 class="CDB-Text CDB-Size-large u-bSpace">
    <%- _t('dataset.sync.title') %>
  </h2>
  <h3 class="CDB-Text CDB-Size-medium u-altTextColor" title="<%- url %>">
    <%= _t('dataset.sync.desc', {
      service: service,
      url: url
    }) %>
  </h3>
</div>
<div class="Dialog-body Dialog-body--small">
  <div class="Form-row">
    <div class="Form-rowLabel Form-rowLabel--leftAligned">
      <label class="Form-label Form-label--large CDB-Text">
        <%- _t('dataset.sync.label') %>
      </label>
    </div>
    <div class="Form-rowData Form-rowData--noMargin Form-rowData--full">
      <ul class="js-intervals">
        <li class="u-iBlock CDB-Text u-altTextColor CDB-Size-medium u-rSpace--xl">
          <input class="CDB-Radio" type="radio" name="interval" value="3600"
            <% if (interval === 3600) { %>
              checked
            <% } %>

            <% if (isExternalSource) { %>
              disabled
            <% } %>
          >
          <span class="u-iBlock CDB-Radio-face"></span>
          <label class="u-iBlock u-lSpace">Every hour</label>
        </li>
        <li class="u-iBlock CDB-Text u-altTextColor CDB-Size-medium u-rSpace--xl">
          <input class="CDB-Radio" type="radio" name="interval" value="86400"
            <% if (interval === 86400) { %>
              checked
            <% } %>

            <% if (isExternalSource) { %>
              disabled
            <% } %>
          >
          <span class="u-iBlock CDB-Radio-face"></span>
          <label class="u-iBlock u-lSpace">Every day</label>
        </li>
        <li class="u-iBlock CDB-Text u-altTextColor CDB-Size-medium u-rSpace--xl">
          <input class="CDB-Radio" type="radio" name="interval" value="604800"
            <% if (interval === 604800) { %>
              checked
            <% } %>

            <% if (isExternalSource) { %>
              disabled
            <% } %>
          >
          <span class="u-iBlock CDB-Radio-face"></span>
          <label class="u-iBlock u- u-lSpace">Every week</label>
        </li>
        <li class="u-iBlock CDB-Text u-altTextColor CDB-Size-medium u-rSpace--xl">
          <input class="CDB-Radio" type="radio" name="interval" value="2592000"
            <% if (interval === 2592000) { %>
              checked
            <% } %>
          >
          <span class="u-iBlock CDB-Radio-face"></span>
          <label class="u-iBlock u-lSpace">Every month</label>
        </li>
        <li class="u-iBlock CDB-Text u-errorTextColor CDB-Size-medium u-rSpace--xl">
          <input class="CDB-Radio" type="radio" name="interval" value="0"
            <% if (interval === 0) { %>
              checked
            <% } %>
          >
          <span class="u-iBlock CDB-Radio-face"></span>
          <label class="u-iBlock u-lSpace">Never</label>
        </li>
      </ul>
    </div>
  </div>
</div>
<div class="Dialog-footer--simple u-inner">
  <button class="CDB-Button CDB-Button--primary u-tSpace--m js-confirm">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
      <%- _t('dataset.sync.confirm') %>
    </span>
  </button>
</div>
