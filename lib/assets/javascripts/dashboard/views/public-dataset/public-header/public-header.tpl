<div class='inner'>
  <h1><a href='https://carto.com' class='logo' id='the_logo'><%= _t('carto_name') %></a></h1>
  <ul class='options'>
    <% if (!username && !isMobileDevice) { %>
      <li><%= _t('dashboard.views.public_dataset.public_header.guides') %></li>
    <% } %>

    <% if (!username) { %>
      <% if ( !isCartoDBHosted ) { %>
        <li><%= _t('dashboard.views.public_dataset.public_header.signup') %><li>
      <% } %>
      <li><%= _t('dashboard.views.public_dataset.public_header.login') %></li>
    <% } else { %>
      <li>
        <a class='editor dropdown account' href='<%- urls[0] %>'>
          <% if (avatar_url) { %><img src='<%- avatar_url %>' width='18' title='<%- username %>' alt='<%- username %>' /><% } %><%- username %><span class='separator'></span>
        </a>
      </li>
    <% } %>
  </ul>
</div>
