<div class="DataLibrary-gradient"></div>

<div class="Header-inner Header-title js-Header-title u-inner">
  <div class="Header-innerTitle">
    <h1 class="Title-small"><%- _t('dashboard.views.data_library.header.library') %></h1>
    <p class="Title Title--l Title--white u-vspace-l"><%- _t('dashboard.views.data_library.header.resources') %></p>
  </div>
</div>

<div class="Header-inner Header-footer is-hidden">
  <div class="CountrySelector js-CountrySelector u-inner">
    <p class="CountrySelector-text"><%- _t('dashboard.views.data_library.header.country_flt') %></p>
    <button class="CountrySelector-button js-country"></button>
  </div>

  <div class="CountrySelector CountrySelector-back js-CountrySelector-back is-hidden">
    <div class="CountrySelector-inner u-inner">
      <p class="CountrySelector-text">Back</p>
      <button class="NavButton Dialog-countryBack js-back">
        <i class="CDB-IconFont CDB-IconFont-close"></i>
      </button>
    </div>
  </div>
</div>

<div id="DataLibraryMap" class="DataLibraryMap"></div>
