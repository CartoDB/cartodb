<div class="Dialog-header">
  <div class="Dialog-headerIcon Dialog-headerIcon--negative u-flex u-alignCenter u-justifyCenter">
    <i class="CDB-IconFont CDB-IconFont-<%- geometryType && geometryType === "point" ? 'streets' : 'globe' %>"></i>
  </div>
  <h2 class="CDB-Text CDB-Size-large u-bSpace u-errorTextColor">
    <%- _t('components.geocoding.geocoding-error-details.title') %>
  </h2>
  <h3 class="CDB-Text CDB-Size-medium u-secondaryTextColor">
    <%- errorDescription || _t('components.geocoding.geocoding-error-details.description') %>. <br/>
  </h3>
</div>

<% if (!customHosted && id) { %>
  <div class="Dialog-body ErrorDetails-body">
    <ul class="Modal-containerList">
      <li class="ErrorDetails-item">
        <div class="ErrorDetails-itemStep CDB-Text CDB-Size-medium is-semibold u-flex u-alignCenter u-justifyCenter">!</div>
        <div class="ErrorDetails-itemText">
          <p class="CDB-Text CDB-Size-medium">
            <%= _t('components.geocoding.geocoding-error-details.try-again', { id: id, supportGeocodingMailTo: 'support@carto.com?subject=Geocoding' }) %><br/>
          </p>
          <span class="CDB-Text CDB-Size-medium ErrorDetails-itemTextStrong"><%- id %></span>
        </div>
      </li>
    </ul>
  </div>
<% } %>

<div class="Dialog-footer--simple u-inner">
  <button class="cancel CDB-Button CDB-Button--error u-tSpace--m <%- showGeocodingDatasetURLButton ? 'Dialog-footerBtn' : '' %> js-close">
    <span class='CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase'>
      <%- _t('components.geocoding.geocoding-error-details.close') %>
    </span>
  </button>
</div>
