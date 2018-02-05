<header class="ApiKeys-title">
  <h3 class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor">Your API keys</h3>
  <button type="submit" class="CDB-Button CDB-Button--primary">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">New API key</span>
  </button>
</header>
<ul class="ApeiKeys-list">
  <li class="ApiKeys-list-item">
    <section>
       <h4 class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor">Master</h4>
       <p class="CDB-Text CDB-Size-medium u-secondaryTextColor u-tSpace--m u-flex u-alignCenter">
        a985af72dc9190c90eee07b479390a758910d770
        <i class="CDB-IconFont CDB-IconFont-anchor u-hintTextColor CDB-Size-large u-lSpace--xl"></i>
      </p>
    </section>
    <section>
      <button class="CDB-Text CDB-Size-medium u-actionTextColor">Regenerate</button>
    </section>
  </li>
  <li class="ApiKeys-list-item">
    <section>
       <h4 class="CDB-Text CDB-Size-medium is-semibold u-actionTextColor">Public</h4>
       <p class="CDB-Text CDB-Size-medium u-secondaryTextColor u-tSpace--m u-flex u-alignCenter">
        a985af72dc9190c90eee07b479390a758910d770
        <i class="CDB-IconFont CDB-IconFont-anchor u-hintTextColor CDB-Size-large u-lSpace--xl"></i>
      </p>
    </section>
    <section>
      <button class="CDB-Text CDB-Size-medium u-actionTextColor">Edit</button>
    </section>
  </li>
  <% regularKeys.forEach(function (key) { %>
    <li class="ApiKeys-list-item">
      <section>
         <h4 class="CDB-Text CDB-Size-medium is-semibold u-actionTextColor u-flex u-alignCenter">
          <%- key.get('name') %>

          <% key.getApiGrants().forEach(function (apiGrant) { %>
            <span class="CDB-Tag CDB-Text is-gray is-semibold CDB-Size-small u-iBlock u-lSpace--xl u-upperCase">
              <%- apiGrant %>
            </span>
          <% }) %>
        </h4>
         <p class="CDB-Text CDB-Size-medium u-secondaryTextColor u-tSpace--m u-flex u-alignCenter">
          <%- key.get('token') %>
          <i class="CDB-IconFont CDB-IconFont-anchor u-hintTextColor CDB-Size-large u-lSpace--xl"></i>
        </p>
      </section>
      <section>
        <button class="CDB-Text CDB-Size-medium u-actionTextColor u-rSpace--m">Clone</button>
        <button class="CDB-Text CDB-Size-medium u-actionTextColor u-rSpace--m">Regenerate</button>
        <button class="CDB-Text CDB-Size-medium u-errorTextColor">Delete</button>
      </section>
    </li>
  <% }) %>
</ul>

<footer class="ApiKeys-footer">
  <p class="ApiKeys-footer-text">
    <i class="CDB-IconFont CDB-IconFont-info ApiKeys-footer-icon"></i>
    <span>Learn more about <a href="https://carto.com/docs/carto-editor/your-account/#api-key">using your simple API key</a> in CARTO</span>
  </p>
</footer>
