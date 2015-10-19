


<!DOCTYPE html>
<html lang="en" class="">
  <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# object: http://ogp.me/ns/object# article: http://ogp.me/ns/article# profile: http://ogp.me/ns/profile#">
    <meta charset='utf-8'>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta http-equiv="Content-Language" content="en">
    <meta name="viewport" content="width=1020">
    
    
    <title>cartodb/warden.rb at master · CartoDB/cartodb · GitHub</title>
    <link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml" title="GitHub">
    <link rel="fluid-icon" href="https://github.com/fluidicon.png" title="GitHub">
    <link rel="apple-touch-icon" sizes="57x57" href="/apple-touch-icon-114.png">
    <link rel="apple-touch-icon" sizes="114x114" href="/apple-touch-icon-114.png">
    <link rel="apple-touch-icon" sizes="72x72" href="/apple-touch-icon-144.png">
    <link rel="apple-touch-icon" sizes="144x144" href="/apple-touch-icon-144.png">
    <meta property="fb:app_id" content="1401488693436528">

      <meta content="@github" name="twitter:site" /><meta content="summary" name="twitter:card" /><meta content="CartoDB/cartodb" name="twitter:title" /><meta content="cartodb - Location Intelligence &amp; Data Visualization tool" name="twitter:description" /><meta content="https://avatars3.githubusercontent.com/u/1799254?v=3&amp;s=400" name="twitter:image:src" />
      <meta content="GitHub" property="og:site_name" /><meta content="object" property="og:type" /><meta content="https://avatars3.githubusercontent.com/u/1799254?v=3&amp;s=400" property="og:image" /><meta content="CartoDB/cartodb" property="og:title" /><meta content="https://github.com/CartoDB/cartodb" property="og:url" /><meta content="cartodb - Location Intelligence &amp; Data Visualization tool" property="og:description" />
      <meta name="browser-stats-url" content="https://api.github.com/_private/browser/stats">
    <meta name="browser-errors-url" content="https://api.github.com/_private/browser/errors">
    <link rel="assets" href="https://assets-cdn.github.com/">
    
    <meta name="pjax-timeout" content="1000">
    

    <meta name="msapplication-TileImage" content="/windows-tile.png">
    <meta name="msapplication-TileColor" content="#ffffff">
    <meta name="selected-link" value="repo_source" data-pjax-transient>

    <meta name="google-site-verification" content="KT5gs8h0wvaagLKAVWq8bbeNwnZZK1r1XQysX3xurLU">
    <meta name="google-analytics" content="UA-3769691-2">

<meta content="collector.githubapp.com" name="octolytics-host" /><meta content="github" name="octolytics-app-id" /><meta content="5338ABB2:45C7:F5E156B:5624A955" name="octolytics-dimension-request_id" />

<meta content="Rails, view, blob#show" data-pjax-transient="true" name="analytics-event" />


  <meta class="js-ga-set" name="dimension1" content="Logged Out">
    <meta class="js-ga-set" name="dimension4" content="Current repo nav">




    <meta name="is-dotcom" content="true">
        <meta name="hostname" content="github.com">
    <meta name="user-login" content="">

      <link rel="mask-icon" href="https://assets-cdn.github.com/pinned-octocat.svg" color="#4078c0">
      <link rel="icon" type="image/x-icon" href="https://assets-cdn.github.com/favicon.ico">

    <meta content="d76aa6b07fb769cf6b6696f11b8d1da7eab685bd" name="form-nonce" />

    <link crossorigin="anonymous" href="https://assets-cdn.github.com/assets/github-1c72e5e1cbdeae0d6a25ee0e6f07ae0100db5696d3f5f10ed2acf1f0885ef5f0.css" media="all" rel="stylesheet" />
    <link crossorigin="anonymous" href="https://assets-cdn.github.com/assets/github2-91f10774cc492e563a1bcd77a9b935a21bffbda4c7fefb5ed448d51a53217852.css" media="all" rel="stylesheet" />
    
    
    


    <meta http-equiv="x-pjax-version" content="aaf0a95e6a9bf84b40427e5620ea23c2">

      
  <meta name="description" content="cartodb - Location Intelligence &amp; Data Visualization tool">
  <meta name="go-import" content="github.com/CartoDB/cartodb git https://github.com/CartoDB/cartodb.git">

  <meta content="1799254" name="octolytics-dimension-user_id" /><meta content="CartoDB" name="octolytics-dimension-user_login" /><meta content="4909355" name="octolytics-dimension-repository_id" /><meta content="CartoDB/cartodb" name="octolytics-dimension-repository_nwo" /><meta content="true" name="octolytics-dimension-repository_public" /><meta content="false" name="octolytics-dimension-repository_is_fork" /><meta content="4909355" name="octolytics-dimension-repository_network_root_id" /><meta content="CartoDB/cartodb" name="octolytics-dimension-repository_network_root_nwo" />
  <link href="https://github.com/CartoDB/cartodb/commits/master.atom" rel="alternate" title="Recent Commits to cartodb:master" type="application/atom+xml">

  </head>


  <body class="logged_out   env-production  vis-public page-blob">
    <a href="#start-of-content" tabindex="1" class="accessibility-aid js-skip-to-content">Skip to content</a>

    
    
    



      
      <div class="header header-logged-out" role="banner">
  <div class="container clearfix">

    <a class="header-logo-wordmark" href="https://github.com/" data-ga-click="(Logged out) Header, go to homepage, icon:logo-wordmark">
      <span class="mega-octicon octicon-logo-github"></span>
    </a>

    <div class="header-actions" role="navigation">
        <a class="btn btn-primary" href="/join" data-ga-click="(Logged out) Header, clicked Sign up, text:sign-up">Sign up</a>
      <a class="btn" href="/login?return_to=%2FCartoDB%2Fcartodb%2Fblob%2Fmaster%2Fconfig%2Finitializers%2Fwarden.rb" data-ga-click="(Logged out) Header, clicked Sign in, text:sign-in">Sign in</a>
    </div>

    <div class="site-search repo-scope js-site-search" role="search">
      <!-- </textarea> --><!-- '"` --><form accept-charset="UTF-8" action="/CartoDB/cartodb/search" class="js-site-search-form" data-global-search-url="/search" data-repo-search-url="/CartoDB/cartodb/search" method="get"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="&#x2713;" /></div>
  <label class="js-chromeless-input-container form-control">
    <div class="scope-badge">This repository</div>
    <input type="text"
      class="js-site-search-focus js-site-search-field is-clearable chromeless-input"
      data-hotkey="s"
      name="q"
      placeholder="Search"
      aria-label="Search this repository"
      data-global-scope-placeholder="Search GitHub"
      data-repo-scope-placeholder="Search"
      tabindex="1"
      autocapitalize="off">
  </label>
</form>
    </div>

      <ul class="header-nav left" role="navigation">
          <li class="header-nav-item">
            <a class="header-nav-link" href="/explore" data-ga-click="(Logged out) Header, go to explore, text:explore">Explore</a>
          </li>
          <li class="header-nav-item">
            <a class="header-nav-link" href="/features" data-ga-click="(Logged out) Header, go to features, text:features">Features</a>
          </li>
          <li class="header-nav-item">
            <a class="header-nav-link" href="https://enterprise.github.com/" data-ga-click="(Logged out) Header, go to enterprise, text:enterprise">Enterprise</a>
          </li>
          <li class="header-nav-item">
            <a class="header-nav-link" href="/pricing" data-ga-click="(Logged out) Header, go to pricing, text:pricing">Pricing</a>
          </li>
      </ul>

  </div>
</div>



    <div id="start-of-content" class="accessibility-aid"></div>

    <div id="js-flash-container">
</div>


    <div role="main" class="main-content">
        <div itemscope itemtype="http://schema.org/WebPage">
    <div class="pagehead repohead instapaper_ignore readability-menu">

      <div class="container">

        <div class="clearfix">
          

<ul class="pagehead-actions">

  <li>
      <a href="/login?return_to=%2FCartoDB%2Fcartodb"
    class="btn btn-sm btn-with-count tooltipped tooltipped-n"
    aria-label="You must be signed in to watch a repository" rel="nofollow">
    <span class="octicon octicon-eye"></span>
    Watch
  </a>
  <a class="social-count" href="/CartoDB/cartodb/watchers">
    136
  </a>

  </li>

  <li>
      <a href="/login?return_to=%2FCartoDB%2Fcartodb"
    class="btn btn-sm btn-with-count tooltipped tooltipped-n"
    aria-label="You must be signed in to star a repository" rel="nofollow">
    <span class="octicon octicon-star"></span>
    Star
  </a>

    <a class="social-count js-social-count" href="/CartoDB/cartodb/stargazers">
      961
    </a>

  </li>

  <li>
      <a href="/login?return_to=%2FCartoDB%2Fcartodb"
        class="btn btn-sm btn-with-count tooltipped tooltipped-n"
        aria-label="You must be signed in to fork a repository" rel="nofollow">
        <span class="octicon octicon-repo-forked"></span>
        Fork
      </a>

    <a href="/CartoDB/cartodb/network" class="social-count">
      230
    </a>
  </li>
</ul>

          <h1 itemscope itemtype="http://data-vocabulary.org/Breadcrumb" class="entry-title public ">
  <span class="mega-octicon octicon-repo"></span>
  <span class="author"><a href="/CartoDB" class="url fn" itemprop="url" rel="author"><span itemprop="title">CartoDB</span></a></span><!--
--><span class="path-divider">/</span><!--
--><strong><a href="/CartoDB/cartodb" data-pjax="#js-repo-pjax-container">cartodb</a></strong>

  <span class="page-context-loader">
    <img alt="" height="16" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" />
  </span>

</h1>

        </div>
      </div>
    </div>

    <div class="container">
      <div class="repository-with-sidebar repo-container new-discussion-timeline ">
        <div class="repository-sidebar clearfix">
          
<nav class="sunken-menu repo-nav js-repo-nav js-sidenav-container-pjax js-octicon-loaders"
     role="navigation"
     data-pjax="#js-repo-pjax-container"
     data-issue-count-url="/CartoDB/cartodb/issues/counts">
  <ul class="sunken-menu-group">
    <li class="tooltipped tooltipped-w" aria-label="Code">
      <a href="/CartoDB/cartodb" aria-label="Code" aria-selected="true" class="js-selected-navigation-item selected sunken-menu-item" data-hotkey="g c" data-selected-links="repo_source repo_downloads repo_commits repo_releases repo_tags repo_branches /CartoDB/cartodb">
        <span class="octicon octicon-code"></span> <span class="full-word">Code</span>
        <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" />
</a>    </li>

      <li class="tooltipped tooltipped-w" aria-label="Issues">
        <a href="/CartoDB/cartodb/issues" aria-label="Issues" class="js-selected-navigation-item sunken-menu-item" data-hotkey="g i" data-selected-links="repo_issues repo_labels repo_milestones /CartoDB/cartodb/issues">
          <span class="octicon octicon-issue-opened"></span> <span class="full-word">Issues</span>
          <span class="js-issue-replace-counter"></span>
          <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" />
</a>      </li>

    <li class="tooltipped tooltipped-w" aria-label="Pull requests">
      <a href="/CartoDB/cartodb/pulls" aria-label="Pull requests" class="js-selected-navigation-item sunken-menu-item" data-hotkey="g p" data-selected-links="repo_pulls /CartoDB/cartodb/pulls">
          <span class="octicon octicon-git-pull-request"></span> <span class="full-word">Pull requests</span>
          <span class="js-pull-replace-counter"></span>
          <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" />
</a>    </li>

      <li class="tooltipped tooltipped-w" aria-label="Wiki">
        <a href="/CartoDB/cartodb/wiki" aria-label="Wiki" class="js-selected-navigation-item sunken-menu-item" data-hotkey="g w" data-selected-links="repo_wiki /CartoDB/cartodb/wiki">
          <span class="octicon octicon-book"></span> <span class="full-word">Wiki</span>
          <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" />
</a>      </li>
  </ul>
  <div class="sunken-menu-separator"></div>
  <ul class="sunken-menu-group">

    <li class="tooltipped tooltipped-w" aria-label="Pulse">
      <a href="/CartoDB/cartodb/pulse" aria-label="Pulse" class="js-selected-navigation-item sunken-menu-item" data-selected-links="pulse /CartoDB/cartodb/pulse">
        <span class="octicon octicon-pulse"></span> <span class="full-word">Pulse</span>
        <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" />
</a>    </li>

    <li class="tooltipped tooltipped-w" aria-label="Graphs">
      <a href="/CartoDB/cartodb/graphs" aria-label="Graphs" class="js-selected-navigation-item sunken-menu-item" data-selected-links="repo_graphs repo_contributors /CartoDB/cartodb/graphs">
        <span class="octicon octicon-graph"></span> <span class="full-word">Graphs</span>
        <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" />
</a>    </li>
  </ul>


</nav>

            <div class="only-with-full-nav">
                
<div class="js-clone-url clone-url open"
  data-protocol-type="http">
  <h3 class="text-small"><span class="text-emphasized">HTTPS</span> clone URL</h3>
  <div class="input-group js-zeroclipboard-container">
    <input type="text" class="input-mini text-small input-monospace js-url-field js-zeroclipboard-target"
           value="https://github.com/CartoDB/cartodb.git" readonly="readonly" aria-label="HTTPS clone URL">
    <span class="input-group-button">
      <button aria-label="Copy to clipboard" class="js-zeroclipboard btn btn-sm zeroclipboard-button tooltipped tooltipped-s" data-copied-hint="Copied!" type="button"><span class="octicon octicon-clippy"></span></button>
    </span>
  </div>
</div>

  
<div class="js-clone-url clone-url "
  data-protocol-type="subversion">
  <h3 class="text-small"><span class="text-emphasized">Subversion</span> checkout URL</h3>
  <div class="input-group js-zeroclipboard-container">
    <input type="text" class="input-mini text-small input-monospace js-url-field js-zeroclipboard-target"
           value="https://github.com/CartoDB/cartodb" readonly="readonly" aria-label="Subversion checkout URL">
    <span class="input-group-button">
      <button aria-label="Copy to clipboard" class="js-zeroclipboard btn btn-sm zeroclipboard-button tooltipped tooltipped-s" data-copied-hint="Copied!" type="button"><span class="octicon octicon-clippy"></span></button>
    </span>
  </div>
</div>



<div class="clone-options text-small">You can clone with
  <!-- </textarea> --><!-- '"` --><form accept-charset="UTF-8" action="/users/set_protocol?protocol_selector=http&amp;protocol_type=clone" class="inline-form js-clone-selector-form " data-form-nonce="d76aa6b07fb769cf6b6696f11b8d1da7eab685bd" data-remote="true" method="post"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="&#x2713;" /><input name="authenticity_token" type="hidden" value="LhSMJGFaX01n3wdT9BoeCJI5oNdvcAUyBJN02PWMVgF0Q/5KisdG+ahHW4A03+0KTj/lHXR01vpH2E/y6biUyQ==" /></div><button class="btn-link js-clone-selector" data-protocol="http" type="submit">HTTPS</button></form> or <!-- </textarea> --><!-- '"` --><form accept-charset="UTF-8" action="/users/set_protocol?protocol_selector=subversion&amp;protocol_type=clone" class="inline-form js-clone-selector-form " data-form-nonce="d76aa6b07fb769cf6b6696f11b8d1da7eab685bd" data-remote="true" method="post"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="&#x2713;" /><input name="authenticity_token" type="hidden" value="5/NkL4TnVS9lL9AEoAzYN4h6Ufzc7kklVBo6pvB26OwLzY/cvjJx4UgvSmK1I9LSxP++xLv2OE9zTR5P5QpWqw==" /></div><button class="btn-link js-clone-selector" data-protocol="subversion" type="submit">Subversion</button></form>.
  <a href="https://help.github.com/articles/which-remote-url-should-i-use" class="help tooltipped tooltipped-n" aria-label="Get help on which URL is right for you.">
    <span class="octicon octicon-question"></span>
  </a>
</div>

              <a href="/CartoDB/cartodb/archive/master.zip"
                 class="btn btn-sm sidebar-button"
                 aria-label="Download the contents of CartoDB/cartodb as a zip file"
                 title="Download the contents of CartoDB/cartodb as a zip file"
                 rel="nofollow">
                <span class="octicon octicon-cloud-download"></span>
                Download ZIP
              </a>
            </div>
        </div>
        <div id="js-repo-pjax-container" class="repository-content context-loader-container" data-pjax-container>

          

<a href="/CartoDB/cartodb/blob/254797428e705f0cab8dd8718243cf331823ee48/config/initializers/warden.rb" class="hidden js-permalink-shortcut" data-hotkey="y">Permalink</a>

<!-- blob contrib key: blob_contributors:v21:99364682c2bc774902b025d86415f48e -->

  <div class="file-navigation js-zeroclipboard-container">
    
<div class="select-menu js-menu-container js-select-menu left">
  <button class="btn btn-sm select-menu-button js-menu-target css-truncate" data-hotkey="w"
    title="master"
    type="button" aria-label="Switch branches or tags" tabindex="0" aria-haspopup="true">
    <i>Branch:</i>
    <span class="js-select-button css-truncate-target">master</span>
  </button>

  <div class="select-menu-modal-holder js-menu-content js-navigation-container" data-pjax aria-hidden="true">

    <div class="select-menu-modal">
      <div class="select-menu-header">
        <span class="select-menu-title">Switch branches/tags</span>
        <span class="octicon octicon-x js-menu-close" role="button" aria-label="Close"></span>
      </div>

      <div class="select-menu-filters">
        <div class="select-menu-text-filter">
          <input type="text" aria-label="Filter branches/tags" id="context-commitish-filter-field" class="js-filterable-field js-navigation-enable" placeholder="Filter branches/tags">
        </div>
        <div class="select-menu-tabs">
          <ul>
            <li class="select-menu-tab">
              <a href="#" data-tab-filter="branches" data-filter-placeholder="Filter branches/tags" class="js-select-menu-tab" role="tab">Branches</a>
            </li>
            <li class="select-menu-tab">
              <a href="#" data-tab-filter="tags" data-filter-placeholder="Find a tag…" class="js-select-menu-tab" role="tab">Tags</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="select-menu-list select-menu-tab-bucket js-select-menu-tab-bucket" data-tab-filter="branches" role="menu">

        <div data-filterable-for="context-commitish-filter-field" data-filterable-type="substring">


            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1.0/config/initializers/warden.rb"
               data-name="1.0"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1.0">
                1.0
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2.0/config/initializers/warden.rb"
               data-name="2.0"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2.0">
                2.0
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3.11.X/config/initializers/warden.rb"
               data-name="3.11.X"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3.11.X">
                3.11.X
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/391-disable-cdn/config/initializers/warden.rb"
               data-name="391-disable-cdn"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="391-disable-cdn">
                391-disable-cdn
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/431-ie-legend-bullet/config/initializers/warden.rb"
               data-name="431-ie-legend-bullet"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="431-ie-legend-bullet">
                431-ie-legend-bullet
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/487-mail_import_error_10s/config/initializers/warden.rb"
               data-name="487-mail_import_error_10s"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="487-mail_import_error_10s">
                487-mail_import_error_10s
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/683/config/initializers/warden.rb"
               data-name="683"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="683">
                683
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/885/config/initializers/warden.rb"
               data-name="885"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="885">
                885
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/934-fonts/config/initializers/warden.rb"
               data-name="934-fonts"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="934-fonts">
                934-fonts
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1038-likes/config/initializers/warden.rb"
               data-name="1038-likes"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1038-likes">
                1038-likes
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1042-gmaps-removal/config/initializers/warden.rb"
               data-name="1042-gmaps-removal"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1042-gmaps-removal">
                1042-gmaps-removal
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1057-gmaps-removal-dialog/config/initializers/warden.rb"
               data-name="1057-gmaps-removal-dialog"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1057-gmaps-removal-dialog">
                1057-gmaps-removal-dialog
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1084-color-ramps/config/initializers/warden.rb"
               data-name="1084-color-ramps"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1084-color-ramps">
                1084-color-ramps
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1122-add_log_to_ghost_tables/config/initializers/warden.rb"
               data-name="1122-add_log_to_ghost_tables"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1122-add_log_to_ghost_tables">
                1122-add_log_to_ghost_tables
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1134-central-synch-fix/config/initializers/warden.rb"
               data-name="1134-central-synch-fix"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1134-central-synch-fix">
                1134-central-synch-fix
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1192-ghost_table_rename_fails/config/initializers/warden.rb"
               data-name="1192-ghost_table_rename_fails"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1192-ghost_table_rename_fails">
                1192-ghost_table_rename_fails
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1254-bubble/config/initializers/warden.rb"
               data-name="1254-bubble"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1254-bubble">
                1254-bubble
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1349-ghost_tables_schema_fix/config/initializers/warden.rb"
               data-name="1349-ghost_tables_schema_fix"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1349-ghost_tables_schema_fix">
                1349-ghost_tables_schema_fix
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1408-signin/config/initializers/warden.rb"
               data-name="1408-signin"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1408-signin">
                1408-signin
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1412-like/config/initializers/warden.rb"
               data-name="1412-like"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1412-like">
                1412-like
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1442-Filter_and_search_should_be_available_for_common_data/config/initializers/warden.rb"
               data-name="1442-Filter_and_search_should_be_available_for_common_data"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1442-Filter_and_search_should_be_available_for_common_data">
                1442-Filter_and_search_should_be_available_for_common_data
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1610_send_email_when_receive_like/config/initializers/warden.rb"
               data-name="1610_send_email_when_receive_like"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1610_send_email_when_receive_like">
                1610_send_email_when_receive_like
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1650-medusa-ui/config/initializers/warden.rb"
               data-name="1650-medusa-ui"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1650-medusa-ui">
                1650-medusa-ui
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1917-parent_id/config/initializers/warden.rb"
               data-name="1917-parent_id"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1917-parent_id">
                1917-parent_id
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1934-geocode_table_update_fix/config/initializers/warden.rb"
               data-name="1934-geocode_table_update_fix"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1934-geocode_table_update_fix">
                1934-geocode_table_update_fix
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/1999-text-overlay-bug/config/initializers/warden.rb"
               data-name="1999-text-overlay-bug"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="1999-text-overlay-bug">
                1999-text-overlay-bug
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2016-feature-flags-fix/config/initializers/warden.rb"
               data-name="2016-feature-flags-fix"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2016-feature-flags-fix">
                2016-feature-flags-fix
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2114-step-check/config/initializers/warden.rb"
               data-name="2114-step-check"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2114-step-check">
                2114-step-check
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2176-layer-panel/config/initializers/warden.rb"
               data-name="2176-layer-panel"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2176-layer-panel">
                2176-layer-panel
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2202-cast-date-to-number/config/initializers/warden.rb"
               data-name="2202-cast-date-to-number"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2202-cast-date-to-number">
                2202-cast-date-to-number
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2244-fix_reset_styles/config/initializers/warden.rb"
               data-name="2244-fix_reset_styles"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2244-fix_reset_styles">
                2244-fix_reset_styles
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2250-wrong_basemaps_zoom/config/initializers/warden.rb"
               data-name="2250-wrong_basemaps_zoom"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2250-wrong_basemaps_zoom">
                2250-wrong_basemaps_zoom
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2288-cdb-bump/config/initializers/warden.rb"
               data-name="2288-cdb-bump"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2288-cdb-bump">
                2288-cdb-bump
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2404-update-cdbjs-3125/config/initializers/warden.rb"
               data-name="2404-update-cdbjs-3125"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2404-update-cdbjs-3125">
                2404-update-cdbjs-3125
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2462-thumbnail-zoom/config/initializers/warden.rb"
               data-name="2462-thumbnail-zoom"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2462-thumbnail-zoom">
                2462-thumbnail-zoom
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2480-use-hiredis-driver/config/initializers/warden.rb"
               data-name="2480-use-hiredis-driver"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2480-use-hiredis-driver">
                2480-use-hiredis-driver
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2523-auth-key/config/initializers/warden.rb"
               data-name="2523-auth-key"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2523-auth-key">
                2523-auth-key
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2609-update-cdbjs-3.12.11/config/initializers/warden.rb"
               data-name="2609-update-cdbjs-3.12.11"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2609-update-cdbjs-3.12.11">
                2609-update-cdbjs-3.12.11
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2624-deleting-map/config/initializers/warden.rb"
               data-name="2624-deleting-map"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2624-deleting-map">
                2624-deleting-map
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2632-georeference-in-viz/config/initializers/warden.rb"
               data-name="2632-georeference-in-viz"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2632-georeference-in-viz">
                2632-georeference-in-viz
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2660-extract-storage-from-table/config/initializers/warden.rb"
               data-name="2660-extract-storage-from-table"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2660-extract-storage-from-table">
                2660-extract-storage-from-table
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2660-extract-storage-take3/config/initializers/warden.rb"
               data-name="2660-extract-storage-take3"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2660-extract-storage-take3">
                2660-extract-storage-take3
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2660-extract-storage-take4/config/initializers/warden.rb"
               data-name="2660-extract-storage-take4"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2660-extract-storage-take4">
                2660-extract-storage-take4
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2660-rename-classes/config/initializers/warden.rb"
               data-name="2660-rename-classes"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2660-rename-classes">
                2660-rename-classes
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2665-header-title-link/config/initializers/warden.rb"
               data-name="2665-header-title-link"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2665-header-title-link">
                2665-header-title-link
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2753-torque-info/config/initializers/warden.rb"
               data-name="2753-torque-info"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2753-torque-info">
                2753-torque-info
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2777-mapnik_tokens/config/initializers/warden.rb"
               data-name="2777-mapnik_tokens"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2777-mapnik_tokens">
                2777-mapnik_tokens
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2781-extract-privacy-value-object/config/initializers/warden.rb"
               data-name="2781-extract-privacy-value-object"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2781-extract-privacy-value-object">
                2781-extract-privacy-value-object
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2801/config/initializers/warden.rb"
               data-name="2801"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2801">
                2801
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2827-infinite-loop/config/initializers/warden.rb"
               data-name="2827-infinite-loop"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2827-infinite-loop">
                2827-infinite-loop
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2855-overlays-remove/config/initializers/warden.rb"
               data-name="2855-overlays-remove"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2855-overlays-remove">
                2855-overlays-remove
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2876-infowindow-titles/config/initializers/warden.rb"
               data-name="2876-infowindow-titles"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2876-infowindow-titles">
                2876-infowindow-titles
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2887/config/initializers/warden.rb"
               data-name="2887"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2887">
                2887
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2902-unbind-overlays/config/initializers/warden.rb"
               data-name="2902-unbind-overlays"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2902-unbind-overlays">
                2902-unbind-overlays
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2920-password-image-export/config/initializers/warden.rb"
               data-name="2920-password-image-export"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2920-password-image-export">
                2920-password-image-export
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2933-geocoding-duration-metrics/config/initializers/warden.rb"
               data-name="2933-geocoding-duration-metrics"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2933-geocoding-duration-metrics">
                2933-geocoding-duration-metrics
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/2963-local-storage/config/initializers/warden.rb"
               data-name="2963-local-storage"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="2963-local-storage">
                2963-local-storage
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3024-fix-namedplaces-guessing-errors/config/initializers/warden.rb"
               data-name="3024-fix-namedplaces-guessing-errors"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3024-fix-namedplaces-guessing-errors">
                3024-fix-namedplaces-guessing-errors
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3056-refactor-viz-search/config/initializers/warden.rb"
               data-name="3056-refactor-viz-search"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3056-refactor-viz-search">
                3056-refactor-viz-search
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3056-refactor-viz-search-reloaded/config/initializers/warden.rb"
               data-name="3056-refactor-viz-search-reloaded"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3056-refactor-viz-search-reloaded">
                3056-refactor-viz-search-reloaded
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3165-overlay-save-on-esc/config/initializers/warden.rb"
               data-name="3165-overlay-save-on-esc"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3165-overlay-save-on-esc">
                3165-overlay-save-on-esc
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3173-share-overlay/config/initializers/warden.rb"
               data-name="3173-share-overlay"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3173-share-overlay">
                3173-share-overlay
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3268-torque-step/config/initializers/warden.rb"
               data-name="3268-torque-step"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3268-torque-step">
                3268-torque-step
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3336-pecan/config/initializers/warden.rb"
               data-name="3336-pecan"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3336-pecan">
                3336-pecan
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3383-disable_ar_synchronization_oauths-id/config/initializers/warden.rb"
               data-name="3383-disable_ar_synchronization_oauths-id"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3383-disable_ar_synchronization_oauths-id">
                3383-disable_ar_synchronization_oauths-id
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3383-remove-synchronization_oauths-id/config/initializers/warden.rb"
               data-name="3383-remove-synchronization_oauths-id"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3383-remove-synchronization_oauths-id">
                3383-remove-synchronization_oauths-id
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3404-fix-private-maps-checks/config/initializers/warden.rb"
               data-name="3404-fix-private-maps-checks"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3404-fix-private-maps-checks">
                3404-fix-private-maps-checks
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3528-add-new-layer-modal-text/config/initializers/warden.rb"
               data-name="3528-add-new-layer-modal-text"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3528-add-new-layer-modal-text">
                3528-add-new-layer-modal-text
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3552-marker-modal/config/initializers/warden.rb"
               data-name="3552-marker-modal"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3552-marker-modal">
                3552-marker-modal
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3553-overlay-protocol/config/initializers/warden.rb"
               data-name="3553-overlay-protocol"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3553-overlay-protocol">
                3553-overlay-protocol
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3554-overlay-order/config/initializers/warden.rb"
               data-name="3554-overlay-order"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3554-overlay-order">
                3554-overlay-order
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3562-fix-share-link/config/initializers/warden.rb"
               data-name="3562-fix-share-link"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3562-fix-share-link">
                3562-fix-share-link
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3703-little-sync-modal/config/initializers/warden.rb"
               data-name="3703-little-sync-modal"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3703-little-sync-modal">
                3703-little-sync-modal
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3703-sync-modal-loader/config/initializers/warden.rb"
               data-name="3703-sync-modal-loader"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3703-sync-modal-loader">
                3703-sync-modal-loader
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3778-typhoeus-wrapper/config/initializers/warden.rb"
               data-name="3778-typhoeus-wrapper"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3778-typhoeus-wrapper">
                3778-typhoeus-wrapper
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3779-do-not-treat-as-template-cached-response/config/initializers/warden.rb"
               data-name="3779-do-not-treat-as-template-cached-response"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3779-do-not-treat-as-template-cached-response">
                3779-do-not-treat-as-template-cached-response
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3806-remove-vendor/config/initializers/warden.rb"
               data-name="3806-remove-vendor"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3806-remove-vendor">
                3806-remove-vendor
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3836-add-column/config/initializers/warden.rb"
               data-name="3836-add-column"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3836-add-column">
                3836-add-column
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3889-send_usage_to_mixpanel/config/initializers/warden.rb"
               data-name="3889-send_usage_to_mixpanel"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3889-send_usage_to_mixpanel">
                3889-send_usage_to_mixpanel
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3898-favicon/config/initializers/warden.rb"
               data-name="3898-favicon"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3898-favicon">
                3898-favicon
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3942-blue-edit-button/config/initializers/warden.rb"
               data-name="3942-blue-edit-button"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3942-blue-edit-button">
                3942-blue-edit-button
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3958-geocoding-param-force_all_rows/config/initializers/warden.rb"
               data-name="3958-geocoding-param-force_all_rows"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3958-geocoding-param-force_all_rows">
                3958-geocoding-param-force_all_rows
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3961-create-layers-index/config/initializers/warden.rb"
               data-name="3961-create-layers-index"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3961-create-layers-index">
                3961-create-layers-index
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/3985-fix-scratch-modal-popup/config/initializers/warden.rb"
               data-name="3985-fix-scratch-modal-popup"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="3985-fix-scratch-modal-popup">
                3985-fix-scratch-modal-popup
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4038-legend-fix/config/initializers/warden.rb"
               data-name="4038-legend-fix"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4038-legend-fix">
                4038-legend-fix
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4077-center-icons-scratch/config/initializers/warden.rb"
               data-name="4077-center-icons-scratch"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4077-center-icons-scratch">
                4077-center-icons-scratch
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4272-fix-color-diff/config/initializers/warden.rb"
               data-name="4272-fix-color-diff"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4272-fix-color-diff">
                4272-fix-color-diff
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4299-pecan-fixes/config/initializers/warden.rb"
               data-name="4299-pecan-fixes"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4299-pecan-fixes">
                4299-pecan-fixes
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4307-postguess/config/initializers/warden.rb"
               data-name="4307-postguess"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4307-postguess">
                4307-postguess
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4339-query-schema/config/initializers/warden.rb"
               data-name="4339-query-schema"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4339-query-schema">
                4339-query-schema
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4362-patch-ar-postgresql-retry/config/initializers/warden.rb"
               data-name="4362-patch-ar-postgresql-retry"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4362-patch-ar-postgresql-retry">
                4362-patch-ar-postgresql-retry
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4400-org_public_dropdown/config/initializers/warden.rb"
               data-name="4400-org_public_dropdown"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4400-org_public_dropdown">
                4400-org_public_dropdown
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4428-errors/config/initializers/warden.rb"
               data-name="4428-errors"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4428-errors">
                4428-errors
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4466-Allow_multiuser_admin_to_set_a_new_Default_Quota/config/initializers/warden.rb"
               data-name="4466-Allow_multiuser_admin_to_set_a_new_Default_Quota"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4466-Allow_multiuser_admin_to_set_a_new_Default_Quota">
                4466-Allow_multiuser_admin_to_set_a_new_Default_Quota
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4491-boolean-colors/config/initializers/warden.rb"
               data-name="4491-boolean-colors"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4491-boolean-colors">
                4491-boolean-colors
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4512-excluded-terms/config/initializers/warden.rb"
               data-name="4512-excluded-terms"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4512-excluded-terms">
                4512-excluded-terms
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4550-exclude-all-null-columns-from-selectors/config/initializers/warden.rb"
               data-name="4550-exclude-all-null-columns-from-selectors"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4550-exclude-all-null-columns-from-selectors">
                4550-exclude-all-null-columns-from-selectors
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4642-category-wizard-fix/config/initializers/warden.rb"
               data-name="4642-category-wizard-fix"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4642-category-wizard-fix">
                4642-category-wizard-fix
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4657-unlogged-tables-tests-NO-MERGE/config/initializers/warden.rb"
               data-name="4657-unlogged-tables-tests-NO-MERGE"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4657-unlogged-tables-tests-NO-MERGE">
                4657-unlogged-tables-tests-NO-MERGE
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4670-previews-url/config/initializers/warden.rb"
               data-name="4670-previews-url"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4670-previews-url">
                4670-previews-url
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4714-annotations-markdown/config/initializers/warden.rb"
               data-name="4714-annotations-markdown"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4714-annotations-markdown">
                4714-annotations-markdown
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4720-sanitized-sql-text/config/initializers/warden.rb"
               data-name="4720-sanitized-sql-text"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4720-sanitized-sql-text">
                4720-sanitized-sql-text
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4730-ogr-geom-possible-names/config/initializers/warden.rb"
               data-name="4730-ogr-geom-possible-names"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4730-ogr-geom-possible-names">
                4730-ogr-geom-possible-names
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4730-ogr-geom-possible-names-take2/config/initializers/warden.rb"
               data-name="4730-ogr-geom-possible-names-take2"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4730-ogr-geom-possible-names-take2">
                4730-ogr-geom-possible-names-take2
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4753_poinpoint_chardet_new_commit/config/initializers/warden.rb"
               data-name="4753_poinpoint_chardet_new_commit"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4753_poinpoint_chardet_new_commit">
                4753_poinpoint_chardet_new_commit
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4795-data_library_markup/config/initializers/warden.rb"
               data-name="4795-data_library_markup"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4795-data_library_markup">
                4795-data_library_markup
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4795-data_library_markup_wip/config/initializers/warden.rb"
               data-name="4795-data_library_markup_wip"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4795-data_library_markup_wip">
                4795-data_library_markup_wip
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4796_check_in_countries_table_as_part_of_source/config/initializers/warden.rb"
               data-name="4796_check_in_countries_table_as_part_of_source"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4796_check_in_countries_table_as_part_of_source">
                4796_check_in_countries_table_as_part_of_source
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4890-wrong-like-urls/config/initializers/warden.rb"
               data-name="4890-wrong-like-urls"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4890-wrong-like-urls">
                4890-wrong-like-urls
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4962-cleanup-timestamp-columns/config/initializers/warden.rb"
               data-name="4962-cleanup-timestamp-columns"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4962-cleanup-timestamp-columns">
                4962-cleanup-timestamp-columns
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/4987-delete-map-dialog-fixes/config/initializers/warden.rb"
               data-name="4987-delete-map-dialog-fixes"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="4987-delete-map-dialog-fixes">
                4987-delete-map-dialog-fixes
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5103-fix-dependency-timestamp-column-syncs/config/initializers/warden.rb"
               data-name="5103-fix-dependency-timestamp-column-syncs"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5103-fix-dependency-timestamp-column-syncs">
                5103-fix-dependency-timestamp-column-syncs
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5220_new_page_for_user_profile/config/initializers/warden.rb"
               data-name="5220_new_page_for_user_profile"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5220_new_page_for_user_profile">
                5220_new_page_for_user_profile
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5264-fix-ghost-tables-deletion/config/initializers/warden.rb"
               data-name="5264-fix-ghost-tables-deletion"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5264-fix-ghost-tables-deletion">
                5264-fix-ghost-tables-deletion
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5298_add_location_field_for_user/config/initializers/warden.rb"
               data-name="5298_add_location_field_for_user"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5298_add_location_field_for_user">
                5298_add_location_field_for_user
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5300-account_pages_fixes/config/initializers/warden.rb"
               data-name="5300-account_pages_fixes"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5300-account_pages_fixes">
                5300-account_pages_fixes
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5370-Sharing_a_dataset_with_a_group_for_a_second_time_doesnt_work/config/initializers/warden.rb"
               data-name="5370-Sharing_a_dataset_with_a_group_for_a_second_time_doesnt_work"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5370-Sharing_a_dataset_with_a_group_for_a_second_time_doesnt_work">
                5370-Sharing_a_dataset_with_a_group_for_a_second_time_doesnt_work
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5515-fix-varnish-key-with-quotes/config/initializers/warden.rb"
               data-name="5515-fix-varnish-key-with-quotes"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5515-fix-varnish-key-with-quotes">
                5515-fix-varnish-key-with-quotes
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5524-including_charset_content_type/config/initializers/warden.rb"
               data-name="5524-including_charset_content_type"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5524-including_charset_content_type">
                5524-including_charset_content_type
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5591-Cached_vizjson_behind_wrong_URL/config/initializers/warden.rb"
               data-name="5591-Cached_vizjson_behind_wrong_URL"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5591-Cached_vizjson_behind_wrong_URL">
                5591-Cached_vizjson_behind_wrong_URL
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5681-form_account_row_margin_fix/config/initializers/warden.rb"
               data-name="5681-form_account_row_margin_fix"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5681-form_account_row_margin_fix">
                5681-form_account_row_margin_fix
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5686-org_invite_email_spelling_fixes/config/initializers/warden.rb"
               data-name="5686-org_invite_email_spelling_fixes"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5686-org_invite_email_spelling_fixes">
                5686-org_invite_email_spelling_fixes
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5690-roboto/config/initializers/warden.rb"
               data-name="5690-roboto"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5690-roboto">
                5690-roboto
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5693_add_more_info_in_failed_import_mail/config/initializers/warden.rb"
               data-name="5693_add_more_info_in_failed_import_mail"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5693_add_more_info_in_failed_import_mail">
                5693_add_more_info_in_failed_import_mail
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5727-googleplus-button/config/initializers/warden.rb"
               data-name="5727-googleplus-button"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5727-googleplus-button">
                5727-googleplus-button
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5749-like-loading-fix/config/initializers/warden.rb"
               data-name="5749-like-loading-fix"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5749-like-loading-fix">
                5749-like-loading-fix
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5770-long_username/config/initializers/warden.rb"
               data-name="5770-long_username"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5770-long_username">
                5770-long_username
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5784-check-S3-timeouts-and-https/config/initializers/warden.rb"
               data-name="5784-check-S3-timeouts-and-https"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5784-check-S3-timeouts-and-https">
                5784-check-S3-timeouts-and-https
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5786-org_user_maps_counter/config/initializers/warden.rb"
               data-name="5786-org_user_maps_counter"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5786-org_user_maps_counter">
                5786-org_user_maps_counter
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5861-csv-ogrinfo-gdal-1.11/config/initializers/warden.rb"
               data-name="5861-csv-ogrinfo-gdal-1.11"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5861-csv-ogrinfo-gdal-1.11">
                5861-csv-ogrinfo-gdal-1.11
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5870_segment_events/config/initializers/warden.rb"
               data-name="5870_segment_events"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5870_segment_events">
                5870_segment_events
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/5880_multilayer_map_after_multilayer_import/config/initializers/warden.rb"
               data-name="5880_multilayer_map_after_multilayer_import"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="5880_multilayer_map_after_multilayer_import">
                5880_multilayer_map_after_multilayer_import
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-54/config/initializers/warden.rb"
               data-name="CDB-54"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-54">
                CDB-54
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-136/config/initializers/warden.rb"
               data-name="CDB-136"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-136">
                CDB-136
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-181/config/initializers/warden.rb"
               data-name="CDB-181"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-181">
                CDB-181
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-182/config/initializers/warden.rb"
               data-name="CDB-182"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-182">
                CDB-182
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-191_CSV_export/config/initializers/warden.rb"
               data-name="CDB-191_CSV_export"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-191_CSV_export">
                CDB-191_CSV_export
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-194_2/config/initializers/warden.rb"
               data-name="CDB-194_2"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-194_2">
                CDB-194_2
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-194_choropleth_labels/config/initializers/warden.rb"
               data-name="CDB-194_choropleth_labels"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-194_choropleth_labels">
                CDB-194_choropleth_labels
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-207_fix_add_existing_table_order/config/initializers/warden.rb"
               data-name="CDB-207_fix_add_existing_table_order"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-207_fix_add_existing_table_order">
                CDB-207_fix_add_existing_table_order
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-226/config/initializers/warden.rb"
               data-name="CDB-226"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-226">
                CDB-226
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-244/config/initializers/warden.rb"
               data-name="CDB-244"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-244">
                CDB-244
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-255/config/initializers/warden.rb"
               data-name="CDB-255"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-255">
                CDB-255
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-262_assets_loader_indicator/config/initializers/warden.rb"
               data-name="CDB-262_assets_loader_indicator"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-262_assets_loader_indicator">
                CDB-262_assets_loader_indicator
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-293_2/config/initializers/warden.rb"
               data-name="CDB-293_2"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-293_2">
                CDB-293_2
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-293_title_in_legends/config/initializers/warden.rb"
               data-name="CDB-293_title_in_legends"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-293_title_in_legends">
                CDB-293_title_in_legends
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-296/config/initializers/warden.rb"
               data-name="CDB-296"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-296">
                CDB-296
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-325_scrolling_issue/config/initializers/warden.rb"
               data-name="CDB-325_scrolling_issue"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-325_scrolling_issue">
                CDB-325_scrolling_issue
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-331_green_color_dashboard/config/initializers/warden.rb"
               data-name="CDB-331_green_color_dashboard"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-331_green_color_dashboard">
                CDB-331_green_color_dashboard
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-335/config/initializers/warden.rb"
               data-name="CDB-335"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-335">
                CDB-335
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-353_merge_error/config/initializers/warden.rb"
               data-name="CDB-353_merge_error"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-353_merge_error">
                CDB-353_merge_error
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-395_filter_null/config/initializers/warden.rb"
               data-name="CDB-395_filter_null"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-395_filter_null">
                CDB-395_filter_null
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-404/config/initializers/warden.rb"
               data-name="CDB-404"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-404">
                CDB-404
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-420/config/initializers/warden.rb"
               data-name="CDB-420"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-420">
                CDB-420
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-421_unify_marker_width/config/initializers/warden.rb"
               data-name="CDB-421_unify_marker_width"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-421_unify_marker_width">
                CDB-421_unify_marker_width
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-443_error_on_overquota_message/config/initializers/warden.rb"
               data-name="CDB-443_error_on_overquota_message"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-443_error_on_overquota_message">
                CDB-443_error_on_overquota_message
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-450_fix_support_alignment/config/initializers/warden.rb"
               data-name="CDB-450_fix_support_alignment"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-450_fix_support_alignment">
                CDB-450_fix_support_alignment
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-466_comma_separators/config/initializers/warden.rb"
               data-name="CDB-466_comma_separators"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-466_comma_separators">
                CDB-466_comma_separators
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-478_fix_vis_order_on_remove/config/initializers/warden.rb"
               data-name="CDB-478_fix_vis_order_on_remove"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-478_fix_vis_order_on_remove">
                CDB-478_fix_vis_order_on_remove
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-479_new_visualization_order/config/initializers/warden.rb"
               data-name="CDB-479_new_visualization_order"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-479_new_visualization_order">
                CDB-479_new_visualization_order
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-548-ssl-fix/config/initializers/warden.rb"
               data-name="CDB-548-ssl-fix"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-548-ssl-fix">
                CDB-548-ssl-fix
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-809/config/initializers/warden.rb"
               data-name="CDB-809"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-809">
                CDB-809
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-866/config/initializers/warden.rb"
               data-name="CDB-866"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-866">
                CDB-866
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1042-test/config/initializers/warden.rb"
               data-name="CDB-1042-test"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1042-test">
                CDB-1042-test
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1083/config/initializers/warden.rb"
               data-name="CDB-1083"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1083">
                CDB-1083
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1100/config/initializers/warden.rb"
               data-name="CDB-1100"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1100">
                CDB-1100
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1146/config/initializers/warden.rb"
               data-name="CDB-1146"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1146">
                CDB-1146
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1202/config/initializers/warden.rb"
               data-name="CDB-1202"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1202">
                CDB-1202
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1233/config/initializers/warden.rb"
               data-name="CDB-1233"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1233">
                CDB-1233
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1260/config/initializers/warden.rb"
               data-name="CDB-1260"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1260">
                CDB-1260
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1302/config/initializers/warden.rb"
               data-name="CDB-1302"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1302">
                CDB-1302
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1345/config/initializers/warden.rb"
               data-name="CDB-1345"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1345">
                CDB-1345
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1352/config/initializers/warden.rb"
               data-name="CDB-1352"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1352">
                CDB-1352
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1356/config/initializers/warden.rb"
               data-name="CDB-1356"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1356">
                CDB-1356
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1362/config/initializers/warden.rb"
               data-name="CDB-1362"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1362">
                CDB-1362
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1368/config/initializers/warden.rb"
               data-name="CDB-1368"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1368">
                CDB-1368
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1375/config/initializers/warden.rb"
               data-name="CDB-1375"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1375">
                CDB-1375
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1376/config/initializers/warden.rb"
               data-name="CDB-1376"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1376">
                CDB-1376
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1381/config/initializers/warden.rb"
               data-name="CDB-1381"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1381">
                CDB-1381
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1382/config/initializers/warden.rb"
               data-name="CDB-1382"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1382">
                CDB-1382
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1387/config/initializers/warden.rb"
               data-name="CDB-1387"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1387">
                CDB-1387
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1389/config/initializers/warden.rb"
               data-name="CDB-1389"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1389">
                CDB-1389
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1392/config/initializers/warden.rb"
               data-name="CDB-1392"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1392">
                CDB-1392
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1442/config/initializers/warden.rb"
               data-name="CDB-1442"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1442">
                CDB-1442
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1461/config/initializers/warden.rb"
               data-name="CDB-1461"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1461">
                CDB-1461
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1496/config/initializers/warden.rb"
               data-name="CDB-1496"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1496">
                CDB-1496
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1497/config/initializers/warden.rb"
               data-name="CDB-1497"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1497">
                CDB-1497
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1514/config/initializers/warden.rb"
               data-name="CDB-1514"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1514">
                CDB-1514
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1519/config/initializers/warden.rb"
               data-name="CDB-1519"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1519">
                CDB-1519
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1579/config/initializers/warden.rb"
               data-name="CDB-1579"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1579">
                CDB-1579
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1589/config/initializers/warden.rb"
               data-name="CDB-1589"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1589">
                CDB-1589
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1623/config/initializers/warden.rb"
               data-name="CDB-1623"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1623">
                CDB-1623
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1657/config/initializers/warden.rb"
               data-name="CDB-1657"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1657">
                CDB-1657
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1669/config/initializers/warden.rb"
               data-name="CDB-1669"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1669">
                CDB-1669
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1684/config/initializers/warden.rb"
               data-name="CDB-1684"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1684">
                CDB-1684
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1718/config/initializers/warden.rb"
               data-name="CDB-1718"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1718">
                CDB-1718
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1814-Bug_enter_key_delete_column/config/initializers/warden.rb"
               data-name="CDB-1814-Bug_enter_key_delete_column"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1814-Bug_enter_key_delete_column">
                CDB-1814-Bug_enter_key_delete_column
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1829_32-Change_FE_labels/config/initializers/warden.rb"
               data-name="CDB-1829_32-Change_FE_labels"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1829_32-Change_FE_labels">
                CDB-1829_32-Change_FE_labels
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1846/config/initializers/warden.rb"
               data-name="CDB-1846"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1846">
                CDB-1846
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1848/config/initializers/warden.rb"
               data-name="CDB-1848"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1848">
                CDB-1848
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1863/config/initializers/warden.rb"
               data-name="CDB-1863"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1863">
                CDB-1863
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1864/config/initializers/warden.rb"
               data-name="CDB-1864"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1864">
                CDB-1864
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1870/config/initializers/warden.rb"
               data-name="CDB-1870"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1870">
                CDB-1870
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1893/config/initializers/warden.rb"
               data-name="CDB-1893"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1893">
                CDB-1893
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1906/config/initializers/warden.rb"
               data-name="CDB-1906"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1906">
                CDB-1906
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1911/config/initializers/warden.rb"
               data-name="CDB-1911"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1911">
                CDB-1911
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1936/config/initializers/warden.rb"
               data-name="CDB-1936"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1936">
                CDB-1936
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1978/config/initializers/warden.rb"
               data-name="CDB-1978"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1978">
                CDB-1978
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1979/config/initializers/warden.rb"
               data-name="CDB-1979"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1979">
                CDB-1979
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1985/config/initializers/warden.rb"
               data-name="CDB-1985"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1985">
                CDB-1985
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-1990/config/initializers/warden.rb"
               data-name="CDB-1990"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-1990">
                CDB-1990
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2001/config/initializers/warden.rb"
               data-name="CDB-2001"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2001">
                CDB-2001
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2003/config/initializers/warden.rb"
               data-name="CDB-2003"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2003">
                CDB-2003
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2016/config/initializers/warden.rb"
               data-name="CDB-2016"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2016">
                CDB-2016
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2052/config/initializers/warden.rb"
               data-name="CDB-2052"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2052">
                CDB-2052
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2568/config/initializers/warden.rb"
               data-name="CDB-2568"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2568">
                CDB-2568
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2572/config/initializers/warden.rb"
               data-name="CDB-2572"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2572">
                CDB-2572
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2595/config/initializers/warden.rb"
               data-name="CDB-2595"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2595">
                CDB-2595
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2620/config/initializers/warden.rb"
               data-name="CDB-2620"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2620">
                CDB-2620
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2628/config/initializers/warden.rb"
               data-name="CDB-2628"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2628">
                CDB-2628
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2707/config/initializers/warden.rb"
               data-name="CDB-2707"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2707">
                CDB-2707
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2709/config/initializers/warden.rb"
               data-name="CDB-2709"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2709">
                CDB-2709
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2711/config/initializers/warden.rb"
               data-name="CDB-2711"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2711">
                CDB-2711
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2773/config/initializers/warden.rb"
               data-name="CDB-2773"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2773">
                CDB-2773
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2779/config/initializers/warden.rb"
               data-name="CDB-2779"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2779">
                CDB-2779
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2783/config/initializers/warden.rb"
               data-name="CDB-2783"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2783">
                CDB-2783
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2784/config/initializers/warden.rb"
               data-name="CDB-2784"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2784">
                CDB-2784
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2789/config/initializers/warden.rb"
               data-name="CDB-2789"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2789">
                CDB-2789
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2806/config/initializers/warden.rb"
               data-name="CDB-2806"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2806">
                CDB-2806
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2807/config/initializers/warden.rb"
               data-name="CDB-2807"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2807">
                CDB-2807
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2832/config/initializers/warden.rb"
               data-name="CDB-2832"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2832">
                CDB-2832
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2852/config/initializers/warden.rb"
               data-name="CDB-2852"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2852">
                CDB-2852
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2871/config/initializers/warden.rb"
               data-name="CDB-2871"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2871">
                CDB-2871
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2891/config/initializers/warden.rb"
               data-name="CDB-2891"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2891">
                CDB-2891
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2897/config/initializers/warden.rb"
               data-name="CDB-2897"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2897">
                CDB-2897
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2926/config/initializers/warden.rb"
               data-name="CDB-2926"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2926">
                CDB-2926
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2929/config/initializers/warden.rb"
               data-name="CDB-2929"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2929">
                CDB-2929
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2960/config/initializers/warden.rb"
               data-name="CDB-2960"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2960">
                CDB-2960
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2960_test/config/initializers/warden.rb"
               data-name="CDB-2960_test"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2960_test">
                CDB-2960_test
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2964/config/initializers/warden.rb"
               data-name="CDB-2964"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2964">
                CDB-2964
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-2990/config/initializers/warden.rb"
               data-name="CDB-2990"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-2990">
                CDB-2990
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3008/config/initializers/warden.rb"
               data-name="CDB-3008"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3008">
                CDB-3008
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3061/config/initializers/warden.rb"
               data-name="CDB-3061"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3061">
                CDB-3061
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3065/config/initializers/warden.rb"
               data-name="CDB-3065"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3065">
                CDB-3065
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3076/config/initializers/warden.rb"
               data-name="CDB-3076"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3076">
                CDB-3076
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3077/config/initializers/warden.rb"
               data-name="CDB-3077"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3077">
                CDB-3077
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3121/config/initializers/warden.rb"
               data-name="CDB-3121"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3121">
                CDB-3121
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3179/config/initializers/warden.rb"
               data-name="CDB-3179"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3179">
                CDB-3179
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3212/config/initializers/warden.rb"
               data-name="CDB-3212"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3212">
                CDB-3212
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3350/config/initializers/warden.rb"
               data-name="CDB-3350"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3350">
                CDB-3350
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3356/config/initializers/warden.rb"
               data-name="CDB-3356"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3356">
                CDB-3356
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3361/config/initializers/warden.rb"
               data-name="CDB-3361"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3361">
                CDB-3361
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3397/config/initializers/warden.rb"
               data-name="CDB-3397"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3397">
                CDB-3397
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3436-pooler/config/initializers/warden.rb"
               data-name="CDB-3436-pooler"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3436-pooler">
                CDB-3436-pooler
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3442/config/initializers/warden.rb"
               data-name="CDB-3442"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3442">
                CDB-3442
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3465/config/initializers/warden.rb"
               data-name="CDB-3465"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3465">
                CDB-3465
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3468/config/initializers/warden.rb"
               data-name="CDB-3468"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3468">
                CDB-3468
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3475/config/initializers/warden.rb"
               data-name="CDB-3475"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3475">
                CDB-3475
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3485/config/initializers/warden.rb"
               data-name="CDB-3485"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3485">
                CDB-3485
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3486/config/initializers/warden.rb"
               data-name="CDB-3486"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3486">
                CDB-3486
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3487/config/initializers/warden.rb"
               data-name="CDB-3487"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3487">
                CDB-3487
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3489/config/initializers/warden.rb"
               data-name="CDB-3489"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3489">
                CDB-3489
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3496/config/initializers/warden.rb"
               data-name="CDB-3496"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3496">
                CDB-3496
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3508/config/initializers/warden.rb"
               data-name="CDB-3508"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3508">
                CDB-3508
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3510/config/initializers/warden.rb"
               data-name="CDB-3510"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3510">
                CDB-3510
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3549/config/initializers/warden.rb"
               data-name="CDB-3549"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3549">
                CDB-3549
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3556/config/initializers/warden.rb"
               data-name="CDB-3556"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3556">
                CDB-3556
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3564/config/initializers/warden.rb"
               data-name="CDB-3564"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3564">
                CDB-3564
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3565/config/initializers/warden.rb"
               data-name="CDB-3565"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3565">
                CDB-3565
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3608/config/initializers/warden.rb"
               data-name="CDB-3608"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3608">
                CDB-3608
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3613/config/initializers/warden.rb"
               data-name="CDB-3613"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3613">
                CDB-3613
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3662/config/initializers/warden.rb"
               data-name="CDB-3662"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3662">
                CDB-3662
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3679/config/initializers/warden.rb"
               data-name="CDB-3679"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3679">
                CDB-3679
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3708/config/initializers/warden.rb"
               data-name="CDB-3708"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3708">
                CDB-3708
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3734/config/initializers/warden.rb"
               data-name="CDB-3734"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3734">
                CDB-3734
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3781/config/initializers/warden.rb"
               data-name="CDB-3781"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3781">
                CDB-3781
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3782/config/initializers/warden.rb"
               data-name="CDB-3782"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3782">
                CDB-3782
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3795/config/initializers/warden.rb"
               data-name="CDB-3795"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3795">
                CDB-3795
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3805/config/initializers/warden.rb"
               data-name="CDB-3805"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3805">
                CDB-3805
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3812/config/initializers/warden.rb"
               data-name="CDB-3812"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3812">
                CDB-3812
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3820/config/initializers/warden.rb"
               data-name="CDB-3820"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3820">
                CDB-3820
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3821/config/initializers/warden.rb"
               data-name="CDB-3821"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3821">
                CDB-3821
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3822/config/initializers/warden.rb"
               data-name="CDB-3822"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3822">
                CDB-3822
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3823/config/initializers/warden.rb"
               data-name="CDB-3823"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3823">
                CDB-3823
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3832/config/initializers/warden.rb"
               data-name="CDB-3832"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3832">
                CDB-3832
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3833/config/initializers/warden.rb"
               data-name="CDB-3833"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3833">
                CDB-3833
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3845/config/initializers/warden.rb"
               data-name="CDB-3845"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3845">
                CDB-3845
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3874/config/initializers/warden.rb"
               data-name="CDB-3874"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3874">
                CDB-3874
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3894/config/initializers/warden.rb"
               data-name="CDB-3894"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3894">
                CDB-3894
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3913/config/initializers/warden.rb"
               data-name="CDB-3913"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3913">
                CDB-3913
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3915/config/initializers/warden.rb"
               data-name="CDB-3915"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3915">
                CDB-3915
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3922/config/initializers/warden.rb"
               data-name="CDB-3922"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3922">
                CDB-3922
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3923/config/initializers/warden.rb"
               data-name="CDB-3923"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3923">
                CDB-3923
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3928/config/initializers/warden.rb"
               data-name="CDB-3928"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3928">
                CDB-3928
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-3938/config/initializers/warden.rb"
               data-name="CDB-3938"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-3938">
                CDB-3938
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-4001/config/initializers/warden.rb"
               data-name="CDB-4001"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-4001">
                CDB-4001
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-4060/config/initializers/warden.rb"
               data-name="CDB-4060"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-4060">
                CDB-4060
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-4080/config/initializers/warden.rb"
               data-name="CDB-4080"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-4080">
                CDB-4080
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-4086/config/initializers/warden.rb"
               data-name="CDB-4086"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-4086">
                CDB-4086
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-4118/config/initializers/warden.rb"
               data-name="CDB-4118"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-4118">
                CDB-4118
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-4159/config/initializers/warden.rb"
               data-name="CDB-4159"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-4159">
                CDB-4159
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-4203/config/initializers/warden.rb"
               data-name="CDB-4203"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-4203">
                CDB-4203
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-4209/config/initializers/warden.rb"
               data-name="CDB-4209"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-4209">
                CDB-4209
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-4233/config/initializers/warden.rb"
               data-name="CDB-4233"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-4233">
                CDB-4233
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-4237/config/initializers/warden.rb"
               data-name="CDB-4237"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-4237">
                CDB-4237
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-4246/config/initializers/warden.rb"
               data-name="CDB-4246"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-4246">
                CDB-4246
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-4263/config/initializers/warden.rb"
               data-name="CDB-4263"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-4263">
                CDB-4263
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-4298/config/initializers/warden.rb"
               data-name="CDB-4298"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-4298">
                CDB-4298
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-4352/config/initializers/warden.rb"
               data-name="CDB-4352"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-4352">
                CDB-4352
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-4399/config/initializers/warden.rb"
               data-name="CDB-4399"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-4399">
                CDB-4399
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-4434/config/initializers/warden.rb"
               data-name="CDB-4434"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-4434">
                CDB-4434
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-XXX/config/initializers/warden.rb"
               data-name="CDB-XXX"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-XXX">
                CDB-XXX
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/CDB-cdbext-2939-betterimport/config/initializers/warden.rb"
               data-name="CDB-cdbext-2939-betterimport"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="CDB-cdbext-2939-betterimport">
                CDB-cdbext-2939-betterimport
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/Container_Disable_geocoding/config/initializers/warden.rb"
               data-name="Container_Disable_geocoding"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="Container_Disable_geocoding">
                Container_Disable_geocoding
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/OPS-343/config/initializers/warden.rb"
               data-name="OPS-343"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="OPS-343">
                OPS-343
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/OPS-343-uuid/config/initializers/warden.rb"
               data-name="OPS-343-uuid"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="OPS-343-uuid">
                OPS-343-uuid
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/add_grant_user/config/initializers/warden.rb"
               data-name="add_grant_user"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="add_grant_user">
                add_grant_user
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/add-rake-varnish/config/initializers/warden.rb"
               data-name="add-rake-varnish"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="add-rake-varnish">
                add-rake-varnish
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/add_set_user_priv_rake/config/initializers/warden.rb"
               data-name="add_set_user_priv_rake"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="add_set_user_priv_rake">
                add_set_user_priv_rake
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/add-surrogate-varnish-rake/config/initializers/warden.rb"
               data-name="add-surrogate-varnish-rake"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="add-surrogate-varnish-rake">
                add-surrogate-varnish-rake
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/add-trace-for-layers-removal/config/initializers/warden.rb"
               data-name="add-trace-for-layers-removal"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="add-trace-for-layers-removal">
                add-trace-for-layers-removal
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/address-support/config/initializers/warden.rb"
               data-name="address-support"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="address-support">
                address-support
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/analysis-async/config/initializers/warden.rb"
               data-name="analysis-async"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="analysis-async">
                analysis-async
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/annotations-enter-fix/config/initializers/warden.rb"
               data-name="annotations-enter-fix"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="annotations-enter-fix">
                annotations-enter-fix
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/api-keys/config/initializers/warden.rb"
               data-name="api-keys"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="api-keys">
                api-keys
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/appender/config/initializers/warden.rb"
               data-name="appender"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="appender">
                appender
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/ar-fix-models/config/initializers/warden.rb"
               data-name="ar-fix-models"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="ar-fix-models">
                ar-fix-models
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/asset-pipeline/config/initializers/warden.rb"
               data-name="asset-pipeline"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="asset-pipeline">
                asset-pipeline
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/background-importer/config/initializers/warden.rb"
               data-name="background-importer"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="background-importer">
                background-importer
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/basemap_fix/config/initializers/warden.rb"
               data-name="basemap_fix"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="basemap_fix">
                basemap_fix
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/bug/CDB-374/config/initializers/warden.rb"
               data-name="bug/CDB-374"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="bug/CDB-374">
                bug/CDB-374
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/bug/CDB-467/config/initializers/warden.rb"
               data-name="bug/CDB-467"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="bug/CDB-467">
                bug/CDB-467
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/bug/CDB-647/config/initializers/warden.rb"
               data-name="bug/CDB-647"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="bug/CDB-647">
                bug/CDB-647
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/bug/CDB-659-remove-api-keys-table/config/initializers/warden.rb"
               data-name="bug/CDB-659-remove-api-keys-table"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="bug/CDB-659-remove-api-keys-table">
                bug/CDB-659-remove-api-keys-table
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/bug/CDB-790-wrong-error-message-overquota/config/initializers/warden.rb"
               data-name="bug/CDB-790-wrong-error-message-overquota"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="bug/CDB-790-wrong-error-message-overquota">
                bug/CDB-790-wrong-error-message-overquota
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/bug/CDB-845/config/initializers/warden.rb"
               data-name="bug/CDB-845"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="bug/CDB-845">
                bug/CDB-845
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/bug/CDB-866/config/initializers/warden.rb"
               data-name="bug/CDB-866"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="bug/CDB-866">
                bug/CDB-866
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/bug/CDB-1001-geocoding-double-quotes/config/initializers/warden.rb"
               data-name="bug/CDB-1001-geocoding-double-quotes"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="bug/CDB-1001-geocoding-double-quotes">
                bug/CDB-1001-geocoding-double-quotes
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/bug/CDB-1003-string-spec-failure/config/initializers/warden.rb"
               data-name="bug/CDB-1003-string-spec-failure"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="bug/CDB-1003-string-spec-failure">
                bug/CDB-1003-string-spec-failure
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/bug/CDB-1103/config/initializers/warden.rb"
               data-name="bug/CDB-1103"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="bug/CDB-1103">
                bug/CDB-1103
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/bug/CDB-1148/config/initializers/warden.rb"
               data-name="bug/CDB-1148"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="bug/CDB-1148">
                bug/CDB-1148
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/bug/CDB-1448/config/initializers/warden.rb"
               data-name="bug/CDB-1448"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="bug/CDB-1448">
                bug/CDB-1448
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/cache-geometry-types/config/initializers/warden.rb"
               data-name="cache-geometry-types"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="cache-geometry-types">
                cache-geometry-types
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/cartodb_com_references/config/initializers/warden.rb"
               data-name="cartodb_com_references"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="cartodb_com_references">
                cartodb_com_references
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/cartodb_labels_on_top/config/initializers/warden.rb"
               data-name="cartodb_labels_on_top"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="cartodb_labels_on_top">
                cartodb_labels_on_top
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/cartodb-postgresql-extension-no-tests/config/initializers/warden.rb"
               data-name="cartodb-postgresql-extension-no-tests"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="cartodb-postgresql-extension-no-tests">
                cartodb-postgresql-extension-no-tests
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/cartodb_wizard_vis/config/initializers/warden.rb"
               data-name="cartodb_wizard_vis"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="cartodb_wizard_vis">
                cartodb_wizard_vis
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/cartodbfy/config/initializers/warden.rb"
               data-name="cartodbfy"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="cartodbfy">
                cartodbfy
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/category-map/config/initializers/warden.rb"
               data-name="category-map"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="category-map">
                category-map
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/cdb-113/config/initializers/warden.rb"
               data-name="cdb-113"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="cdb-113">
                cdb-113
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/cloud_raindrops/config/initializers/warden.rb"
               data-name="cloud_raindrops"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="cloud_raindrops">
                cloud_raindrops
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/color-map-improvements/config/initializers/warden.rb"
               data-name="color-map-improvements"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="color-map-improvements">
                color-map-improvements
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/common_source_of_map_views/config/initializers/warden.rb"
               data-name="common_source_of_map_views"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="common_source_of_map_views">
                common_source_of_map_views
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/cp1203-domainless_routing_issue/config/initializers/warden.rb"
               data-name="cp1203-domainless_routing_issue"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="cp1203-domainless_routing_issue">
                cp1203-domainless_routing_issue
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/crazy-egg2/config/initializers/warden.rb"
               data-name="crazy-egg2"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="crazy-egg2">
                crazy-egg2
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/data-library/config/initializers/warden.rb"
               data-name="data-library"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="data-library">
                data-library
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/data-st/config/initializers/warden.rb"
               data-name="data-st"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="data-st">
                data-st
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/database_info/config/initializers/warden.rb"
               data-name="database_info"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="database_info">
                database_info
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/date-analysis/config/initializers/warden.rb"
               data-name="date-analysis"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="date-analysis">
                date-analysis
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/detach-schema-from-organizations/config/initializers/warden.rb"
               data-name="detach-schema-from-organizations"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="detach-schema-from-organizations">
                detach-schema-from-organizations
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/develop-pgfirewall/config/initializers/warden.rb"
               data-name="develop-pgfirewall"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="develop-pgfirewall">
                develop-pgfirewall
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/do-not-save-wizards-when-invalid/config/initializers/warden.rb"
               data-name="do-not-save-wizards-when-invalid"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="do-not-save-wizards-when-invalid">
                do-not-save-wizards-when-invalid
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/dont-geocode-short-or-just-numbers/config/initializers/warden.rb"
               data-name="dont-geocode-short-or-just-numbers"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="dont-geocode-short-or-just-numbers">
                dont-geocode-short-or-just-numbers
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/drop-schema-privileges-rake/config/initializers/warden.rb"
               data-name="drop-schema-privileges-rake"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="drop-schema-privileges-rake">
                drop-schema-privileges-rake
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/dropdown/config/initializers/warden.rb"
               data-name="dropdown"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="dropdown">
                dropdown
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/embed_fixed_callback/config/initializers/warden.rb"
               data-name="embed_fixed_callback"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="embed_fixed_callback">
                embed_fixed_callback
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/embed-map-owner-link/config/initializers/warden.rb"
               data-name="embed-map-owner-link"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="embed-map-owner-link">
                embed-map-owner-link
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/enable-automatic-geocodings/config/initializers/warden.rb"
               data-name="enable-automatic-geocodings"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="enable-automatic-geocodings">
                enable-automatic-geocodings
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/explore_api_basics/config/initializers/warden.rb"
               data-name="explore_api_basics"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="explore_api_basics">
                explore_api_basics
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/export_image_revamp/config/initializers/warden.rb"
               data-name="export_image_revamp"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="export_image_revamp">
                export_image_revamp
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/export_image_revap_pre_3.15/config/initializers/warden.rb"
               data-name="export_image_revap_pre_3.15"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="export_image_revap_pre_3.15">
                export_image_revap_pre_3.15
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/2281_metadata_sql/config/initializers/warden.rb"
               data-name="feature/2281_metadata_sql"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/2281_metadata_sql">
                feature/2281_metadata_sql
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-35/config/initializers/warden.rb"
               data-name="feature/CDB-35"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-35">
                feature/CDB-35
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-86-adapt-licenses-manager/config/initializers/warden.rb"
               data-name="feature/CDB-86-adapt-licenses-manager"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-86-adapt-licenses-manager">
                feature/CDB-86-adapt-licenses-manager
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-151/config/initializers/warden.rb"
               data-name="feature/CDB-151"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-151">
                feature/CDB-151
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-169/config/initializers/warden.rb"
               data-name="feature/CDB-169"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-169">
                feature/CDB-169
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-186/config/initializers/warden.rb"
               data-name="feature/CDB-186"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-186">
                feature/CDB-186
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-228/config/initializers/warden.rb"
               data-name="feature/CDB-228"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-228">
                feature/CDB-228
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-335-overquota-error-message-on-boxes/config/initializers/warden.rb"
               data-name="feature/CDB-335-overquota-error-message-on-boxes"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-335-overquota-error-message-on-boxes">
                feature/CDB-335-overquota-error-message-on-boxes
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-342/config/initializers/warden.rb"
               data-name="feature/CDB-342"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-342">
                feature/CDB-342
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-407_bis/config/initializers/warden.rb"
               data-name="feature/CDB-407_bis"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-407_bis">
                feature/CDB-407_bis
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-413/config/initializers/warden.rb"
               data-name="feature/CDB-413"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-413">
                feature/CDB-413
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-419-performance-problems-on-map-views-checking/config/initializers/warden.rb"
               data-name="feature/CDB-419-performance-problems-on-map-views-checking"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-419-performance-problems-on-map-views-checking">
                feature/CDB-419-performance-problems-on-map-views-checking
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-449/config/initializers/warden.rb"
               data-name="feature/CDB-449"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-449">
                feature/CDB-449
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-459/config/initializers/warden.rb"
               data-name="feature/CDB-459"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-459">
                feature/CDB-459
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-570-different-schema-for-geocoder/config/initializers/warden.rb"
               data-name="feature/CDB-570-different-schema-for-geocoder"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-570-different-schema-for-geocoder">
                feature/CDB-570-different-schema-for-geocoder
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-683/config/initializers/warden.rb"
               data-name="feature/CDB-683"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-683">
                feature/CDB-683
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-692/config/initializers/warden.rb"
               data-name="feature/CDB-692"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-692">
                feature/CDB-692
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-718-geocoder-billing/config/initializers/warden.rb"
               data-name="feature/CDB-718-geocoder-billing"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-718-geocoder-billing">
                feature/CDB-718-geocoder-billing
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-779/config/initializers/warden.rb"
               data-name="feature/CDB-779"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-779">
                feature/CDB-779
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-801/config/initializers/warden.rb"
               data-name="feature/CDB-801"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-801">
                feature/CDB-801
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-804-automatic-geocoder/config/initializers/warden.rb"
               data-name="feature/CDB-804-automatic-geocoder"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-804-automatic-geocoder">
                feature/CDB-804-automatic-geocoder
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-868-replicate-db-password-to-redis/config/initializers/warden.rb"
               data-name="feature/CDB-868-replicate-db-password-to-redis"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-868-replicate-db-password-to-redis">
                feature/CDB-868-replicate-db-password-to-redis
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-947-fix-geocoding-with-linebreaks/config/initializers/warden.rb"
               data-name="feature/CDB-947-fix-geocoding-with-linebreaks"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-947-fix-geocoding-with-linebreaks">
                feature/CDB-947-fix-geocoding-with-linebreaks
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-948-fix-geocoder-cancelling/config/initializers/warden.rb"
               data-name="feature/CDB-948-fix-geocoder-cancelling"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-948-fix-geocoder-cancelling">
                feature/CDB-948-fix-geocoder-cancelling
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-988-nokia-geocoding-api-not-working/config/initializers/warden.rb"
               data-name="feature/CDB-988-nokia-geocoding-api-not-working"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-988-nokia-geocoding-api-not-working">
                feature/CDB-988-nokia-geocoding-api-not-working
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-1020-move-api-keys-to-postgres/config/initializers/warden.rb"
               data-name="feature/CDB-1020-move-api-keys-to-postgres"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-1020-move-api-keys-to-postgres">
                feature/CDB-1020-move-api-keys-to-postgres
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-1032-notifications/config/initializers/warden.rb"
               data-name="feature/CDB-1032-notifications"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-1032-notifications">
                feature/CDB-1032-notifications
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-1100/config/initializers/warden.rb"
               data-name="feature/CDB-1100"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-1100">
                feature/CDB-1100
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB-1184/config/initializers/warden.rb"
               data-name="feature/CDB-1184"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB-1184">
                feature/CDB-1184
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/CDB_CartodbfyTable/config/initializers/warden.rb"
               data-name="feature/CDB_CartodbfyTable"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/CDB_CartodbfyTable">
                feature/CDB_CartodbfyTable
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/admin-integration/config/initializers/warden.rb"
               data-name="feature/admin-integration"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/admin-integration">
                feature/admin-integration
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/asset-sync/config/initializers/warden.rb"
               data-name="feature/asset-sync"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/asset-sync">
                feature/asset-sync
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/audit_load_functions/config/initializers/warden.rb"
               data-name="feature/audit_load_functions"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/audit_load_functions">
                feature/audit_load_functions
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/cartodb-mu/config/initializers/warden.rb"
               data-name="feature/cartodb-mu"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/cartodb-mu">
                feature/cartodb-mu
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/cloud/config/initializers/warden.rb"
               data-name="feature/cloud"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/cloud">
                feature/cloud
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/cloud-20140117/config/initializers/warden.rb"
               data-name="feature/cloud-20140117"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/cloud-20140117">
                feature/cloud-20140117
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/distributed/config/initializers/warden.rb"
               data-name="feature/distributed"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/distributed">
                feature/distributed
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/geocoder/config/initializers/warden.rb"
               data-name="feature/geocoder"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/geocoder">
                feature/geocoder
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/hrds/config/initializers/warden.rb"
               data-name="feature/hrds"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/hrds">
                feature/hrds
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/legends/config/initializers/warden.rb"
               data-name="feature/legends"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/legends">
                feature/legends
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/new_importer/config/initializers/warden.rb"
               data-name="feature/new_importer"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/new_importer">
                feature/new_importer
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/split_cartocss_editor/config/initializers/warden.rb"
               data-name="feature/split_cartocss_editor"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/split_cartocss_editor">
                feature/split_cartocss_editor
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/sync-tables/config/initializers/warden.rb"
               data-name="feature/sync-tables"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/sync-tables">
                feature/sync-tables
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/tablemetadata-view/config/initializers/warden.rb"
               data-name="feature/tablemetadata-view"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/tablemetadata-view">
                feature/tablemetadata-view
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/timestamptz/config/initializers/warden.rb"
               data-name="feature/timestamptz"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/timestamptz">
                feature/timestamptz
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/torque-layer-drag/config/initializers/warden.rb"
               data-name="feature/torque-layer-drag"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/torque-layer-drag">
                feature/torque-layer-drag
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/uuid/config/initializers/warden.rb"
               data-name="feature/uuid"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/uuid">
                feature/uuid
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/feature/uuid-20140117/config/initializers/warden.rb"
               data-name="feature/uuid-20140117"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="feature/uuid-20140117">
                feature/uuid-20140117
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/features/CDB-361/config/initializers/warden.rb"
               data-name="features/CDB-361"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="features/CDB-361">
                features/CDB-361
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/features/CDB-441/config/initializers/warden.rb"
               data-name="features/CDB-441"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="features/CDB-441">
                features/CDB-441
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/features/function_metadata/config/initializers/warden.rb"
               data-name="features/function_metadata"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="features/function_metadata">
                features/function_metadata
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/features/relocator2/config/initializers/warden.rb"
               data-name="features/relocator2"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="features/relocator2">
                features/relocator2
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix/3013/config/initializers/warden.rb"
               data-name="fix/3013"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix/3013">
                fix/3013
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix/CDB-8/config/initializers/warden.rb"
               data-name="fix/CDB-8"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix/CDB-8">
                fix/CDB-8
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix/CDB-537/config/initializers/warden.rb"
               data-name="fix/CDB-537"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix/CDB-537">
                fix/CDB-537
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix/CDB-660_2/config/initializers/warden.rb"
               data-name="fix/CDB-660_2"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix/CDB-660_2">
                fix/CDB-660_2
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix/CDB-662/config/initializers/warden.rb"
               data-name="fix/CDB-662"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix/CDB-662">
                fix/CDB-662
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix/CDB-858/config/initializers/warden.rb"
               data-name="fix/CDB-858"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix/CDB-858">
                fix/CDB-858
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix/CDB-1043-geocoder-error/config/initializers/warden.rb"
               data-name="fix/CDB-1043-geocoder-error"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix/CDB-1043-geocoder-error">
                fix/CDB-1043-geocoder-error
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix/CDB-1062/config/initializers/warden.rb"
               data-name="fix/CDB-1062"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix/CDB-1062">
                fix/CDB-1062
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix/CDB-1093/config/initializers/warden.rb"
               data-name="fix/CDB-1093"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix/CDB-1093">
                fix/CDB-1093
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix/CDB-1358/config/initializers/warden.rb"
               data-name="fix/CDB-1358"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix/CDB-1358">
                fix/CDB-1358
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix/CDB-1828/config/initializers/warden.rb"
               data-name="fix/CDB-1828"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix/CDB-1828">
                fix/CDB-1828
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix-big-rasters-import/config/initializers/warden.rb"
               data-name="fix-big-rasters-import"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix-big-rasters-import">
                fix-big-rasters-import
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix/cloud-geocoding/config/initializers/warden.rb"
               data-name="fix/cloud-geocoding"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix/cloud-geocoding">
                fix/cloud-geocoding
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix-date-geocoded-as-ip/config/initializers/warden.rb"
               data-name="fix-date-geocoded-as-ip"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix-date-geocoded-as-ip">
                fix-date-geocoded-as-ip
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix/disable-ghost-tables/config/initializers/warden.rb"
               data-name="fix/disable-ghost-tables"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix/disable-ghost-tables">
                fix/disable-ghost-tables
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix/fix-sync-tables-update/config/initializers/warden.rb"
               data-name="fix/fix-sync-tables-update"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix/fix-sync-tables-update">
                fix/fix-sync-tables-update
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix_frontend_cache/config/initializers/warden.rb"
               data-name="fix_frontend_cache"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix_frontend_cache">
                fix_frontend_cache
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix/geocoding-timeouts/config/initializers/warden.rb"
               data-name="fix/geocoding-timeouts"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix/geocoding-timeouts">
                fix/geocoding-timeouts
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix-heatmap/config/initializers/warden.rb"
               data-name="fix-heatmap"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix-heatmap">
                fix-heatmap
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix-migration/config/initializers/warden.rb"
               data-name="fix-migration"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix-migration">
                fix-migration
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix-resque-namespace/config/initializers/warden.rb"
               data-name="fix-resque-namespace"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix-resque-namespace">
                fix-resque-namespace
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix-table-factory/config/initializers/warden.rb"
               data-name="fix-table-factory"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix-table-factory">
                fix-table-factory
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fix-vis-spec/config/initializers/warden.rb"
               data-name="fix-vis-spec"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fix-vis-spec">
                fix-vis-spec
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/fran-pecan-tests/config/initializers/warden.rb"
               data-name="fran-pecan-tests"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="fran-pecan-tests">
                fran-pecan-tests
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/gabete/config/initializers/warden.rb"
               data-name="gabete"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="gabete">
                gabete
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/geom-underscore-fix-3428/config/initializers/warden.rb"
               data-name="geom-underscore-fix-3428"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="geom-underscore-fix-3428">
                geom-underscore-fix-3428
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/geoprocessing/config/initializers/warden.rb"
               data-name="geoprocessing"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="geoprocessing">
                geoprocessing
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/gm-geocoder/config/initializers/warden.rb"
               data-name="gm-geocoder"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="gm-geocoder">
                gm-geocoder
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/gmaps-changes/config/initializers/warden.rb"
               data-name="gmaps-changes"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="gmaps-changes">
                gmaps-changes
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/gmaps-fixes/config/initializers/warden.rb"
               data-name="gmaps-fixes"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="gmaps-fixes">
                gmaps-fixes
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/gmaps_nil_check/config/initializers/warden.rb"
               data-name="gmaps_nil_check"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="gmaps_nil_check">
                gmaps_nil_check
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/gmaps_revival/config/initializers/warden.rb"
               data-name="gmaps_revival"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="gmaps_revival">
                gmaps_revival
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/google_basemaps/config/initializers/warden.rb"
               data-name="google_basemaps"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="google_basemaps">
                google_basemaps
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/grammar/config/initializers/warden.rb"
               data-name="grammar"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="grammar">
                grammar
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/grunt_gitrev_fix/config/initializers/warden.rb"
               data-name="grunt_gitrev_fix"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="grunt_gitrev_fix">
                grunt_gitrev_fix
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/health-check/config/initializers/warden.rb"
               data-name="health-check"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="health-check">
                health-check
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/heat-back/config/initializers/warden.rb"
               data-name="heat-back"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="heat-back">
                heat-back
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/highlighted-map/config/initializers/warden.rb"
               data-name="highlighted-map"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="highlighted-map">
                highlighted-map
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/hotfix-batch-geocodings/config/initializers/warden.rb"
               data-name="hotfix-batch-geocodings"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="hotfix-batch-geocodings">
                hotfix-batch-geocodings
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/hotfix-privacy/config/initializers/warden.rb"
               data-name="hotfix-privacy"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="hotfix-privacy">
                hotfix-privacy
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/hotfix-public-profiles-redirect/config/initializers/warden.rb"
               data-name="hotfix-public-profiles-redirect"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="hotfix-public-profiles-redirect">
                hotfix-public-profiles-redirect
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/hotfix_vizjson_cache/config/initializers/warden.rb"
               data-name="hotfix_vizjson_cache"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="hotfix_vizjson_cache">
                hotfix_vizjson_cache
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/hound-js/config/initializers/warden.rb"
               data-name="hound-js"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="hound-js">
                hound-js
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/image-test/config/initializers/warden.rb"
               data-name="image-test"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="image-test">
                image-test
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/import-dialog/config/initializers/warden.rb"
               data-name="import-dialog"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="import-dialog">
                import-dialog
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/import-options-fixes/config/initializers/warden.rb"
               data-name="import-options-fixes"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="import-options-fixes">
                import-options-fixes
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/import-stats/config/initializers/warden.rb"
               data-name="import-stats"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="import-stats">
                import-stats
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/improved-twitter-cards/config/initializers/warden.rb"
               data-name="improved-twitter-cards"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="improved-twitter-cards">
                improved-twitter-cards
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/improvement/CDB-1141/config/initializers/warden.rb"
               data-name="improvement/CDB-1141"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="improvement/CDB-1141">
                improvement/CDB-1141
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/improvement/CDB-1166/config/initializers/warden.rb"
               data-name="improvement/CDB-1166"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="improvement/CDB-1166">
                improvement/CDB-1166
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/improvement/CDB-1187/config/initializers/warden.rb"
               data-name="improvement/CDB-1187"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="improvement/CDB-1187">
                improvement/CDB-1187
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/invalidation_time/config/initializers/warden.rb"
               data-name="invalidation_time"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="invalidation_time">
                invalidation_time
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/issue-901/config/initializers/warden.rb"
               data-name="issue-901"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="issue-901">
                issue-901
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/issue-1037/config/initializers/warden.rb"
               data-name="issue-1037"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="issue-1037">
                issue-1037
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/issue-1444/config/initializers/warden.rb"
               data-name="issue-1444"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="issue-1444">
                issue-1444
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/issue-1575/config/initializers/warden.rb"
               data-name="issue-1575"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="issue-1575">
                issue-1575
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/issue-1663/config/initializers/warden.rb"
               data-name="issue-1663"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="issue-1663">
                issue-1663
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/issue-1970/config/initializers/warden.rb"
               data-name="issue-1970"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="issue-1970">
                issue-1970
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/issue-2306/config/initializers/warden.rb"
               data-name="issue-2306"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="issue-2306">
                issue-2306
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/issue&#39;2849/config/initializers/warden.rb"
               data-name="issue&#39;2849"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="issue&#39;2849">
                issue&#39;2849
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/issue-3359/config/initializers/warden.rb"
               data-name="issue-3359"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="issue-3359">
                issue-3359
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/issue-3555/config/initializers/warden.rb"
               data-name="issue-3555"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="issue-3555">
                issue-3555
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/issue-4076/config/initializers/warden.rb"
               data-name="issue-4076"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="issue-4076">
                issue-4076
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/issue-4841/config/initializers/warden.rb"
               data-name="issue-4841"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="issue-4841">
                issue-4841
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/issue-5523/config/initializers/warden.rb"
               data-name="issue-5523"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="issue-5523">
                issue-5523
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/issue-5775/config/initializers/warden.rb"
               data-name="issue-5775"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="issue-5775">
                issue-5775
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/labels_on_top_fix_torque/config/initializers/warden.rb"
               data-name="labels_on_top_fix_torque"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="labels_on_top_fix_torque">
                labels_on_top_fix_torque
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/leapfrog-embed-notifications/config/initializers/warden.rb"
               data-name="leapfrog-embed-notifications"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="leapfrog-embed-notifications">
                leapfrog-embed-notifications
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/leapfrog_sync_scraping/config/initializers/warden.rb"
               data-name="leapfrog_sync_scraping"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="leapfrog_sync_scraping">
                leapfrog_sync_scraping
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/less-torque-steps/config/initializers/warden.rb"
               data-name="less-torque-steps"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="less-torque-steps">
                less-torque-steps
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/lf-instagram/config/initializers/warden.rb"
               data-name="lf-instagram"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="lf-instagram">
                lf-instagram
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/line-width-default/config/initializers/warden.rb"
               data-name="line-width-default"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="line-width-default">
                line-width-default
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/local-storage/config/initializers/warden.rb"
               data-name="local-storage"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="local-storage">
                local-storage
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/logo-fixes/config/initializers/warden.rb"
               data-name="logo-fixes"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="logo-fixes">
                logo-fixes
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/manula/config/initializers/warden.rb"
               data-name="manula"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="manula">
                manula
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open selected"
               href="/CartoDB/cartodb/blob/master/config/initializers/warden.rb"
               data-name="master"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="master">
                master
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/master-fix/config/initializers/warden.rb"
               data-name="master-fix"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="master-fix">
                master-fix
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/new-default-torque-color/config/initializers/warden.rb"
               data-name="new-default-torque-color"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="new-default-torque-color">
                new-default-torque-color
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/new_export_image_dialog/config/initializers/warden.rb"
               data-name="new_export_image_dialog"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="new_export_image_dialog">
                new_export_image_dialog
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/new-privacy-selector/config/initializers/warden.rb"
               data-name="new-privacy-selector"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="new-privacy-selector">
                new-privacy-selector
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/new-public-map/config/initializers/warden.rb"
               data-name="new-public-map"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="new-public-map">
                new-public-map
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/odyssey_migrations/config/initializers/warden.rb"
               data-name="odyssey_migrations"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="odyssey_migrations">
                odyssey_migrations
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/oembed-expand/config/initializers/warden.rb"
               data-name="oembed-expand"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="oembed-expand">
                oembed-expand
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/oembed-quickfix/config/initializers/warden.rb"
               data-name="oembed-quickfix"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="oembed-quickfix">
                oembed-quickfix
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/oembed_refactor/config/initializers/warden.rb"
               data-name="oembed_refactor"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="oembed_refactor">
                oembed_refactor
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/optimize-table-geometry-types/config/initializers/warden.rb"
               data-name="optimize-table-geometry-types"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="optimize-table-geometry-types">
                optimize-table-geometry-types
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/pages_tests/config/initializers/warden.rb"
               data-name="pages_tests"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="pages_tests">
                pages_tests
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/parallel_tests/config/initializers/warden.rb"
               data-name="parallel_tests"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="parallel_tests">
                parallel_tests
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/pecan/config/initializers/warden.rb"
               data-name="pecan"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="pecan">
                pecan
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/pecan-background/config/initializers/warden.rb"
               data-name="pecan-background"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="pecan-background">
                pecan-background
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/pecan-background-importer/config/initializers/warden.rb"
               data-name="pecan-background-importer"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="pecan-background-importer">
                pecan-background-importer
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/pecan-more-ignored-words/config/initializers/warden.rb"
               data-name="pecan-more-ignored-words"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="pecan-more-ignored-words">
                pecan-more-ignored-words
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/pecan_new_modals/config/initializers/warden.rb"
               data-name="pecan_new_modals"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="pecan_new_modals">
                pecan_new_modals
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/platform_565_store_user_metadata_from_central/config/initializers/warden.rb"
               data-name="platform_565_store_user_metadata_from_central"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="platform_565_store_user_metadata_from_central">
                platform_565_store_user_metadata_from_central
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/platform-1023/config/initializers/warden.rb"
               data-name="platform-1023"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="platform-1023">
                platform-1023
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/pr-test/config/initializers/warden.rb"
               data-name="pr-test"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="pr-test">
                pr-test
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/pr-test2/config/initializers/warden.rb"
               data-name="pr-test2"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="pr-test2">
                pr-test2
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/pre2.1.3.4/config/initializers/warden.rb"
               data-name="pre2.1.3.4"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="pre2.1.3.4">
                pre2.1.3.4
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/privacy-maps/config/initializers/warden.rb"
               data-name="privacy-maps"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="privacy-maps">
                privacy-maps
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/privacy-maps-share-dialog/config/initializers/warden.rb"
               data-name="privacy-maps-share-dialog"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="privacy-maps-share-dialog">
                privacy-maps-share-dialog
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/privileges-rake/config/initializers/warden.rb"
               data-name="privileges-rake"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="privileges-rake">
                privileges-rake
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/push-test/config/initializers/warden.rb"
               data-name="push-test"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="push-test">
                push-test
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/raindrops/config/initializers/warden.rb"
               data-name="raindrops"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="raindrops">
                raindrops
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/redis-keepalive/config/initializers/warden.rb"
               data-name="redis-keepalive"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="redis-keepalive">
                redis-keepalive
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/refactor_update_gmaps/config/initializers/warden.rb"
               data-name="refactor_update_gmaps"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="refactor_update_gmaps">
                refactor_update_gmaps
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/release/2.13.4/config/initializers/warden.rb"
               data-name="release/2.13.4"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="release/2.13.4">
                release/2.13.4
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/release/2.13.5/config/initializers/warden.rb"
               data-name="release/2.13.5"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="release/2.13.5">
                release/2.13.5
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/release/2.14.2/config/initializers/warden.rb"
               data-name="release/2.14.2"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="release/2.14.2">
                release/2.14.2
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/release/develop-pre-importer-merge/config/initializers/warden.rb"
               data-name="release/develop-pre-importer-merge"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="release/develop-pre-importer-merge">
                release/develop-pre-importer-merge
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/release/function-metadata/config/initializers/warden.rb"
               data-name="release/function-metadata"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="release/function-metadata">
                release/function-metadata
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/release/importer2.3/config/initializers/warden.rb"
               data-name="release/importer2.3"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="release/importer2.3">
                release/importer2.3
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/release/importer2.4/config/initializers/warden.rb"
               data-name="release/importer2.4"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="release/importer2.4">
                release/importer2.4
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/release/lorenzo/config/initializers/warden.rb"
               data-name="release/lorenzo"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="release/lorenzo">
                release/lorenzo
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/release/release/2.13.5/config/initializers/warden.rb"
               data-name="release/release/2.13.5"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="release/release/2.13.5">
                release/release/2.13.5
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/relocator/config/initializers/warden.rb"
               data-name="relocator"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="relocator">
                relocator
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/remove_bbox_store_feature_flag/config/initializers/warden.rb"
               data-name="remove_bbox_store_feature_flag"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="remove_bbox_store_feature_flag">
                remove_bbox_store_feature_flag
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/remove_ducksboard/config/initializers/warden.rb"
               data-name="remove_ducksboard"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="remove_ducksboard">
                remove_ducksboard
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/remove-empty-custom-attributions/config/initializers/warden.rb"
               data-name="remove-empty-custom-attributions"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="remove-empty-custom-attributions">
                remove-empty-custom-attributions
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/remove-generated-files/config/initializers/warden.rb"
               data-name="remove-generated-files"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="remove-generated-files">
                remove-generated-files
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/remove-statsd-per-user-metrics/config/initializers/warden.rb"
               data-name="remove-statsd-per-user-metrics"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="remove-statsd-per-user-metrics">
                remove-statsd-per-user-metrics
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/resque-metrics/config/initializers/warden.rb"
               data-name="resque-metrics"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="resque-metrics">
                resque-metrics
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/revert-1918-login_downcase/config/initializers/warden.rb"
               data-name="revert-1918-login_downcase"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="revert-1918-login_downcase">
                revert-1918-login_downcase
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/revert-2532-revert-1918-login_downcase/config/initializers/warden.rb"
               data-name="revert-2532-revert-1918-login_downcase"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="revert-2532-revert-1918-login_downcase">
                revert-2532-revert-1918-login_downcase
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/revert-3358-mailchimp-video/config/initializers/warden.rb"
               data-name="revert-3358-mailchimp-video"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="revert-3358-mailchimp-video">
                revert-3358-mailchimp-video
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/revert-3391-mapviews-graph/config/initializers/warden.rb"
               data-name="revert-3391-mapviews-graph"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="revert-3391-mapviews-graph">
                revert-3391-mapviews-graph
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/revert-4009-3970-syntax/config/initializers/warden.rb"
               data-name="revert-4009-3970-syntax"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="revert-4009-3970-syntax">
                revert-4009-3970-syntax
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/revert-5270-5216-vizjson-renders-attribution/config/initializers/warden.rb"
               data-name="revert-5270-5216-vizjson-renders-attribution"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="revert-5270-5216-vizjson-renders-attribution">
                revert-5270-5216-vizjson-renders-attribution
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/revert-5609-4992-recover-from-tiler-errors-saving-privacy/config/initializers/warden.rb"
               data-name="revert-5609-4992-recover-from-tiler-errors-saving-privacy"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="revert-5609-4992-recover-from-tiler-errors-saving-privacy">
                revert-5609-4992-recover-from-tiler-errors-saving-privacy
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/rss_leapfrog/config/initializers/warden.rb"
               data-name="rss_leapfrog"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="rss_leapfrog">
                rss_leapfrog
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/s3-upload/config/initializers/warden.rb"
               data-name="s3-upload"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="s3-upload">
                s3-upload
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/static_image_upload_endpoint/config/initializers/warden.rb"
               data-name="static_image_upload_endpoint"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="static_image_upload_endpoint">
                static_image_upload_endpoint
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/sync_invalidation/config/initializers/warden.rb"
               data-name="sync_invalidation"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="sync_invalidation">
                sync_invalidation
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/tag_error_codes/config/initializers/warden.rb"
               data-name="tag_error_codes"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="tag_error_codes">
                tag_error_codes
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/task/CDB-1094/config/initializers/warden.rb"
               data-name="task/CDB-1094"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="task/CDB-1094">
                task/CDB-1094
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/templated-workflows/config/initializers/warden.rb"
               data-name="templated-workflows"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="templated-workflows">
                templated-workflows
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/templatedwor/config/initializers/warden.rb"
               data-name="templatedwor"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="templatedwor">
                templatedwor
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/test-improvements/config/initializers/warden.rb"
               data-name="test-improvements"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="test-improvements">
                test-improvements
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/test-travis/config/initializers/warden.rb"
               data-name="test-travis"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="test-travis">
                test-travis
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/test_triggers_http_sync/config/initializers/warden.rb"
               data-name="test_triggers_http_sync"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="test_triggers_http_sync">
                test_triggers_http_sync
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/torque-default-no-line/config/initializers/warden.rb"
               data-name="torque-default-no-line"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="torque-default-no-line">
                torque-default-no-line
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/trackjs/config/initializers/warden.rb"
               data-name="trackjs"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="trackjs">
                trackjs
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/travis/config/initializers/warden.rb"
               data-name="travis"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="travis">
                travis
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/travis-2.8.0/config/initializers/warden.rb"
               data-name="travis-2.8.0"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="travis-2.8.0">
                travis-2.8.0
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/travis-master/config/initializers/warden.rb"
               data-name="travis-master"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="travis-master">
                travis-master
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/unique_invalidation_client_key/config/initializers/warden.rb"
               data-name="unique_invalidation_client_key"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="unique_invalidation_client_key">
                unique_invalidation_client_key
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/unshare-rake/config/initializers/warden.rb"
               data-name="unshare-rake"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="unshare-rake">
                unshare-rake
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/update_extension_0.8.2/config/initializers/warden.rb"
               data-name="update_extension_0.8.2"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="update_extension_0.8.2">
                update_extension_0.8.2
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/update-license/config/initializers/warden.rb"
               data-name="update-license"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="update-license">
                update-license
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/user-mover/config/initializers/warden.rb"
               data-name="user-mover"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="user-mover">
                user-mover
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/uuid/config/initializers/warden.rb"
               data-name="uuid"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="uuid">
                uuid
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/uuid-squash/config/initializers/warden.rb"
               data-name="uuid-squash"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="uuid-squash">
                uuid-squash
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/vendordatepi/config/initializers/warden.rb"
               data-name="vendordatepi"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="vendordatepi">
                vendordatepi
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/verbose_communication_failures/config/initializers/warden.rb"
               data-name="verbose_communication_failures"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="verbose_communication_failures">
                verbose_communication_failures
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/vizjson_url/config/initializers/warden.rb"
               data-name="vizjson_url"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="vizjson_url">
                vizjson_url
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/warden_auth_skeleton_sample/config/initializers/warden.rb"
               data-name="warden_auth_skeleton_sample"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="warden_auth_skeleton_sample">
                warden_auth_skeleton_sample
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/watcher-no-redis-keys-command/config/initializers/warden.rb"
               data-name="watcher-no-redis-keys-command"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="watcher-no-redis-keys-command">
                watcher-no-redis-keys-command
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/wms-test/config/initializers/warden.rb"
               data-name="wms-test"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="wms-test">
                wms-test
              </span>
            </a>
            <a class="select-menu-item js-navigation-item js-navigation-open "
               href="/CartoDB/cartodb/blob/zoom-binding/config/initializers/warden.rb"
               data-name="zoom-binding"
               data-skip-pjax="true"
               rel="nofollow">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <span class="select-menu-item-text css-truncate-target" title="zoom-binding">
                zoom-binding
              </span>
            </a>
        </div>

          <div class="select-menu-no-results">Nothing to show</div>
      </div>

      <div class="select-menu-list select-menu-tab-bucket js-select-menu-tab-bucket" data-tab-filter="tags">
        <div data-filterable-for="context-commitish-filter-field" data-filterable-type="substring">


            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v3.11.0/config/initializers/warden.rb"
                 data-name="v3.11.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v3.11.0">v3.11.0</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v3.10.2/config/initializers/warden.rb"
                 data-name="v3.10.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v3.10.2">v3.10.2</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v3.9.0/config/initializers/warden.rb"
                 data-name="v3.9.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v3.9.0">v3.9.0</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v3.0.0/config/initializers/warden.rb"
                 data-name="v3.0.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v3.0.0">v3.0.0</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.14.3/config/initializers/warden.rb"
                 data-name="v2.14.3"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.14.3">v2.14.3</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.14.0/config/initializers/warden.rb"
                 data-name="v2.14.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.14.0">v2.14.0</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.13.5/config/initializers/warden.rb"
                 data-name="v2.13.5"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.13.5">v2.13.5</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.13.4/config/initializers/warden.rb"
                 data-name="v2.13.4"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.13.4">v2.13.4</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.13.3/config/initializers/warden.rb"
                 data-name="v2.13.3"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.13.3">v2.13.3</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.13.2/config/initializers/warden.rb"
                 data-name="v2.13.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.13.2">v2.13.2</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.13.1/config/initializers/warden.rb"
                 data-name="v2.13.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.13.1">v2.13.1</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.13.0/config/initializers/warden.rb"
                 data-name="v2.13.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.13.0">v2.13.0</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.11.2/config/initializers/warden.rb"
                 data-name="v2.11.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.11.2">v2.11.2</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.11.1/config/initializers/warden.rb"
                 data-name="v2.11.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.11.1">v2.11.1</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.11.0/config/initializers/warden.rb"
                 data-name="v2.11.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.11.0">v2.11.0</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.10.1/config/initializers/warden.rb"
                 data-name="v2.10.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.10.1">v2.10.1</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.10.0/config/initializers/warden.rb"
                 data-name="v2.10.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.10.0">v2.10.0</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.9.3/config/initializers/warden.rb"
                 data-name="v2.9.3"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.9.3">v2.9.3</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.9.2/config/initializers/warden.rb"
                 data-name="v2.9.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.9.2">v2.9.2</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.9.1/config/initializers/warden.rb"
                 data-name="v2.9.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.9.1">v2.9.1</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.9.0/config/initializers/warden.rb"
                 data-name="v2.9.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.9.0">v2.9.0</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.8.2/config/initializers/warden.rb"
                 data-name="v2.8.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.8.2">v2.8.2</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.8.1/config/initializers/warden.rb"
                 data-name="v2.8.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.8.1">v2.8.1</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.8.0/config/initializers/warden.rb"
                 data-name="v2.8.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.8.0">v2.8.0</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.6.2/config/initializers/warden.rb"
                 data-name="v2.6.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.6.2">v2.6.2</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.6.1/config/initializers/warden.rb"
                 data-name="v2.6.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.6.1">v2.6.1</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.6.0/config/initializers/warden.rb"
                 data-name="v2.6.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.6.0">v2.6.0</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.5.6/config/initializers/warden.rb"
                 data-name="v2.5.6"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.5.6">v2.5.6</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.5.5/config/initializers/warden.rb"
                 data-name="v2.5.5"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.5.5">v2.5.5</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.5.4/config/initializers/warden.rb"
                 data-name="v2.5.4"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.5.4">v2.5.4</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.5.3/config/initializers/warden.rb"
                 data-name="v2.5.3"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.5.3">v2.5.3</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.5.2/config/initializers/warden.rb"
                 data-name="v2.5.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.5.2">v2.5.2</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.5.1/config/initializers/warden.rb"
                 data-name="v2.5.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.5.1">v2.5.1</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.5.0/config/initializers/warden.rb"
                 data-name="v2.5.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.5.0">v2.5.0</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.4.0/config/initializers/warden.rb"
                 data-name="v2.4.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.4.0">v2.4.0</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.3.2/config/initializers/warden.rb"
                 data-name="v2.3.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.3.2">v2.3.2</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.3.1/config/initializers/warden.rb"
                 data-name="v2.3.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.3.1">v2.3.1</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.3.0/config/initializers/warden.rb"
                 data-name="v2.3.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.3.0">v2.3.0</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.2.1/config/initializers/warden.rb"
                 data-name="v2.2.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.2.1">v2.2.1</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.2.0/config/initializers/warden.rb"
                 data-name="v2.2.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.2.0">v2.2.0</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.1.5/config/initializers/warden.rb"
                 data-name="v2.1.5"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.1.5">v2.1.5</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.1.4/config/initializers/warden.rb"
                 data-name="v2.1.4"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.1.4">v2.1.4</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/v2.1/config/initializers/warden.rb"
                 data-name="v2.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="v2.1">v2.1</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/onpremise_v0.20/config/initializers/warden.rb"
                 data-name="onpremise_v0.20"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="onpremise_v0.20">onpremise_v0.20</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/onpremise/config/initializers/warden.rb"
                 data-name="onpremise"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="onpremise">onpremise</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/2.14.1/config/initializers/warden.rb"
                 data-name="2.14.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="2.14.1">2.14.1</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/2.12.0/config/initializers/warden.rb"
                 data-name="2.12.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="2.12.0">2.12.0</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/0.9.4/config/initializers/warden.rb"
                 data-name="0.9.4"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="0.9.4">0.9.4</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/0.9.3/config/initializers/warden.rb"
                 data-name="0.9.3"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="0.9.3">0.9.3</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/0.9.2/config/initializers/warden.rb"
                 data-name="0.9.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="0.9.2">0.9.2</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/0.9.1/config/initializers/warden.rb"
                 data-name="0.9.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="0.9.1">0.9.1</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/0.9.0/config/initializers/warden.rb"
                 data-name="0.9.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="0.9.0">0.9.0</a>
            </div>
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/CartoDB/cartodb/tree/0.1/config/initializers/warden.rb"
                 data-name="0.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="0.1">0.1</a>
            </div>
        </div>

        <div class="select-menu-no-results">Nothing to show</div>
      </div>

    </div>
  </div>
</div>

    <div class="btn-group right">
      <a href="/CartoDB/cartodb/find/master"
            class="js-show-file-finder btn btn-sm empty-icon tooltipped tooltipped-nw"
            data-pjax
            data-hotkey="t"
            aria-label="Quickly jump between files">
        <span class="octicon octicon-list-unordered"></span>
      </a>
      <button aria-label="Copy file path to clipboard" class="js-zeroclipboard btn btn-sm zeroclipboard-button tooltipped tooltipped-s" data-copied-hint="Copied!" type="button"><span class="octicon octicon-clippy"></span></button>
    </div>

    <div class="breadcrumb js-zeroclipboard-target">
      <span class="repo-root js-repo-root"><span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/CartoDB/cartodb" class="" data-branch="master" data-pjax="true" itemscope="url"><span itemprop="title">cartodb</span></a></span></span><span class="separator">/</span><span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/CartoDB/cartodb/tree/master/config" class="" data-branch="master" data-pjax="true" itemscope="url"><span itemprop="title">config</span></a></span><span class="separator">/</span><span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/CartoDB/cartodb/tree/master/config/initializers" class="" data-branch="master" data-pjax="true" itemscope="url"><span itemprop="title">initializers</span></a></span><span class="separator">/</span><strong class="final-path">warden.rb</strong>
    </div>
  </div>


  <div class="commit-tease">
      <span class="right">
        <a class="commit-tease-sha" href="/CartoDB/cartodb/commit/71e319b088a2d0eb64d30f694408ab98cf35c6de" data-pjax>
          71e319
        </a>
        <time datetime="2015-09-15T07:48:51Z" is="relative-time">Sep 15, 2015</time>
      </span>
      <div>
        <img alt="@juanignaciosl" class="avatar" height="20" src="https://avatars1.githubusercontent.com/u/932968?v=3&amp;s=40" width="20" />
        <a href="/juanignaciosl" class="user-mention" rel="contributor">juanignaciosl</a>
          <a href="/CartoDB/cartodb/commit/71e319b088a2d0eb64d30f694408ab98cf35c6de" class="message" data-pjax="true" title="Merge pull request #5367 from CartoDB/4880-Organization_auth_settings

4880 organization auth settings">Merge pull request</a> <a href="https://github.com/CartoDB/cartodb/pull/5367" class="issue-link" title="4880 organization auth settings">#5367</a> <a href="/CartoDB/cartodb/commit/71e319b088a2d0eb64d30f694408ab98cf35c6de" class="message" data-pjax="true" title="Merge pull request #5367 from CartoDB/4880-Organization_auth_settings

4880 organization auth settings">from CartoDB/4880-Organization_auth_settings</a>
      </div>

    <div class="commit-tease-contributors">
      <a class="muted-link contributors-toggle" href="#blob_contributors_box" rel="facebox">
        <strong>9</strong>
         contributors
      </a>
          <a class="avatar-link tooltipped tooltipped-s" aria-label="ferblape" href="/CartoDB/cartodb/commits/master/config/initializers/warden.rb?author=ferblape"><img alt="@ferblape" class="avatar" height="20" src="https://avatars3.githubusercontent.com/u/17616?v=3&amp;s=40" width="20" /> </a>
    <a class="avatar-link tooltipped tooltipped-s" aria-label="juanignaciosl" href="/CartoDB/cartodb/commits/master/config/initializers/warden.rb?author=juanignaciosl"><img alt="@juanignaciosl" class="avatar" height="20" src="https://avatars1.githubusercontent.com/u/932968?v=3&amp;s=40" width="20" /> </a>
    <a class="avatar-link tooltipped tooltipped-s" aria-label="Ferdev" href="/CartoDB/cartodb/commits/master/config/initializers/warden.rb?author=Ferdev"><img alt="@Ferdev" class="avatar" height="20" src="https://avatars3.githubusercontent.com/u/130142?v=3&amp;s=40" width="20" /> </a>
    <a class="avatar-link tooltipped tooltipped-s" aria-label="alvarobp" href="/CartoDB/cartodb/commits/master/config/initializers/warden.rb?author=alvarobp"><img alt="@alvarobp" class="avatar" height="20" src="https://avatars0.githubusercontent.com/u/33331?v=3&amp;s=40" width="20" /> </a>
    <a class="avatar-link tooltipped tooltipped-s" aria-label="demimismo" href="/CartoDB/cartodb/commits/master/config/initializers/warden.rb?author=demimismo"><img alt="@demimismo" class="avatar" height="20" src="https://avatars0.githubusercontent.com/u/12316?v=3&amp;s=40" width="20" /> </a>
    <a class="avatar-link tooltipped tooltipped-s" aria-label="tokumine" href="/CartoDB/cartodb/commits/master/config/initializers/warden.rb?author=tokumine"><img alt="@tokumine" class="avatar" height="20" src="https://avatars0.githubusercontent.com/u/7192?v=3&amp;s=40" width="20" /> </a>
    <a class="avatar-link tooltipped tooltipped-s" aria-label="Kartones" href="/CartoDB/cartodb/commits/master/config/initializers/warden.rb?author=Kartones"><img alt="@Kartones" class="avatar" height="20" src="https://avatars2.githubusercontent.com/u/2085449?v=3&amp;s=40" width="20" /> </a>
    <a class="avatar-link tooltipped tooltipped-s" aria-label="rafatower" href="/CartoDB/cartodb/commits/master/config/initializers/warden.rb?author=rafatower"><img alt="@rafatower" class="avatar" height="20" src="https://avatars2.githubusercontent.com/u/1914276?v=3&amp;s=40" width="20" /> </a>
    <a class="avatar-link tooltipped tooltipped-s" aria-label="zenitraM" href="/CartoDB/cartodb/commits/master/config/initializers/warden.rb?author=zenitraM"><img alt="@zenitraM" class="avatar" height="20" src="https://avatars1.githubusercontent.com/u/863975?v=3&amp;s=40" width="20" /> </a>


    </div>

    <div id="blob_contributors_box" style="display:none">
      <h2 class="facebox-header" data-facebox-id="facebox-header">Users who have contributed to this file</h2>
      <ul class="facebox-user-list" data-facebox-id="facebox-description">
          <li class="facebox-user-list-item">
            <img alt="@ferblape" height="24" src="https://avatars1.githubusercontent.com/u/17616?v=3&amp;s=48" width="24" />
            <a href="/ferblape">ferblape</a>
          </li>
          <li class="facebox-user-list-item">
            <img alt="@juanignaciosl" height="24" src="https://avatars3.githubusercontent.com/u/932968?v=3&amp;s=48" width="24" />
            <a href="/juanignaciosl">juanignaciosl</a>
          </li>
          <li class="facebox-user-list-item">
            <img alt="@Ferdev" height="24" src="https://avatars1.githubusercontent.com/u/130142?v=3&amp;s=48" width="24" />
            <a href="/Ferdev">Ferdev</a>
          </li>
          <li class="facebox-user-list-item">
            <img alt="@alvarobp" height="24" src="https://avatars2.githubusercontent.com/u/33331?v=3&amp;s=48" width="24" />
            <a href="/alvarobp">alvarobp</a>
          </li>
          <li class="facebox-user-list-item">
            <img alt="@demimismo" height="24" src="https://avatars2.githubusercontent.com/u/12316?v=3&amp;s=48" width="24" />
            <a href="/demimismo">demimismo</a>
          </li>
          <li class="facebox-user-list-item">
            <img alt="@tokumine" height="24" src="https://avatars2.githubusercontent.com/u/7192?v=3&amp;s=48" width="24" />
            <a href="/tokumine">tokumine</a>
          </li>
          <li class="facebox-user-list-item">
            <img alt="@Kartones" height="24" src="https://avatars0.githubusercontent.com/u/2085449?v=3&amp;s=48" width="24" />
            <a href="/Kartones">Kartones</a>
          </li>
          <li class="facebox-user-list-item">
            <img alt="@rafatower" height="24" src="https://avatars0.githubusercontent.com/u/1914276?v=3&amp;s=48" width="24" />
            <a href="/rafatower">rafatower</a>
          </li>
          <li class="facebox-user-list-item">
            <img alt="@zenitraM" height="24" src="https://avatars3.githubusercontent.com/u/863975?v=3&amp;s=48" width="24" />
            <a href="/zenitraM">zenitraM</a>
          </li>
      </ul>
    </div>
  </div>

<div class="file">
  <div class="file-header">
  <div class="file-actions">

    <div class="btn-group">
      <a href="/CartoDB/cartodb/raw/master/config/initializers/warden.rb" class="btn btn-sm " id="raw-url">Raw</a>
        <a href="/CartoDB/cartodb/blame/master/config/initializers/warden.rb" class="btn btn-sm js-update-url-with-hash">Blame</a>
      <a href="/CartoDB/cartodb/commits/master/config/initializers/warden.rb" class="btn btn-sm " rel="nofollow">History</a>
    </div>


        <button type="button" class="octicon-btn disabled tooltipped tooltipped-nw"
          aria-label="You must be signed in to make or propose changes">
          <span class="octicon octicon-pencil"></span>
        </button>
        <button type="button" class="octicon-btn octicon-btn-danger disabled tooltipped tooltipped-nw"
          aria-label="You must be signed in to make or propose changes">
          <span class="octicon octicon-trashcan"></span>
        </button>
  </div>

  <div class="file-info">
      196 lines (173 sloc)
      <span class="file-info-divider"></span>
    5.66 KB
  </div>
</div>

  

  <div class="blob-wrapper data type-ruby">
      <table class="highlight tab-size js-file-line-container" data-tab-size="8">
      <tr>
        <td id="L1" class="blob-num js-line-number" data-line-number="1"></td>
        <td id="LC1" class="blob-code blob-code-inner js-file-line"><span class="pl-c1">Rails</span>.configuration.middleware.use <span class="pl-c1">RailsWarden</span>::<span class="pl-c1">Manager</span> <span class="pl-k">do </span>|<span class="pl-smi">manager</span>|</td>
      </tr>
      <tr>
        <td id="L2" class="blob-num js-line-number" data-line-number="2"></td>
        <td id="LC2" class="blob-code blob-code-inner js-file-line">  manager.default_strategies <span class="pl-c1">:password</span>, <span class="pl-c1">:api_authentication</span></td>
      </tr>
      <tr>
        <td id="L3" class="blob-num js-line-number" data-line-number="3"></td>
        <td id="LC3" class="blob-code blob-code-inner js-file-line">  manager.failure_app <span class="pl-k">=</span> <span class="pl-c1">SessionsController</span></td>
      </tr>
      <tr>
        <td id="L4" class="blob-num js-line-number" data-line-number="4"></td>
        <td id="LC4" class="blob-code blob-code-inner js-file-line"><span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L5" class="blob-num js-line-number" data-line-number="5"></td>
        <td id="LC5" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L6" class="blob-num js-line-number" data-line-number="6"></td>
        <td id="LC6" class="blob-code blob-code-inner js-file-line"><span class="pl-c"># Setup Session Serialization</span></td>
      </tr>
      <tr>
        <td id="L7" class="blob-num js-line-number" data-line-number="7"></td>
        <td id="LC7" class="blob-code blob-code-inner js-file-line"><span class="pl-k">class</span> <span class="pl-en">Warden::SessionSerializer</span></td>
      </tr>
      <tr>
        <td id="L8" class="blob-num js-line-number" data-line-number="8"></td>
        <td id="LC8" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">def</span> <span class="pl-en">serialize</span>(<span class="pl-smi">user</span>)</td>
      </tr>
      <tr>
        <td id="L9" class="blob-num js-line-number" data-line-number="9"></td>
        <td id="LC9" class="blob-code blob-code-inner js-file-line">    user.username</td>
      </tr>
      <tr>
        <td id="L10" class="blob-num js-line-number" data-line-number="10"></td>
        <td id="LC10" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L11" class="blob-num js-line-number" data-line-number="11"></td>
        <td id="LC11" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L12" class="blob-num js-line-number" data-line-number="12"></td>
        <td id="LC12" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">def</span> <span class="pl-en">deserialize</span>(<span class="pl-smi">username</span>)</td>
      </tr>
      <tr>
        <td id="L13" class="blob-num js-line-number" data-line-number="13"></td>
        <td id="LC13" class="blob-code blob-code-inner js-file-line">    <span class="pl-c1">User</span>.filter(<span class="pl-c1">username:</span> username).first</td>
      </tr>
      <tr>
        <td id="L14" class="blob-num js-line-number" data-line-number="14"></td>
        <td id="LC14" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L15" class="blob-num js-line-number" data-line-number="15"></td>
        <td id="LC15" class="blob-code blob-code-inner js-file-line"><span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L16" class="blob-num js-line-number" data-line-number="16"></td>
        <td id="LC16" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L17" class="blob-num js-line-number" data-line-number="17"></td>
        <td id="LC17" class="blob-code blob-code-inner js-file-line"><span class="pl-c1">Warden</span>::<span class="pl-c1">Strategies</span>.add(<span class="pl-c1">:password</span>) <span class="pl-k">do</span></td>
      </tr>
      <tr>
        <td id="L18" class="blob-num js-line-number" data-line-number="18"></td>
        <td id="LC18" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">def</span> <span class="pl-en">valid_password_strategy_for_user</span>(<span class="pl-smi">user</span>)</td>
      </tr>
      <tr>
        <td id="L19" class="blob-num js-line-number" data-line-number="19"></td>
        <td id="LC19" class="blob-code blob-code-inner js-file-line">    user.organization.nil? <span class="pl-k">||</span> user.organization.auth_username_password_enabled</td>
      </tr>
      <tr>
        <td id="L20" class="blob-num js-line-number" data-line-number="20"></td>
        <td id="LC20" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L21" class="blob-num js-line-number" data-line-number="21"></td>
        <td id="LC21" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L22" class="blob-num js-line-number" data-line-number="22"></td>
        <td id="LC22" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">def</span> <span class="pl-en">authenticate!</span></td>
      </tr>
      <tr>
        <td id="L23" class="blob-num js-line-number" data-line-number="23"></td>
        <td id="LC23" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">if</span> params[<span class="pl-c1">:email</span>] <span class="pl-k">&amp;&amp;</span> params[<span class="pl-c1">:password</span>]</td>
      </tr>
      <tr>
        <td id="L24" class="blob-num js-line-number" data-line-number="24"></td>
        <td id="LC24" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">if</span> (user <span class="pl-k">=</span> <span class="pl-c1">User</span>.authenticate(params[<span class="pl-c1">:email</span>], params[<span class="pl-c1">:password</span>]))</td>
      </tr>
      <tr>
        <td id="L25" class="blob-num js-line-number" data-line-number="25"></td>
        <td id="LC25" class="blob-code blob-code-inner js-file-line">        <span class="pl-k">if</span> user.enabled? <span class="pl-k">&amp;&amp;</span> valid_password_strategy_for_user(user)</td>
      </tr>
      <tr>
        <td id="L26" class="blob-num js-line-number" data-line-number="26"></td>
        <td id="LC26" class="blob-code blob-code-inner js-file-line">          success!(user, <span class="pl-c1">:message</span> =&gt; <span class="pl-s"><span class="pl-pds">&quot;</span>Success<span class="pl-pds">&quot;</span></span>)</td>
      </tr>
      <tr>
        <td id="L27" class="blob-num js-line-number" data-line-number="27"></td>
        <td id="LC27" class="blob-code blob-code-inner js-file-line">          request.flash[<span class="pl-s"><span class="pl-pds">&#39;</span>logged<span class="pl-pds">&#39;</span></span>] <span class="pl-k">=</span> <span class="pl-c1">true</span></td>
      </tr>
      <tr>
        <td id="L28" class="blob-num js-line-number" data-line-number="28"></td>
        <td id="LC28" class="blob-code blob-code-inner js-file-line">        <span class="pl-k">elsif</span> <span class="pl-k">!</span>user.enable_account_token.nil?</td>
      </tr>
      <tr>
        <td id="L29" class="blob-num js-line-number" data-line-number="29"></td>
        <td id="LC29" class="blob-code blob-code-inner js-file-line">          <span class="pl-k">throw</span>(<span class="pl-c1">:warden</span>, <span class="pl-c1">:action</span> =&gt; <span class="pl-s"><span class="pl-pds">&#39;</span>account_token_authentication_error<span class="pl-pds">&#39;</span></span>, <span class="pl-c1">:user_id</span> =&gt; user.id)</td>
      </tr>
      <tr>
        <td id="L30" class="blob-num js-line-number" data-line-number="30"></td>
        <td id="LC30" class="blob-code blob-code-inner js-file-line">        <span class="pl-k">else</span></td>
      </tr>
      <tr>
        <td id="L31" class="blob-num js-line-number" data-line-number="31"></td>
        <td id="LC31" class="blob-code blob-code-inner js-file-line">          fail!</td>
      </tr>
      <tr>
        <td id="L32" class="blob-num js-line-number" data-line-number="32"></td>
        <td id="LC32" class="blob-code blob-code-inner js-file-line">        <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L33" class="blob-num js-line-number" data-line-number="33"></td>
        <td id="LC33" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">else</span></td>
      </tr>
      <tr>
        <td id="L34" class="blob-num js-line-number" data-line-number="34"></td>
        <td id="LC34" class="blob-code blob-code-inner js-file-line">        fail!</td>
      </tr>
      <tr>
        <td id="L35" class="blob-num js-line-number" data-line-number="35"></td>
        <td id="LC35" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L36" class="blob-num js-line-number" data-line-number="36"></td>
        <td id="LC36" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">else</span></td>
      </tr>
      <tr>
        <td id="L37" class="blob-num js-line-number" data-line-number="37"></td>
        <td id="LC37" class="blob-code blob-code-inner js-file-line">      fail!</td>
      </tr>
      <tr>
        <td id="L38" class="blob-num js-line-number" data-line-number="38"></td>
        <td id="LC38" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L39" class="blob-num js-line-number" data-line-number="39"></td>
        <td id="LC39" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L40" class="blob-num js-line-number" data-line-number="40"></td>
        <td id="LC40" class="blob-code blob-code-inner js-file-line"><span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L41" class="blob-num js-line-number" data-line-number="41"></td>
        <td id="LC41" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L42" class="blob-num js-line-number" data-line-number="42"></td>
        <td id="LC42" class="blob-code blob-code-inner js-file-line"><span class="pl-c1">Warden</span>::<span class="pl-c1">Strategies</span>.add(<span class="pl-c1">:enable_account_token</span>) <span class="pl-k">do</span></td>
      </tr>
      <tr>
        <td id="L43" class="blob-num js-line-number" data-line-number="43"></td>
        <td id="LC43" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">def</span> <span class="pl-en">authenticate!</span></td>
      </tr>
      <tr>
        <td id="L44" class="blob-num js-line-number" data-line-number="44"></td>
        <td id="LC44" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">if</span> params[<span class="pl-c1">:id</span>]</td>
      </tr>
      <tr>
        <td id="L45" class="blob-num js-line-number" data-line-number="45"></td>
        <td id="LC45" class="blob-code blob-code-inner js-file-line">      user <span class="pl-k">=</span> <span class="pl-c1">User</span>.where(<span class="pl-c1">enable_account_token:</span> params[<span class="pl-c1">:id</span>]).first</td>
      </tr>
      <tr>
        <td id="L46" class="blob-num js-line-number" data-line-number="46"></td>
        <td id="LC46" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">if</span> user</td>
      </tr>
      <tr>
        <td id="L47" class="blob-num js-line-number" data-line-number="47"></td>
        <td id="LC47" class="blob-code blob-code-inner js-file-line">        user.enable_account_token <span class="pl-k">=</span> <span class="pl-c1">nil</span></td>
      </tr>
      <tr>
        <td id="L48" class="blob-num js-line-number" data-line-number="48"></td>
        <td id="LC48" class="blob-code blob-code-inner js-file-line">        user.save</td>
      </tr>
      <tr>
        <td id="L49" class="blob-num js-line-number" data-line-number="49"></td>
        <td id="LC49" class="blob-code blob-code-inner js-file-line">        success!(user)</td>
      </tr>
      <tr>
        <td id="L50" class="blob-num js-line-number" data-line-number="50"></td>
        <td id="LC50" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">else</span></td>
      </tr>
      <tr>
        <td id="L51" class="blob-num js-line-number" data-line-number="51"></td>
        <td id="LC51" class="blob-code blob-code-inner js-file-line">        fail!</td>
      </tr>
      <tr>
        <td id="L52" class="blob-num js-line-number" data-line-number="52"></td>
        <td id="LC52" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L53" class="blob-num js-line-number" data-line-number="53"></td>
        <td id="LC53" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">else</span></td>
      </tr>
      <tr>
        <td id="L54" class="blob-num js-line-number" data-line-number="54"></td>
        <td id="LC54" class="blob-code blob-code-inner js-file-line">      fail!</td>
      </tr>
      <tr>
        <td id="L55" class="blob-num js-line-number" data-line-number="55"></td>
        <td id="LC55" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L56" class="blob-num js-line-number" data-line-number="56"></td>
        <td id="LC56" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L57" class="blob-num js-line-number" data-line-number="57"></td>
        <td id="LC57" class="blob-code blob-code-inner js-file-line"><span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L58" class="blob-num js-line-number" data-line-number="58"></td>
        <td id="LC58" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L59" class="blob-num js-line-number" data-line-number="59"></td>
        <td id="LC59" class="blob-code blob-code-inner js-file-line"><span class="pl-c1">Warden</span>::<span class="pl-c1">Strategies</span>.add(<span class="pl-c1">:google_access_token</span>) <span class="pl-k">do</span></td>
      </tr>
      <tr>
        <td id="L60" class="blob-num js-line-number" data-line-number="60"></td>
        <td id="LC60" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">def</span> <span class="pl-en">valid_google_access_token_strategy_for_user</span>(<span class="pl-smi">user</span>)</td>
      </tr>
      <tr>
        <td id="L61" class="blob-num js-line-number" data-line-number="61"></td>
        <td id="LC61" class="blob-code blob-code-inner js-file-line">    user.organization.nil? <span class="pl-k">||</span> user.organization.auth_google_enabled</td>
      </tr>
      <tr>
        <td id="L62" class="blob-num js-line-number" data-line-number="62"></td>
        <td id="LC62" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L63" class="blob-num js-line-number" data-line-number="63"></td>
        <td id="LC63" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L64" class="blob-num js-line-number" data-line-number="64"></td>
        <td id="LC64" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">def</span> <span class="pl-en">authenticate!</span></td>
      </tr>
      <tr>
        <td id="L65" class="blob-num js-line-number" data-line-number="65"></td>
        <td id="LC65" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">if</span> params[<span class="pl-c1">:google_access_token</span>]</td>
      </tr>
      <tr>
        <td id="L66" class="blob-num js-line-number" data-line-number="66"></td>
        <td id="LC66" class="blob-code blob-code-inner js-file-line">      user <span class="pl-k">=</span> <span class="pl-c1">GooglePlusAPI</span>.<span class="pl-k">new</span>.get_user(params[<span class="pl-c1">:google_access_token</span>])</td>
      </tr>
      <tr>
        <td id="L67" class="blob-num js-line-number" data-line-number="67"></td>
        <td id="LC67" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">if</span> user <span class="pl-k">&amp;&amp;</span> valid_google_access_token_strategy_for_user(user)</td>
      </tr>
      <tr>
        <td id="L68" class="blob-num js-line-number" data-line-number="68"></td>
        <td id="LC68" class="blob-code blob-code-inner js-file-line">        <span class="pl-k">if</span> user.enable_account_token.nil?</td>
      </tr>
      <tr>
        <td id="L69" class="blob-num js-line-number" data-line-number="69"></td>
        <td id="LC69" class="blob-code blob-code-inner js-file-line">          success!(user)</td>
      </tr>
      <tr>
        <td id="L70" class="blob-num js-line-number" data-line-number="70"></td>
        <td id="LC70" class="blob-code blob-code-inner js-file-line">        <span class="pl-k">else</span></td>
      </tr>
      <tr>
        <td id="L71" class="blob-num js-line-number" data-line-number="71"></td>
        <td id="LC71" class="blob-code blob-code-inner js-file-line">          <span class="pl-k">throw</span>(<span class="pl-c1">:warden</span>, <span class="pl-c1">:action</span> =&gt; <span class="pl-s"><span class="pl-pds">&#39;</span>account_token_authentication_error<span class="pl-pds">&#39;</span></span>, <span class="pl-c1">:user_id</span> =&gt; user.id)</td>
      </tr>
      <tr>
        <td id="L72" class="blob-num js-line-number" data-line-number="72"></td>
        <td id="LC72" class="blob-code blob-code-inner js-file-line">        <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L73" class="blob-num js-line-number" data-line-number="73"></td>
        <td id="LC73" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">else</span></td>
      </tr>
      <tr>
        <td id="L74" class="blob-num js-line-number" data-line-number="74"></td>
        <td id="LC74" class="blob-code blob-code-inner js-file-line">        fail!</td>
      </tr>
      <tr>
        <td id="L75" class="blob-num js-line-number" data-line-number="75"></td>
        <td id="LC75" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L76" class="blob-num js-line-number" data-line-number="76"></td>
        <td id="LC76" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">else</span></td>
      </tr>
      <tr>
        <td id="L77" class="blob-num js-line-number" data-line-number="77"></td>
        <td id="LC77" class="blob-code blob-code-inner js-file-line">      fail!</td>
      </tr>
      <tr>
        <td id="L78" class="blob-num js-line-number" data-line-number="78"></td>
        <td id="LC78" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L79" class="blob-num js-line-number" data-line-number="79"></td>
        <td id="LC79" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L80" class="blob-num js-line-number" data-line-number="80"></td>
        <td id="LC80" class="blob-code blob-code-inner js-file-line"><span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L81" class="blob-num js-line-number" data-line-number="81"></td>
        <td id="LC81" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L82" class="blob-num js-line-number" data-line-number="82"></td>
        <td id="LC82" class="blob-code blob-code-inner js-file-line"><span class="pl-c1">Warden</span>::<span class="pl-c1">Strategies</span>.add(<span class="pl-c1">:ldap</span>) <span class="pl-k">do</span></td>
      </tr>
      <tr>
        <td id="L83" class="blob-num js-line-number" data-line-number="83"></td>
        <td id="LC83" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">def</span> <span class="pl-en">authenticate!</span></td>
      </tr>
      <tr>
        <td id="L84" class="blob-num js-line-number" data-line-number="84"></td>
        <td id="LC84" class="blob-code blob-code-inner js-file-line">    (fail! <span class="pl-k">and</span> <span class="pl-k">return</span>) <span class="pl-k">unless</span> (params[<span class="pl-c1">:email</span>] <span class="pl-k">&amp;&amp;</span> params[<span class="pl-c1">:password</span>])</td>
      </tr>
      <tr>
        <td id="L85" class="blob-num js-line-number" data-line-number="85"></td>
        <td id="LC85" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L86" class="blob-num js-line-number" data-line-number="86"></td>
        <td id="LC86" class="blob-code blob-code-inner js-file-line">    user <span class="pl-k">=</span> <span class="pl-c1">nil</span></td>
      </tr>
      <tr>
        <td id="L87" class="blob-num js-line-number" data-line-number="87"></td>
        <td id="LC87" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">begin</span></td>
      </tr>
      <tr>
        <td id="L88" class="blob-num js-line-number" data-line-number="88"></td>
        <td id="LC88" class="blob-code blob-code-inner js-file-line">      user <span class="pl-k">=</span> <span class="pl-c1">Carto</span>::<span class="pl-c1">Ldap</span>::<span class="pl-c1">Manager</span>.<span class="pl-k">new</span>.authenticate(params[<span class="pl-c1">:email</span>], params[<span class="pl-c1">:password</span>])</td>
      </tr>
      <tr>
        <td id="L89" class="blob-num js-line-number" data-line-number="89"></td>
        <td id="LC89" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">rescue</span> <span class="pl-c1">Carto</span>::<span class="pl-c1">Ldap</span>::<span class="pl-c1">LDAPUserNotPresentAtCartoDBError</span> =&gt; exception</td>
      </tr>
      <tr>
        <td id="L90" class="blob-num js-line-number" data-line-number="90"></td>
        <td id="LC90" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">throw</span>(<span class="pl-c1">:warden</span>, <span class="pl-c1">action:</span> <span class="pl-s"><span class="pl-pds">&#39;</span>ldap_user_not_at_cartodb<span class="pl-pds">&#39;</span></span>, </td>
      </tr>
      <tr>
        <td id="L91" class="blob-num js-line-number" data-line-number="91"></td>
        <td id="LC91" class="blob-code blob-code-inner js-file-line">        <span class="pl-c1">cartodb_username:</span> exception.cartodb_username, <span class="pl-c1">organization_id:</span> exception.organization_id, </td>
      </tr>
      <tr>
        <td id="L92" class="blob-num js-line-number" data-line-number="92"></td>
        <td id="LC92" class="blob-code blob-code-inner js-file-line">        <span class="pl-c1">ldap_username:</span> exception.ldap_username, <span class="pl-c1">ldap_email:</span> exception.ldap_email)</td>
      </tr>
      <tr>
        <td id="L93" class="blob-num js-line-number" data-line-number="93"></td>
        <td id="LC93" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L94" class="blob-num js-line-number" data-line-number="94"></td>
        <td id="LC94" class="blob-code blob-code-inner js-file-line">    (fail! <span class="pl-k">and</span> <span class="pl-k">return</span>) <span class="pl-k">unless</span> user</td>
      </tr>
      <tr>
        <td id="L95" class="blob-num js-line-number" data-line-number="95"></td>
        <td id="LC95" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L96" class="blob-num js-line-number" data-line-number="96"></td>
        <td id="LC96" class="blob-code blob-code-inner js-file-line">    success!(user, <span class="pl-c1">:message</span> =&gt; <span class="pl-s"><span class="pl-pds">&quot;</span>Success<span class="pl-pds">&quot;</span></span>)</td>
      </tr>
      <tr>
        <td id="L97" class="blob-num js-line-number" data-line-number="97"></td>
        <td id="LC97" class="blob-code blob-code-inner js-file-line">    request.flash[<span class="pl-s"><span class="pl-pds">&#39;</span>logged<span class="pl-pds">&#39;</span></span>] <span class="pl-k">=</span> <span class="pl-c1">true</span></td>
      </tr>
      <tr>
        <td id="L98" class="blob-num js-line-number" data-line-number="98"></td>
        <td id="LC98" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L99" class="blob-num js-line-number" data-line-number="99"></td>
        <td id="LC99" class="blob-code blob-code-inner js-file-line"><span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L100" class="blob-num js-line-number" data-line-number="100"></td>
        <td id="LC100" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L101" class="blob-num js-line-number" data-line-number="101"></td>
        <td id="LC101" class="blob-code blob-code-inner js-file-line"><span class="pl-c1">Warden</span>::<span class="pl-c1">Strategies</span>.add(<span class="pl-c1">:api_authentication</span>) <span class="pl-k">do</span></td>
      </tr>
      <tr>
        <td id="L102" class="blob-num js-line-number" data-line-number="102"></td>
        <td id="LC102" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">def</span> <span class="pl-en">authenticate!</span></td>
      </tr>
      <tr>
        <td id="L103" class="blob-num js-line-number" data-line-number="103"></td>
        <td id="LC103" class="blob-code blob-code-inner js-file-line">    <span class="pl-c"># WARNING: The following code is a modified copy of the oauth10_token method from</span></td>
      </tr>
      <tr>
        <td id="L104" class="blob-num js-line-number" data-line-number="104"></td>
        <td id="LC104" class="blob-code blob-code-inner js-file-line">    <span class="pl-c"># oauth-plugin-0.4.0.pre4/lib/oauth/controllers/application_controller_methods.rb</span></td>
      </tr>
      <tr>
        <td id="L105" class="blob-num js-line-number" data-line-number="105"></td>
        <td id="LC105" class="blob-code blob-code-inner js-file-line">    <span class="pl-c"># It also checks token class like does the oauth10_access_token method of that same file</span></td>
      </tr>
      <tr>
        <td id="L106" class="blob-num js-line-number" data-line-number="106"></td>
        <td id="LC106" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">if</span> <span class="pl-c1">ClientApplication</span>.verify_request(request) <span class="pl-k">do </span>|<span class="pl-smi">request_proxy</span>|</td>
      </tr>
      <tr>
        <td id="L107" class="blob-num js-line-number" data-line-number="107"></td>
        <td id="LC107" class="blob-code blob-code-inner js-file-line">          <span class="pl-smi">@oauth_token</span> <span class="pl-k">=</span> <span class="pl-c1">ClientApplication</span>.find_token(request_proxy.token)</td>
      </tr>
      <tr>
        <td id="L108" class="blob-num js-line-number" data-line-number="108"></td>
        <td id="LC108" class="blob-code blob-code-inner js-file-line">          <span class="pl-k">if</span> <span class="pl-smi">@oauth_token</span>.respond_to?(<span class="pl-c1">:provided_oauth_verifier=</span>)</td>
      </tr>
      <tr>
        <td id="L109" class="blob-num js-line-number" data-line-number="109"></td>
        <td id="LC109" class="blob-code blob-code-inner js-file-line">            <span class="pl-smi">@oauth_token</span>.provided_oauth_verifier<span class="pl-k">=</span>request_proxy.oauth_verifier</td>
      </tr>
      <tr>
        <td id="L110" class="blob-num js-line-number" data-line-number="110"></td>
        <td id="LC110" class="blob-code blob-code-inner js-file-line">          <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L111" class="blob-num js-line-number" data-line-number="111"></td>
        <td id="LC111" class="blob-code blob-code-inner js-file-line">          <span class="pl-c"># return the token secret and the consumer secret</span></td>
      </tr>
      <tr>
        <td id="L112" class="blob-num js-line-number" data-line-number="112"></td>
        <td id="LC112" class="blob-code blob-code-inner js-file-line">          [(<span class="pl-smi">@oauth_token</span>.nil? <span class="pl-k">?</span> <span class="pl-c1">nil</span> : <span class="pl-smi">@oauth_token</span>.secret), (<span class="pl-smi">@oauth_token</span>.nil? <span class="pl-k">||</span> <span class="pl-smi">@oauth_token</span>.client_application.nil? <span class="pl-k">?</span> <span class="pl-c1">nil</span> : <span class="pl-smi">@oauth_token</span>.client_application.secret)]</td>
      </tr>
      <tr>
        <td id="L113" class="blob-num js-line-number" data-line-number="113"></td>
        <td id="LC113" class="blob-code blob-code-inner js-file-line">        <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L114" class="blob-num js-line-number" data-line-number="114"></td>
        <td id="LC114" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L115" class="blob-num js-line-number" data-line-number="115"></td>
        <td id="LC115" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">if</span> <span class="pl-smi">@oauth_token</span> <span class="pl-k">&amp;&amp;</span> <span class="pl-smi">@oauth_token</span>.is_a?(::<span class="pl-c1">AccessToken</span>)</td>
      </tr>
      <tr>
        <td id="L116" class="blob-num js-line-number" data-line-number="116"></td>
        <td id="LC116" class="blob-code blob-code-inner js-file-line">        user <span class="pl-k">=</span> <span class="pl-c1">User</span>.find_with_custom_fields(<span class="pl-smi">@oauth_token</span>.user_id)</td>
      </tr>
      <tr>
        <td id="L117" class="blob-num js-line-number" data-line-number="117"></td>
        <td id="LC117" class="blob-code blob-code-inner js-file-line">        <span class="pl-k">if</span> user.enable_account_token.nil?</td>
      </tr>
      <tr>
        <td id="L118" class="blob-num js-line-number" data-line-number="118"></td>
        <td id="LC118" class="blob-code blob-code-inner js-file-line">          success!(user) <span class="pl-k">and</span> <span class="pl-k">return</span></td>
      </tr>
      <tr>
        <td id="L119" class="blob-num js-line-number" data-line-number="119"></td>
        <td id="LC119" class="blob-code blob-code-inner js-file-line">        <span class="pl-k">else</span></td>
      </tr>
      <tr>
        <td id="L120" class="blob-num js-line-number" data-line-number="120"></td>
        <td id="LC120" class="blob-code blob-code-inner js-file-line">          <span class="pl-k">throw</span>(<span class="pl-c1">:warden</span>, <span class="pl-c1">:action</span> =&gt; <span class="pl-s"><span class="pl-pds">&#39;</span>account_token_authentication_error<span class="pl-pds">&#39;</span></span>, <span class="pl-c1">:user_id</span> =&gt; user.id)</td>
      </tr>
      <tr>
        <td id="L121" class="blob-num js-line-number" data-line-number="121"></td>
        <td id="LC121" class="blob-code blob-code-inner js-file-line">        <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L122" class="blob-num js-line-number" data-line-number="122"></td>
        <td id="LC122" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L123" class="blob-num js-line-number" data-line-number="123"></td>
        <td id="LC123" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L124" class="blob-num js-line-number" data-line-number="124"></td>
        <td id="LC124" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">throw</span>(<span class="pl-c1">:warden</span>)</td>
      </tr>
      <tr>
        <td id="L125" class="blob-num js-line-number" data-line-number="125"></td>
        <td id="LC125" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L126" class="blob-num js-line-number" data-line-number="126"></td>
        <td id="LC126" class="blob-code blob-code-inner js-file-line"><span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L127" class="blob-num js-line-number" data-line-number="127"></td>
        <td id="LC127" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L128" class="blob-num js-line-number" data-line-number="128"></td>
        <td id="LC128" class="blob-code blob-code-inner js-file-line"><span class="pl-c1">Warden</span>::<span class="pl-c1">Strategies</span>.add(<span class="pl-c1">:api_key</span>) <span class="pl-k">do</span></td>
      </tr>
      <tr>
        <td id="L129" class="blob-num js-line-number" data-line-number="129"></td>
        <td id="LC129" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">def</span> <span class="pl-en">valid?</span></td>
      </tr>
      <tr>
        <td id="L130" class="blob-num js-line-number" data-line-number="130"></td>
        <td id="LC130" class="blob-code blob-code-inner js-file-line">    params[<span class="pl-c1">:api_key</span>].present?</td>
      </tr>
      <tr>
        <td id="L131" class="blob-num js-line-number" data-line-number="131"></td>
        <td id="LC131" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L132" class="blob-num js-line-number" data-line-number="132"></td>
        <td id="LC132" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L133" class="blob-num js-line-number" data-line-number="133"></td>
        <td id="LC133" class="blob-code blob-code-inner js-file-line">  <span class="pl-c"># We don&#39;t want to store a session and send a response cookie</span></td>
      </tr>
      <tr>
        <td id="L134" class="blob-num js-line-number" data-line-number="134"></td>
        <td id="LC134" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">def</span> <span class="pl-en">store?</span></td>
      </tr>
      <tr>
        <td id="L135" class="blob-num js-line-number" data-line-number="135"></td>
        <td id="LC135" class="blob-code blob-code-inner js-file-line">    <span class="pl-c1">false</span></td>
      </tr>
      <tr>
        <td id="L136" class="blob-num js-line-number" data-line-number="136"></td>
        <td id="LC136" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L137" class="blob-num js-line-number" data-line-number="137"></td>
        <td id="LC137" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L138" class="blob-num js-line-number" data-line-number="138"></td>
        <td id="LC138" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">def</span> <span class="pl-en">authenticate!</span></td>
      </tr>
      <tr>
        <td id="L139" class="blob-num js-line-number" data-line-number="139"></td>
        <td id="LC139" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">begin</span></td>
      </tr>
      <tr>
        <td id="L140" class="blob-num js-line-number" data-line-number="140"></td>
        <td id="LC140" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">if</span> (api_key <span class="pl-k">=</span> params[<span class="pl-c1">:api_key</span>]) <span class="pl-k">&amp;&amp;</span> api_key.present?</td>
      </tr>
      <tr>
        <td id="L141" class="blob-num js-line-number" data-line-number="141"></td>
        <td id="LC141" class="blob-code blob-code-inner js-file-line">        user_name <span class="pl-k">=</span> <span class="pl-c1">CartoDB</span>.extract_subdomain(request)</td>
      </tr>
      <tr>
        <td id="L142" class="blob-num js-line-number" data-line-number="142"></td>
        <td id="LC142" class="blob-code blob-code-inner js-file-line">        <span class="pl-k">if</span> <span class="pl-smi">$users_metadata</span>.<span class="pl-c1">HMGET</span>(<span class="pl-s"><span class="pl-pds">&quot;</span>rails:users:<span class="pl-pse">#{</span><span class="pl-s1">user_name</span><span class="pl-pse"><span class="pl-s1">}</span></span><span class="pl-pds">&quot;</span></span>, <span class="pl-s"><span class="pl-pds">&quot;</span>map_key<span class="pl-pds">&quot;</span></span>).first <span class="pl-k">==</span> api_key</td>
      </tr>
      <tr>
        <td id="L143" class="blob-num js-line-number" data-line-number="143"></td>
        <td id="LC143" class="blob-code blob-code-inner js-file-line">          user_id <span class="pl-k">=</span> <span class="pl-smi">$users_metadata</span>.<span class="pl-c1">HGET</span> <span class="pl-s"><span class="pl-pds">&quot;</span>rails:users:<span class="pl-pse">#{</span><span class="pl-s1">user_name</span><span class="pl-pse"><span class="pl-s1">}</span></span><span class="pl-pds">&quot;</span></span>, <span class="pl-s"><span class="pl-pds">&#39;</span>id<span class="pl-pds">&#39;</span></span></td>
      </tr>
      <tr>
        <td id="L144" class="blob-num js-line-number" data-line-number="144"></td>
        <td id="LC144" class="blob-code blob-code-inner js-file-line">          <span class="pl-k">return</span> fail! <span class="pl-k">if</span> user_id.blank?</td>
      </tr>
      <tr>
        <td id="L145" class="blob-num js-line-number" data-line-number="145"></td>
        <td id="LC145" class="blob-code blob-code-inner js-file-line">          user    <span class="pl-k">=</span> <span class="pl-c1">User</span>[user_id]</td>
      </tr>
      <tr>
        <td id="L146" class="blob-num js-line-number" data-line-number="146"></td>
        <td id="LC146" class="blob-code blob-code-inner js-file-line">          success!(user)</td>
      </tr>
      <tr>
        <td id="L147" class="blob-num js-line-number" data-line-number="147"></td>
        <td id="LC147" class="blob-code blob-code-inner js-file-line">        <span class="pl-k">else</span></td>
      </tr>
      <tr>
        <td id="L148" class="blob-num js-line-number" data-line-number="148"></td>
        <td id="LC148" class="blob-code blob-code-inner js-file-line">          <span class="pl-k">return</span> fail!</td>
      </tr>
      <tr>
        <td id="L149" class="blob-num js-line-number" data-line-number="149"></td>
        <td id="LC149" class="blob-code blob-code-inner js-file-line">        <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L150" class="blob-num js-line-number" data-line-number="150"></td>
        <td id="LC150" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">else</span></td>
      </tr>
      <tr>
        <td id="L151" class="blob-num js-line-number" data-line-number="151"></td>
        <td id="LC151" class="blob-code blob-code-inner js-file-line">        <span class="pl-k">return</span> fail!</td>
      </tr>
      <tr>
        <td id="L152" class="blob-num js-line-number" data-line-number="152"></td>
        <td id="LC152" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L153" class="blob-num js-line-number" data-line-number="153"></td>
        <td id="LC153" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">rescue</span></td>
      </tr>
      <tr>
        <td id="L154" class="blob-num js-line-number" data-line-number="154"></td>
        <td id="LC154" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">return</span> fail!</td>
      </tr>
      <tr>
        <td id="L155" class="blob-num js-line-number" data-line-number="155"></td>
        <td id="LC155" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L156" class="blob-num js-line-number" data-line-number="156"></td>
        <td id="LC156" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L157" class="blob-num js-line-number" data-line-number="157"></td>
        <td id="LC157" class="blob-code blob-code-inner js-file-line"><span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L158" class="blob-num js-line-number" data-line-number="158"></td>
        <td id="LC158" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L159" class="blob-num js-line-number" data-line-number="159"></td>
        <td id="LC159" class="blob-code blob-code-inner js-file-line"><span class="pl-c"># @see ApplicationController.update_session_security_token</span></td>
      </tr>
      <tr>
        <td id="L160" class="blob-num js-line-number" data-line-number="160"></td>
        <td id="LC160" class="blob-code blob-code-inner js-file-line"><span class="pl-c1">Warden</span>::<span class="pl-c1">Manager</span>.after_set_user <span class="pl-c1">except:</span> <span class="pl-c1">:fetch</span> <span class="pl-k">do </span>|<span class="pl-smi">user</span>, <span class="pl-smi">auth</span>, <span class="pl-smi">opts</span>|</td>
      </tr>
      <tr>
        <td id="L161" class="blob-num js-line-number" data-line-number="161"></td>
        <td id="LC161" class="blob-code blob-code-inner js-file-line">  auth.session(opts[<span class="pl-c1">:scope</span>])[<span class="pl-c1">:sec_token</span>] <span class="pl-k">=</span> <span class="pl-c1">Digest</span>::<span class="pl-c1">SHA1</span>.hexdigest(user.crypted_password)</td>
      </tr>
      <tr>
        <td id="L162" class="blob-num js-line-number" data-line-number="162"></td>
        <td id="LC162" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L163" class="blob-num js-line-number" data-line-number="163"></td>
        <td id="LC163" class="blob-code blob-code-inner js-file-line">  <span class="pl-c"># Only at the editor, and only after new authentications, destroy other sessions</span></td>
      </tr>
      <tr>
        <td id="L164" class="blob-num js-line-number" data-line-number="164"></td>
        <td id="LC164" class="blob-code blob-code-inner js-file-line">  <span class="pl-c"># @see #4656</span></td>
      </tr>
      <tr>
        <td id="L165" class="blob-num js-line-number" data-line-number="165"></td>
        <td id="LC165" class="blob-code blob-code-inner js-file-line">  warden_proxy <span class="pl-k">=</span> auth.env[<span class="pl-s"><span class="pl-pds">&#39;</span>warden<span class="pl-pds">&#39;</span></span>]</td>
      </tr>
      <tr>
        <td id="L166" class="blob-num js-line-number" data-line-number="166"></td>
        <td id="LC166" class="blob-code blob-code-inner js-file-line">  <span class="pl-c"># On testing there is no warden global so we cannot run this logic</span></td>
      </tr>
      <tr>
        <td id="L167" class="blob-num js-line-number" data-line-number="167"></td>
        <td id="LC167" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">if</span> warden_proxy</td>
      </tr>
      <tr>
        <td id="L168" class="blob-num js-line-number" data-line-number="168"></td>
        <td id="LC168" class="blob-code blob-code-inner js-file-line">    auth.env[<span class="pl-s"><span class="pl-pds">&#39;</span>rack.session<span class="pl-pds">&#39;</span></span>].select { |<span class="pl-smi">key</span>, <span class="pl-smi">value</span>|</td>
      </tr>
      <tr>
        <td id="L169" class="blob-num js-line-number" data-line-number="169"></td>
        <td id="LC169" class="blob-code blob-code-inner js-file-line">      key.start_with?(<span class="pl-s"><span class="pl-pds">&quot;</span>warden.user<span class="pl-pds">&quot;</span></span>) <span class="pl-k">&amp;&amp;</span> <span class="pl-k">!</span>key.end_with?(<span class="pl-s"><span class="pl-pds">&quot;</span>.session<span class="pl-pds">&quot;</span></span>)</td>
      </tr>
      <tr>
        <td id="L170" class="blob-num js-line-number" data-line-number="170"></td>
        <td id="LC170" class="blob-code blob-code-inner js-file-line">    }.each { |<span class="pl-smi">key</span>, <span class="pl-smi">value</span>|</td>
      </tr>
      <tr>
        <td id="L171" class="blob-num js-line-number" data-line-number="171"></td>
        <td id="LC171" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">unless</span> value <span class="pl-k">==</span> user.username</td>
      </tr>
      <tr>
        <td id="L172" class="blob-num js-line-number" data-line-number="172"></td>
        <td id="LC172" class="blob-code blob-code-inner js-file-line">        warden_proxy.logout(value) <span class="pl-k">if</span> warden_proxy.authenticated?(value)</td>
      </tr>
      <tr>
        <td id="L173" class="blob-num js-line-number" data-line-number="173"></td>
        <td id="LC173" class="blob-code blob-code-inner js-file-line">      <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L174" class="blob-num js-line-number" data-line-number="174"></td>
        <td id="LC174" class="blob-code blob-code-inner js-file-line">    }</td>
      </tr>
      <tr>
        <td id="L175" class="blob-num js-line-number" data-line-number="175"></td>
        <td id="LC175" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L176" class="blob-num js-line-number" data-line-number="176"></td>
        <td id="LC176" class="blob-code blob-code-inner js-file-line"><span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L177" class="blob-num js-line-number" data-line-number="177"></td>
        <td id="LC177" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L178" class="blob-num js-line-number" data-line-number="178"></td>
        <td id="LC178" class="blob-code blob-code-inner js-file-line"><span class="pl-c1">Warden</span>::<span class="pl-c1">Strategies</span>.add(<span class="pl-c1">:user_creation</span>) <span class="pl-k">do</span></td>
      </tr>
      <tr>
        <td id="L179" class="blob-num js-line-number" data-line-number="179"></td>
        <td id="LC179" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L180" class="blob-num js-line-number" data-line-number="180"></td>
        <td id="LC180" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">def</span> <span class="pl-en">authenticate!</span></td>
      </tr>
      <tr>
        <td id="L181" class="blob-num js-line-number" data-line-number="181"></td>
        <td id="LC181" class="blob-code blob-code-inner js-file-line">    username <span class="pl-k">=</span> params[<span class="pl-c1">:username</span>]</td>
      </tr>
      <tr>
        <td id="L182" class="blob-num js-line-number" data-line-number="182"></td>
        <td id="LC182" class="blob-code blob-code-inner js-file-line">    user <span class="pl-k">=</span> <span class="pl-c1">User</span>.where(<span class="pl-c1">username:</span> username).first</td>
      </tr>
      <tr>
        <td id="L183" class="blob-num js-line-number" data-line-number="183"></td>
        <td id="LC183" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">return</span> fail! <span class="pl-k">unless</span> user</td>
      </tr>
      <tr>
        <td id="L184" class="blob-num js-line-number" data-line-number="184"></td>
        <td id="LC184" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L185" class="blob-num js-line-number" data-line-number="185"></td>
        <td id="LC185" class="blob-code blob-code-inner js-file-line">    user_creation <span class="pl-k">=</span> <span class="pl-c1">Carto</span>::<span class="pl-c1">UserCreation</span>.where(<span class="pl-c1">user_id:</span> user.id).first</td>
      </tr>
      <tr>
        <td id="L186" class="blob-num js-line-number" data-line-number="186"></td>
        <td id="LC186" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">return</span> fail! <span class="pl-k">unless</span> user_creation</td>
      </tr>
      <tr>
        <td id="L187" class="blob-num js-line-number" data-line-number="187"></td>
        <td id="LC187" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L188" class="blob-num js-line-number" data-line-number="188"></td>
        <td id="LC188" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">if</span> user_creation.autologin?</td>
      </tr>
      <tr>
        <td id="L189" class="blob-num js-line-number" data-line-number="189"></td>
        <td id="LC189" class="blob-code blob-code-inner js-file-line">      success!(user, <span class="pl-c1">:message</span> =&gt; <span class="pl-s"><span class="pl-pds">&quot;</span>Success<span class="pl-pds">&quot;</span></span>)</td>
      </tr>
      <tr>
        <td id="L190" class="blob-num js-line-number" data-line-number="190"></td>
        <td id="LC190" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">else</span></td>
      </tr>
      <tr>
        <td id="L191" class="blob-num js-line-number" data-line-number="191"></td>
        <td id="LC191" class="blob-code blob-code-inner js-file-line">      fail!</td>
      </tr>
      <tr>
        <td id="L192" class="blob-num js-line-number" data-line-number="192"></td>
        <td id="LC192" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L193" class="blob-num js-line-number" data-line-number="193"></td>
        <td id="LC193" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">end</span></td>
      </tr>
      <tr>
        <td id="L194" class="blob-num js-line-number" data-line-number="194"></td>
        <td id="LC194" class="blob-code blob-code-inner js-file-line">
</td>
      </tr>
      <tr>
        <td id="L195" class="blob-num js-line-number" data-line-number="195"></td>
        <td id="LC195" class="blob-code blob-code-inner js-file-line"><span class="pl-k">end</span></td>
      </tr>
</table>

  </div>

</div>

<a href="#jump-to-line" rel="facebox[.linejump]" data-hotkey="l" style="display:none">Jump to Line</a>
<div id="jump-to-line" style="display:none">
  <!-- </textarea> --><!-- '"` --><form accept-charset="UTF-8" action="" class="js-jump-to-line-form" method="get"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="&#x2713;" /></div>
    <input class="linejump-input js-jump-to-line-field" type="text" placeholder="Jump to line&hellip;" aria-label="Jump to line" autofocus>
    <button type="submit" class="btn">Go</button>
</form></div>

        </div>
      </div>
      <div class="modal-backdrop"></div>
    </div>
  </div>


    </div>

      <div class="container">
  <div class="site-footer" role="contentinfo">
    <ul class="site-footer-links right">
        <li><a href="https://status.github.com/" data-ga-click="Footer, go to status, text:status">Status</a></li>
      <li><a href="https://developer.github.com" data-ga-click="Footer, go to api, text:api">API</a></li>
      <li><a href="https://training.github.com" data-ga-click="Footer, go to training, text:training">Training</a></li>
      <li><a href="https://shop.github.com" data-ga-click="Footer, go to shop, text:shop">Shop</a></li>
        <li><a href="https://github.com/blog" data-ga-click="Footer, go to blog, text:blog">Blog</a></li>
        <li><a href="https://github.com/about" data-ga-click="Footer, go to about, text:about">About</a></li>
        <li><a href="https://github.com/pricing" data-ga-click="Footer, go to pricing, text:pricing">Pricing</a></li>

    </ul>

    <a href="https://github.com" aria-label="Homepage">
      <span class="mega-octicon octicon-mark-github" title="GitHub"></span>
</a>
    <ul class="site-footer-links">
      <li>&copy; 2015 <span title="0.05612s from github-fe117-cp1-prd.iad.github.net">GitHub</span>, Inc.</li>
        <li><a href="https://github.com/site/terms" data-ga-click="Footer, go to terms, text:terms">Terms</a></li>
        <li><a href="https://github.com/site/privacy" data-ga-click="Footer, go to privacy, text:privacy">Privacy</a></li>
        <li><a href="https://github.com/security" data-ga-click="Footer, go to security, text:security">Security</a></li>
        <li><a href="https://github.com/contact" data-ga-click="Footer, go to contact, text:contact">Contact</a></li>
        <li><a href="https://help.github.com" data-ga-click="Footer, go to help, text:help">Help</a></li>
    </ul>
  </div>
</div>



    
    
    

    <div id="ajax-error-message" class="flash flash-error">
      <span class="octicon octicon-alert"></span>
      <button type="button" class="flash-close js-flash-close js-ajax-error-dismiss" aria-label="Dismiss error">
        <span class="octicon octicon-x"></span>
      </button>
      Something went wrong with that request. Please try again.
    </div>


      <script crossorigin="anonymous" src="https://assets-cdn.github.com/assets/frameworks-080f1c155a28f5a4315d4a6862aeafb7e27bca0a74db6f7ae9e0048e321369d1.js"></script>
      <script async="async" crossorigin="anonymous" src="https://assets-cdn.github.com/assets/github-ac033f0062bd3f47c468d3da839d615dff91cfcf0e416ea0a0099fbcd4483aba.js"></script>
      
      
    <div class="js-stale-session-flash stale-session-flash flash flash-warn flash-banner hidden">
      <span class="octicon octicon-alert"></span>
      <span class="signed-in-tab-flash">You signed in with another tab or window. <a href="">Reload</a> to refresh your session.</span>
      <span class="signed-out-tab-flash">You signed out in another tab or window. <a href="">Reload</a> to refresh your session.</span>
    </div>
  </body>
</html>

