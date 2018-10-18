<form>
  <div class="Editor-HeaderInfo">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">1</div>
    <div class="Editor-HeaderInfo-inner CDB-Text">
      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('editor.layers.analysis-form.select-column') %></h2>
      </div>
      <div class="Editor-HeaderInfo-subtitle u-bSpace--m">
        <p class="CDB-Text CDB-FontSize-small u-upperCase u-altTextColor"><%- _t('editor.layers.analysis-form.to-filter-by') %></p>
      </div>
      <div class="u-tSpace-xl CDB-Text CDB-Fieldset">
        <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- _t('editor.layers.analysis-form.base-layer') %></p>
        <div class="Editor-formInput u-ellipsis" data-editors="source"></div>
      </div>
      <div class="u-tSpace-xl CDB-Text CDB-Fieldset">
        <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- _t('editor.layers.analysis-form.target-column') %></p>
        <div class="Editor-formInput" data-editors="column"></div>
      </div>
      <% if (histogram_stats) { %>
      <div class="u-tSpace-xl CDB-Text CDB-Fieldset ">
        <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m"></p>
        <div class="Analysis-Histogram js-histogram">
          <ul class="Analysis-HistogramInfo u-flex CDB-Text CDB-Size-small u-secondaryTextColor u-upperCase">
            <li class="u-rSpace"><span class="js-min"></span> <%- _t('editor.layers.analysis-form.min') %></li>
            <li><span class="js-max"></span> <%- _t('editor.layers.analysis-form.max') %></li>
          </ul>
          <div class="Analysis-HistogramChart js-histogramChart"></div>
        </div>
      </div>
      <% } %>
    </div>
  </div>
  <div class="Editor-HeaderInfo <%- column ? '' : 'is-disabled' %>">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">2</div>
    <div class="Editor-HeaderInfo-inner CDB-Text" data-fields="<%- parametersDataFields %>">
      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('editor.layers.analysis-form.parameters') %></h2>
      </div>
      <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--xl"><%- _t('editor.layers.analysis-form.parameters-description') %></p>
    </div>
  </div>
</form>
