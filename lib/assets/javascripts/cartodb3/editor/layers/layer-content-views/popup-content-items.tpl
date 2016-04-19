<div class="CDB-HeaderInfo">
  <div class="CDB-HeaderNumeration CDB-Text is-semibold u-rSpace--m">2</div>

  <div class="CDB-HeaderInfo-Inner CDB-Text">
    <div class="CDB-HeaderInfo-Title u-bSpace--m">
      <h2 class="CDB-Text CDB-HeaderInfo-TitleText CDB-Size-large"><%- _t('editor.layers.popup.items.title-label') %></h2>
    </div>
    <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--m"><%- _t('editor.layers.popup.items.description') %></p>

    <div class="js-content">
      <!-- TODO: integrate backbone.forms -->
      <form data-fieldsets=""><fieldset data-fields="">          <div class="u-tSpace-xl CDB-Text">
        <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m" for="c172_title">
          Title
        </p>
        <div class="CDB-Text CDB-Size-medium u-iBlock">
          <span data-editor=""><input id="c172_title" class="CDB-InputText" name="title" type="text"></span>
          <div data-error=""></div>
          <div></div>
        </div>
      </div><div class="u-tSpace-xl CDB-Text">
        <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m" for="c172_column">
          Value
        </p>
        <div class="CDB-Text CDB-Size-medium u-iBlock">
          <span data-editor=""><select id="c172_column" class="CDB-SelectFake" name="column"><option value="cartodb_id">cartodb_id</option><option value="the_geom">the_geom</option><option value="description">description</option><option value="name">name</option></select></span>
          <div data-error=""></div>
          <div></div>
        </div>
      </div><div class="u-tSpace-xl CDB-Text">
        <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m" for="c172_aggregation">
          Aggregation
        </p>
        <div class="CDB-Text CDB-Size-medium u-iBlock">
          <span data-editor=""><select id="c172_aggregation" class="CDB-SelectFake" name="aggregation"><option>sum</option><option>count</option></select></span>
          <div data-error=""></div>
          <div></div>
        </div>
      </div><div class="u-tSpace-xl CDB-Text">
        <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m" for="c172_aggregation_column">
          Aggregation Column
        </p>
        <div class="CDB-Text CDB-Size-medium u-iBlock">
          <span data-editor=""><select id="c172_aggregation_column" class="CDB-SelectFake" name="aggregation_column"><option value="cartodb_id">cartodb_id</option><option value="the_geom">the_geom</option><option value="description">description</option><option value="name">name</option></select></span>
          <div data-error=""></div>
          <div></div>
        </div>
      </div><div class="u-tSpace-xl CDB-Text">
        <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m" for="c172_suffix">
          Suffix
        </p>
        <div class="CDB-Text CDB-Size-medium u-iBlock">
          <span data-editor=""><input id="c172_suffix" class="CDB-InputText" name="suffix" type="text"></span>
          <div data-error=""></div>
          <div></div>
        </div>
      </div><div class="u-tSpace-xl CDB-Text">
        <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m" for="c172_prefix">
          Prefix
        </p>
        <div class="CDB-Text CDB-Size-medium u-iBlock">
          <span data-editor=""><input id="c172_prefix" class="CDB-InputText" name="prefix" type="text"></span>
          <div data-error=""></div>
          <div></div>
        </div>
      </div></fieldset></form>
    </div>

  </div>
</div>
