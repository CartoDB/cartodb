<div class="Dialog-header u-inner">
  <div class="Dialog-headerIcon Dialog-headerIcon--neutral">
    <i class="CDB-IconFont CDB-IconFont-cloudDownArrow"></i>
  </div>
  <h2 class="CDB-Text CDB-Size-large u-bSpace">Export dataset</h2>
  <h3 class="CDB-Text CDB-Size-medium u-altTextColor">Select the preferred file format.</h3>
  <% if (!isGeoreferenced) { %>
    <p class="CDB-Text CDB-Size-medium u-altTextColor u-tSpace-xl">To download any geospatial format like SHP, KML or GeoJSON don't forget to select the_geom on your query.</p>
  <% } %>
</div>

<div class="Dialog-body u-tSpace-xl">
  <div class="OptionCards">
    <% _.each(formats, function (format) { %>
    <div data-format="<%- format.format %>"
      class="OptionCard OptionCard--onlyIcons
        <% if (isGeoreferenced === false && format.geomRequired === true) { %>
          is-disabled
        <% } else { %>
          js-option
        <% } %>
      ">
      <div class="IllustrationIcon <%- format.illustrationIconModifier %>">
        <div class="IllustrationIcon-text CDB-Text u-upperCase">
          <%- format.label || format.format %>
        </div>
      </div>
    </div>
    <% }); %>
  </div>
</div>

<div class="Dialog-footer Dialog-footer--simple u-inner">
  <button class="CDB-Button CDB-Button--secondary u-rSpace--m u-tSpace-xl js-cancel">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
      cancel
    </span>
  </button>
</div>

<form class="js-form" method="POST" action="<%- url %>">
  <input type="hidden" class="js-filename" name="filename" />
  <input type="hidden" class="js-q" name="q" />
  <input type="hidden" class="js-format" name="format" />
  <input type="hidden" class="js-apiKey" name="api_key" />
  <input type="hidden" class="js-skipfields" name="skipfields" disabled="disabled" value="" />
  <input type="hidden" class="js-dp" name="dp" value="4" disabled="disabled" />
</form>
