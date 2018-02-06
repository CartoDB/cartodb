<section>
   <h4 class="CDB-Text CDB-Size-medium is-semibold u-actionTextColor u-flex u-alignCenter">
    <%- name %>

    <% apiGrants.forEach(function (apiGrant) { %>
      <span class="CDB-Tag CDB-Text is-gray is-semibold CDB-Size-small u-iBlock u-lSpace--xl u-upperCase">
        <%- apiGrant %>
      </span>
    <% }) %>
  </h4>
   <p class="CDB-Text CDB-Size-medium u-secondaryTextColor u-tSpace--m u-flex u-alignCenter">
    <%- token %>
    <i class="CDB-IconFont CDB-IconFont-anchor u-hintTextColor CDB-Size-large u-lSpace--xl"></i>
  </p>
</section>
<section>
  <button class="CDB-Text CDB-Size-medium u-actionTextColor u-rSpace--m js-regenerate">Regenerate</button>
  <button class="CDB-Text CDB-Size-medium u-errorTextColor js-delete">Delete</button>
</section>
