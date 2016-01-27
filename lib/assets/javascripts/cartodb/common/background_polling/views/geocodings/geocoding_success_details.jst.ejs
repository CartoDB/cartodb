<div class="Dialog-header u-inner">
  <div class="LayutIcon LayoutIcon--positive Dialog-headerIcon">
    <i class="CDB-IconFont CDB-IconFont-<%- geometryType && geometryType === 'point' ? 'streets' : 'globe' %>"></i>
    <span class="Badge Badge--positive Dialog-headerIconBadge">
      <i class="CDB-IconFont CDB-IconFont-check"></i>
    </span>
  </div>
  <h3 class="Dialog-headerTitle">Data geocoded</h3>
  <p class="Dialog-headerText Dialog-headerText--centered Dialog-narrowerContent">
    We've successfully geocoded <%- realRowsFormatted %> <%- geometryTypePluralize %> of <%- processableRowsFormatted %>.
  </p>
</div>

<% if (processableRows > realRows) { %>
  <div class="Dialog-body Dialog-resultsBody">
    <span class="Dialog-resultsBodyIcon NavButton ">?</span>
    <div class="Dialog-resultsBodyTexts">
      <p class="DefaultParagraph">
        Rows that are not geocoded could have errors on their column values, or just doesn’t exist in our data.
        Try geocoding again and check the "override all values" to try again.
        <% if (!googleUser) { %>
          Unsuccessful rows don't count against your quota, so we encourage you to take a look and try again.
        <% }%>
      </p>
    </div>
  </div>
<% } %>

<% if (!googleUser && hasPrice) { %>
  <div class="Dialog-body Dialog-resultsBody">
    <div class="Dialog-resultsBodyIcon LayoutIcon <%- price > 0 ? 'LayoutIcon--warning' :  'LayoutIcon--positive' %>">
      <span class="CDB-IconFont CDB-IconFont-dollar CDB-IconFont--super"></span>
    </div>
    <div class="Dialog-resultsBodyTexts">
      <% if (price > 0) { %>
        <p class="DefaultTitle">
          <strong>$<%- price / 100 %></strong> will be charged to your account
        </p>
        <p class="DefaultParagraph DefaultParagraph--tertiary">
          You have consumed all your credits during this billing cycle, price is $<%- blockPrice / 100  %>/1,000 extra credits.
        </p>
      <% } else { %>
        <p class="DefaultTitle">
          No extra charges have been done
        </p>
        <p class="DefaultParagraph DefaultParagraph--tertiary">
          You still have <%- remainingQuotaFormatted %> credits left for this month.
        </p>
      <% } %>
    </div>
  </div>
<% } %>

<div class="Dialog-footer Dialog-footer--simple u-inner Dialog-narrowerContent">
  <button class="cancel Button Button--secondary <%- showGeocodingDatasetURLButton ? 'Dialog-footerBtn' : '' %>">
    <span>close</span>
  </button>
  <% if (showGeocodingDatasetURLButton) { %>
    <a href="<%- datasetURL %>" class="Button Button--main">
      <span>view dataset</span>
    </a>
  <% } %>
</div>
