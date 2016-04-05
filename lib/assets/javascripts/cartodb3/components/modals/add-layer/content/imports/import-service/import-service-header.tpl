<% if (state !== 'list' ) { %>
  <h3 class="ImportPanel-headerTitle">
    <% if (state === 'selected') { %>
      <% if (service_name === 'instagram') { %>
        Account connected
        <% } else { %>
        Item selected
      <% } %>
    <% } else { %>
      Connect with <%- title %>
    <% } %>
  </h3>
  <p class="ImportPanel-headerDescription <% if (state === "error") { %>ImportPanel-headerDescription--negative<% } %>">
    <% if (state === "idle") { %>
      <% if (fileExtensions.length > 0) { %>
        <%- fileExtensions.join(', ') %><% if (showAvailableFormats) { %> and <a target="_blank" href="http://docs.cartodb.com/cartodb-editor/datasets/#supported-file-formats" class="ImportPanel-headerDescriptionLink">many more formats</a> <% } %> supported.
      <% } else { %>
        Log in with your account and select any item.
      <% } %>
    <% } %>
    <% if (state === "error") { %>
      We are sorry, can’t connect to your <%- title %> account. Just in case it helps, be sure you have the pop-up blocker deactivated for this website.
    <% } %>
    <% if (state === "token") { %>
      Checking Token.
    <% } %>
    <% if (state === "oauth") { %>
      Requesting oAuth.
    <% } %>
    <% if (state === "retrieving") { %>
      A list of your <%- title %> files will be displayed in a moment.
    <% } %>
    <% if (state === "selected") { %>
      <% if (acceptSync) { %>
        You can also choose when to sync the file.
      <% } else { %>
      <% if (service_name === 'instagram') { %>
        A map containing all your georeferenced photos will be created
        <% } else { %>
        Sync options are not available.
        <% } %>
      <% } %>
    <% } %>
  </p>
  <% if (state === "selected" && items > 1) { %>
    <button class="NavButton NavButton--back ImportPanel-headerButton js-back">
      <i class="CDB-IconFont CDB-IconFont-arrowPrev"></i>
    </button>
  <% } %>
<% } %>
