<section>
   <h4 class="CDB-Text CDB-Size-medium is-semibold u-flex u-alignCenter u-actionTextColor">
    <button class="js-edit"><%- name %></button>

    <% apiGrants.forEach(function (apiGrant) { %>
      <span class="CDB-Tag CDB-Text is-gray is-semibold CDB-Size-small u-iBlock u-lSpace--xl u-upperCase">
        <%- apiGrant %>
      </span>
    <% }) %>
  </h4>
   <p class="CDB-Text CDB-Size-medium u-secondaryTextColor u-tSpace--m u-flex u-alignCenter">
    <span class="js-token"><%- token %></span>
    <button class="js-copy">
      <i class="CDB-IconFont CDB-IconFont-anchor u-hintTextColor CDB-Size-large u-lSpace--xl"></i>
    </button>
  </p>
</section>

<ul class="u-flex">
  <li>
    <button class="CDB-Text CDB-Size-medium u-actionTextColor u-rSpace--m js-regenerate"><%= _t('dashboard.views.api_keys.api_key_list.regen') %></button>
  </li>
  <li>
    <button class="CDB-Text CDB-Size-medium u-errorTextColor js-delete"><%= _t('dashboard.views.api_keys.api_key_list.delete') %></button>
  </li>
</ul>
