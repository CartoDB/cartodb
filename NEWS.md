Development
-----------

### NOTICES
- None yet 

### Features
* Display GeoParquet link in Catalog [16453](https://github.com/CartoDB/cartodb/pull/16453)
* Display notifications about the new CARTO platform release [16352](https://github.com/CartoDB/cartodb/pull/16352)
* Upgrade to deck.gl 8.5.6 [16338](https://github.com/CartoDB/cartodb/pull/16338)
* Update DO Catalog dependencies and some changes to use bundle on CARTO Workspace [#16325](https://github.com/CartoDB/cartodb/pull/16325)
* Send data to Hubspot when accessing datasets [#16313](https://github.com/CartoDB/cartodb/pull/16313)
* Request access to datasets directly from DO Catalog [#16291](https://github.com/CartoDB/cartodb/pull/16291)
* Adapt rake SAML parameters for the new version ruby-saml v1.12.2 [#16274](https://github.com/CartoDB/cartodb/pull/16274), [#16275](https://github.com/CartoDB/cartodb/pull/16275/)
* Bump ruby-saml to v1.12.2 [#16273](https://github.com/CartoDB/cartodb/pull/16273)
* Bump cartodb-common to v1.1.2
* Include DB connections, all parameters for Oauth connections, and the relationship between synchronizations and connections, in User migrations [#16287](https://github.com/CartoDB/cartodb/pull/16287)
* Upgrade to CARTO Viewer v1.0.8 [16347](https://github.com/CartoDB/cartodb/pull/16347)
* Show user's database location in profile [16349](https://github.com/CartoDB/cartodb/pull/16349)
* Setting to enable/disable import notifications [16354](https://github.com/CartoDB/cartodb/pull/16354)
* Setting to enable/disable random username generation on SAML authentication process [16372](https://github.com/CartoDB/cartodb/pull/16372)
* Add type guessing capabilities to the ArcGIS connector [#16385](https://github.com/CartoDB/cartodb/pull/16385)
* Add notification about data migrations to CARTO 3 [#16405](https://github.com/CartoDB/cartodb/pull/16405)
* Update banner to notify about data migrations to CARTO 3 [#16420](https://github.com/CartoDB/cartodb/pull/16420)

### Bug fixes / enhancements
- Removing the full path from urls with filter parameters in the Spatial Data Catalog [#16426](https://github.com/CartoDB/cartodb/pull/16426)
- Fix rubocop integration [#16382](https://github.com/CartoDB/cartodb/pull/16382)
- Add marginTop to Page when notification is displayed [#16355](https://github.com/CartoDB/cartodb/pull/16355)
- Add "element" param to DO-Catalog entry function [#16343](https://github.com/CartoDB/cartodb/pull/16343)
- Add new DO Catalog route for internal usage [#16342](https://github.com/CartoDB/cartodb/pull/16342)
- Propagate 'invitation_token' when there is an error signing-up with Google [#16391](https://github.com/CartoDB/cartodb/pull/16391)
- Reverse analysis selection order on new widget form [#16412](https://github.com/CartoDB/cartodb/pull/16412)
- Improve info for :update_user command  [#16363](https://github.com/CartoDB/cartodb/pull/16363)
- Disable email validation in DO Premium Subscriptions [#16309](https://github.com/CartoDB/cartodb/pull/16309)
- Invalidate sessions on 'session_salt' issue [#16376](https://github.com/CartoDB/cartodb/pull/16376)
- Hide sharing tab from viewer in on-premises [#16299](https://github.com/CartoDB/cartodb/pull/16299)
- Update browser version checker to allow Firefox/100.0 [#16415](https://github.com/CartoDB/cartodb/pull/16415)
- Update analysis schemas after giving required permissions on user promotion [#16390](https://github.com/CartoDB/cartodb/pull/16390)
- Add timeout for SQL API exports [#16377](https://github.com/CartoDB/cartodb/pull/16377)
- Avoid deleting a user if it has shared entities [#16424](https://github.com/CartoDB/cartodb/pull/16424)
- Remove all references to Spatial Data Catalog and Kepler GL maps in on-premises [#16293](https://github.com/CartoDB/cartodb/pull/16293)
- Increase hard-limit of MAX_TABLES_PER_IMPORT [#16374](https://github.com/CartoDB/cartodb/pull/16374)
- Guard code for vizjson users [#16267](https://github.com/CartoDB/cartodb/pull/16267)
- Guard code for Users and Visualizations [#16265](https://github.com/CartoDB/cartodb/pull/16265)
- Use the organization user's data while editing a user from organization settings [#16280](https://github.com/CartoDB/cartodb/pull/16280)
- Fix schema name in layers created by free users [#16307](https://github.com/CartoDB/cartodb/pull/16307)
- Limit start parameter of Dropbox connector [#16264](https://github.com/CartoDB/cartodb/pull/16264)
- Fix messages about layer limit being reached [#16360](https://github.com/CartoDB/cartodb/pull/16360)
- Fix 404.html page [#16369](https://github.com/CartoDB/cartodb/pull/16369)
- Fix deck.gl dependency conflicts [#16339](https://github.com/CartoDB/cartodb/pull/16339)
- Migrate Redis DO subscription information in inter-cloud migrations [#16315](https://github.com/CartoDB/cartodb/pull/16315)
- OauthApps restricted by default [#16304](https://github.com/CartoDB/cartodb/pull/16304)
- Support staging hostname in the catalog [#16258](https://github.com/CartoDB/cartodb/pull/16258)
- Add custom redirection on `developers.carto.com/login` [#16383](https://github.com/CartoDB/cartodb/pull/16383)
- Fix user migration export/import logs [#16298](https://github.com/CartoDB/cartodb/pull/16298)
- Fix race condition when DO subscriptions are created [#16311](https://github.com/CartoDB/cartodb/pull/16311)
- Allow the usage of WMTS URLs with parameters to create custom basemaps [#16271](https://github.com/CartoDB/cartodb/pull/16271)
- Sync license_type in redis with the values coming from Central [#16270](https://github.com/CartoDB/cartodb/pull/16270)
- Add `do_bq_project` and `do_bq_dataset` to `api/v3/me` endpoint [#16276](https://github.com/CartoDB/cartodb/pull/16276)
- Avoid updating the same layer more than once when reordering widgets in Builder [#16303](https://github.com/CartoDB/cartodb/pull/16303)
- Add endpoint to update DO subscriptions and manage status of full access requests [#16277](https://github.com/CartoDB/cartodb/pull/16277)
- Add new fields `full_access_[aws|azure]_info` to DO subscriptions [#16278](https://github.com/CartoDB/cartodb/pull/16278)
- Fix verification process for active users [#16337](https://github.com/CartoDB/cartodb/pull/16337)
- Avoid updating analysis nodes more than once when moving layers in Builder [#16279](https://github.com/CartoDB/cartodb/pull/16279)
- Fix subscription/sample filter for datasets [#16254](https://github.com/CartoDB/cartodb/pull/16254)
- Fix form to search dataset when generating a new API key [#16378](https://github.com/CartoDB/cartodb/pull/16378)
- Use fully qualified table name while creating a new map from a shared dataset [#16241](https://github.com/CartoDB/cartodb/pull/16241)
- Render tileset viewer features in front of basemap [#16333](https://github.com/CartoDB/cartodb/pull/16333)
- Rake task to migrate legacy synchronizations [#16353](https://github.com/CartoDB/cartodb/pull/16353)
- Add new events for DO full access [#16290](https://github.com/CartoDB/cartodb/pull/16290)
- Add username/email validation when a organization user is created [#16341](https://github.com/CartoDB/cartodb/pull/16341)
- Bump Rubocop to v1.12.1 to fix the CI hook [#16305](https://github.com/CartoDB/cartodb/pull/16305)
- Fix an issue that prevents API OPTIONS from succeeding because of undue CSRF check [#16292](https://github.com/CartoDB/cartodb/pull/16292)
- Fix a regression test and add some warnings to source code [#16297](https://github.com/CartoDB/cartodb/pull/16297)
- Fix broken links on the public footer [#16308](https://github.com/CartoDB/cartodb/pull/16308)
- Fix search in _Filter by Column Value_ analysis [#16310](https://github.com/CartoDB/cartodb/pull/16310)
- Use Google Maps provider if the base layer is Google [#16314](https://github.com/CartoDB/cartodb/pull/16314)
- Allow importing datasets with exhausted map quota [#16320](https://github.com/CartoDB/cartodb/pull/16320)
- Fix empty ArcGIS imports [#16322](https://github.com/CartoDB/cartodb/pull/16322)
- Fix data overwrite when a user is promoted to admin [#16351](https://github.com/CartoDB/cartodb/pull/16351)
- Update analysis schema when a user is promoted to organization owner [#16358](https://github.com/CartoDB/cartodb/pull/16358)
- Add setting to disable diagnosis page [#16324](https://github.com/CartoDB/cartodb/pull/16324)
- Fix wrong layer schema when creating a map from a shared dataset [#16323](https://github.com/CartoDB/cartodb/pull/16323)
- Fix auto guessing when a csv field is wrong [#16326](https://github.com/CartoDB/cartodb/pull/16326)
- Fix regenerating API Keys for a whole organization [#16336](https://github.com/CartoDB/cartodb/pull/16336)
- Fix API Keys propagation to Redis function [#16340](https://github.com/CartoDB/cartodb/pull/16340)
- Fix scrolling on widget's sidebar in builder [#16350](https://github.com/CartoDB/cartodb/pull/16350)
- Fix Auth URL generation while establishing a connection with Google Drive [#16357](https://github.com/CartoDB/cartodb/pull/16357)
- Fix adding license metadata to a dataset [#16356](https://github.com/CartoDB/cartodb/pull/16356)
- Fix notifications when organization seats limit is reached [#16359](https://github.com/CartoDB/cartodb/pull/16359)
- Notify Support when a user is reaching the named maps limit [#16368](https://github.com/CartoDB/cartodb/pull/16368)
- Remove old named maps when a user is reaching the named maps limit [#16368](https://github.com/CartoDB/cartodb/pull/16368)
- Fix privacy dropdown when user is editing a map [#16367](https://github.com/CartoDB/cartodb/pull/16367)
- Add a new rake to update a user username [#16370](https://github.com/CartoDB/cartodb/pull/16370)
- Add a check before destroying user tables in order to avoid deleting dependent maps [#16381](https://github.com/CartoDB/cartodb/pull/16381)
- Fix duplicated attributions in datasets [#16384](https://github.com/CartoDB/cartodb/pull/16384)
- Moving assets cdn domain from global.ssl.fastly.net to libs.cartocdn.com [#16399](https://github.com/CartoDB/cartodb/pull/16399)
- Fix error while rolling back a user migration from one cloud to another [#16421](https://github.com/CartoDB/cartodb/pull/16421)
- Add retry if a timeout is thrown when swapping the tables related with a sync process [#16430](https://github.com/CartoDB/cartodb/pull/16430)
- Add AUTODETECT_SIZE_LIMIT to ogr2ogr process when guessing CSV file column types [#16431](https://github.com/CartoDB/cartodb/pull/16431)
- Log pg locks if there is any problem during a sync table import process [#16432](https://github.com/CartoDB/cartodb/pull/16432)
- Check pg locks during sync table swap and terminate locking queries [#16433](https://github.com/CartoDB/cartodb/pull/16433)
- Add deprecation notice in docs [#16446](https://github.com/CartoDB/cartodb/pull/16446)

4.45.0 (2021-04-14)
-------------------

### NOTICES
* This release upgrades the CartoDB PostgreSQL extension to `0.37.1`. Run the following to have it available:
```shell
cd $(git rev-parse --show-toplevel)/lib/sql
sudo make install
* As part of the release of `0.37.0`, the creation of overviews is removed and will no longer work.
```

### Features

* BigQuery connector with oauth [#16218](https://github.com/CartoDB/cartodb/pull/16218)
* Save cloud connections data to redis [#16165](https://github.com/CartoDB/cartodb/pull/16165)
* New sign up flow [16137](https://github.com/CartoDB/cartodb/pull/16137)
* New connections API [15939](https://github.com/CartoDB/cartodb/pull/15939)
* New endpoints to fetch users' datasets and tilesets from their BigQuery connection [16061](https://github.com/CartoDB/cartodb/pull/16061)
* New BigQuery connector [16029](https://github.com/CartoDB/cartodb/pull/16029)
* Add access to DO samples. Refactor samples/subscriptions UI [#15910](https://github.com/CartoDB/cartodb/pull/15910)
* Integrate new map_views metric. [#15969](https://github.com/CartoDB/cartodb/pull/15969)
* Fix named maps API retries on destroy event [#16190](https://github.com/CartoDB/cartodb/pull/16190)
* Add preview/visualization of maps in DO catalog [#15973](https://github.com/CartoDB/cartodb/pull/15973)
* Add new user metrics to Home page [#15950](https://github.com/CartoDB/cartodb/pull/15950)
* Replace CRUD user operations in Central API client by publishing messages to the Message Broker [#16035](https://github.com/CartoDB/cartodb/pull/16035)
* Adds JSON-LD with the dataset information in the Data Catalog [#16138](https://github.com/CartoDB/cartodb/pull/16138)
* Add search in 'new map' screen [16166](https://github.com/CartoDB/cartodb/pull/16166)
* Migrate FeatureFlag & PricePlan synchronization to the Message Broker [#16098](https://github.com/CartoDB/cartodb/pull/16098)
* Sync DO Service Account info between central and on-prem and cloud instances [#16189](https://github.com/CartoDB/cartodb/pull/16189)
* Fix OAuth all datasets scope when there is a temp importing table [#16252](https://github.com/CartoDB/cartodb/pull/16252)
* Cleanup after [#16189](https://github.com/CartoDB/cartodb/pull/16189). See [#16200](https://github.com/CartoDB/cartodb/pull/16200)
* Split configuration for Message Broker & Central login redirection [#16150](https://github.com/CartoDB/cartodb/pull/16150)
* Remove Data Library gallery page (now redirected to Spatial Data Catalog) [#16133](https://github.com/CartoDB/cartodb/pull/16133)
* Sync DO API keys betwenn onpremises & CARTO-managed clouds [#16205](https://github.com/CartoDB/cartodb/pull/16205)
* Fix master build [#16213](https://github.com/CartoDB/cartodb/pull/16213)
* Bootstrap new CI & improve stability of old CI [#16220](https://github.com/CartoDB/cartodb/pull/16220)
* Fix for custom icons not working [#16233](https://github.com/CartoDB/cartodb/pull/16233)
* Split tests load evenly in the new CI [#16227](https://github.com/CartoDB/cartodb/pull/16227)
* Catalog fixes: show products only, fix the legend formatting [#16219](https://github.com/CartoDB/cartodb/pull/16219)
* Migrate spec/models/carto to the new CI [#16228](https://github.com/CartoDB/cartodb/pull/16228)
* Add OAuth BigQuery connection [#16218](https://github.com/CartoDB/cartodb/pull/16218)
* Notify about new BigQuery connections to Central [#16266](https://github.com/CartoDB/cartodb/pull/16266)
* Remove Data Observatory v1 [#16207](https://github.com/CartoDB/cartodb/pull/16207)
* Add new static page for tilesets viewer [#16232](https://github.com/CartoDB/cartodb/pull/16232)

### Bug fixes / enhancements

* Fix for listing tilesets from a BQ dataset with no tilesets [16201](https://github.com/CartoDB/cartodb/pull/16201)
* Fix Data page not loading due to null rows [16224](https://github.com/CartoDB/cartodb/pull/16224)
* Add unicorn config sample and output log to stdout by setting environment variable [16221](https://github.com/CartoDB/cartodb/pull/16221/files)
* Some CI improvements [16179](https://github.com/CartoDB/cartodb/pull/16179)
* Bump @carto/viewer to v1.0.3 [16170](https://github.com/CartoDB/cartodb/pull/16170)
* Show a new message for create connections after first login [16159](https://github.com/CartoDB/cartodb/pull/16159)
* Remove master api key from do-catalog layers request [16158](https://github.com/CartoDB/cartodb/pull/16158)
* Set sideEffects webpack.prod.config property to false to fix compilation problems with do-catalog and viewer [16155](https://github.com/CartoDB/cartodb/pull/16154)
* Update viewer version to add copy xyz functionality [16154](https://github.com/CartoDB/cartodb/pull/16154)
* Fix pagination in new map popup [16153](https://github.com/CartoDB/cartodb/pull/16153)
* Include region & maps_api_v2_template in /me config [16112](https://github.com/CartoDB/cartodb/pull/16112)
* Raise limit of Box files listed [16082](https://github.com/CartoDB/cartodb/pull/16082)
* Change url Map Loads docs. in quota section [16068](https://github.com/CartoDB/cartodb/pull/16068)
* Rake task for renaming BQ connector [16030](https://github.com/CartoDB/cartodb/pull/16030)
* Fix maximum of 50 projects in BQ connector billing project selector [16027](https://github.com/CartoDB/cartodb/pull/16027)
* Replace DO metadata SQL with API request [#15983](https://github.com/CartoDB/cartodb/pull/15983)
* Load GoogleMaps library for a map if the owner's query string is available [#15948](https://github.com/CartoDB/cartodb/pull/15948)
* Fix update notifications when using password-validated operation [#15960](https://github.com/CartoDB/cartodb/pull/15960)
* Improve the syncronization functions by using `CDB_GetTableQueries`.
* Bump cartodb-common to v0.4.8
* Don't send ActionController::RoutingError to Rollbar [#15968](https://github.com/CartoDB/cartodb/pull/15968)
* Generate a .pid file to control and manage the subscriber rake process [#15970](https://github.com/CartoDB/cartodb/pull/15970)
* Fix buffering of log traces in subscriber [#15980](https://github.com/CartoDB/cartodb/pull/15980)
* Wrong param name in organization forms [#15975](https://github.com/CartoDB/cartodb/pull/15975)
* Adding API Keys to Redis when user is unlocked [#15959](https://github.com/CartoDB/cartodb/pull/15959)
* Bump version of cartodb-common to v0.4.9 and pubsub to 1.10 [#16007](https://github.com/CartoDB/cartodb/pull/16007)
* Make subscriber wait for DB creation in development [#15982](https://github.com/CartoDB/cartodb/pull/15982)
* `MessageBroker` now grabs the subscription name from `Config#central_subscription_name` [#16008](https://github.com/CartoDB/cartodb/pull/16008)
* Fix an issue with autoloading of a model class [#16011](https://github.com/CartoDB/cartodb/pull/16011)
* Add a default connection timeout of 30 seconds to Carto::Http::Client [#16020](https://github.com/CartoDB/cartodb/pull/16020)
* Propagate request_id in MessageBroker logs [#16006](https://github.com/CartoDB/cartodb/pull/16006)
* Don't report Coverband errors to Rollbar [#16021](https://github.com/CartoDB/cartodb/pull/16021)
* Add private submodule [#16023](https://github.com/CartoDB/cartodb/pull/16023)
* Maps API client now honors 429 Too Many Requests error [#16025](https://github.com/CartoDB/cartodb/pull/16025)
* Fix a loop between our logger and rollbar [#16026](https://github.com/CartoDB/cartodb/pull/16026)
* Make the MessageBroker subscriber PIDFILE check more resilient [#16022](https://github.com/CartoDB/cartodb/pull/16022)
* Bump version of lib/sql submodule to 0.37.1
* Add Maps API v2 related config to authenticated v4/me endpoint [#16237](https://github.com/CartoDB/cartodb/pull/16237)
* Public profile can be disabled via Feature Flag [#15982](https://github.com/CartoDB/cartodb/pull/15995)
* Update cartodb-common to v0.5.3, which in turns udpates pubsub to 2.3.0 [#16038](https://github.com/CartoDB/cartodb/pull/16038)
* Select distinct permissions on OAuth all datasets scope [#16196](https://github.com/CartoDB/cartodb/pull/16196)
* Migrate Organization CRUD to MessageBroker [#15934](https://github.com/CartoDB/cartodb/pull/15934)
* Update cartodb-common, which in turns updates the MessageBroker to send a `publisher_validation_token` [#16041](https://github.com/CartoDB/cartodb/pull/16041)
* Optimize dashboard loading when the number of datasets is very large [#16014](https://github.com/CartoDB/cartodb/pull/16014)
* Only load DO totals in dashboard when they are needed [#16161](https://github.com/CartoDB/cartodb/pull/16161)
* 429 error when multiple datasets are requested to be deleted [#15931](https://github.com/CartoDB/cartodb/pull/15931)
* Aggregate map_views for organization users [#16064](https://github.com/CartoDB/cartodb/pull/16064)
* Migrate Organization CRUD actions started by CartoDB to Message Broker [#16062](https://github.com/CartoDB/cartodb/pull/16062)
* Upgrade deck.gl version [#16072](https://github.com/CartoDB/cartodb/pull/16072)
* Configure Dead Lettering & prevent flooding of map views messages [#16059](https://github.com/CartoDB/cartodb/pull/16059)
* Revamp specs for Message Broker commands and remove old endpoints [#16084](https://github.com/CartoDB/cartodb/pull/16084)
* Remove temp import tables when the IncompatibleSchemas exception is raised [#16181](https://github.com/CartoDB/cartodb/pull/16181)
* Prevent rspec from being executed in any env other than test [#16128](https://github.com/CartoDB/cartodb/pull/16128)
* Prevent a possible `PG::UndefinedFunction` error on DB creation [#16174](https://github.com/CartoDB/cartodb/pull/16174)
* Add groups to v4/me endpoint [#16105](https://github.com/CartoDB/cartodb/pull/16105)
* Add deprecation warning for DO analysis in builder and hide option when user creation is later than deprecation notice date [#16118](https://github.com/CartoDB/cartodb/pull/16118)
* Sanitize column names on overwrite import [#16208](https://github.com/CartoDB/cartodb/pull/16208)
* Updated robots.txt to allow Google access to our datasets [#16148](https://github.com/CartoDB/cartodb/pull/16148)
* In the Data Catalog, fixed baseurl as it added an extra `/` on the queries from public pages [#16148](https://github.com/CartoDB/cartodb/pull/16148)
* Added dynamic meta title and canonical link to improve SEO in public pages for the Spatial Data Catalog [#16157](https://github.com/CartoDB/cartodb/pull/16157)
* Fixed error that added multiple canonical links in the Spatial Data Catalog [#16160](https://github.com/CartoDB/cartodb/pull/16160)
* Modify deprecation warning for DO analysis in builder [#16163](https://github.com/CartoDB/cartodb/pull/16163)
* Fix autoload issues in subscriber [#16171](https://github.com/CartoDB/cartodb/pull/16171)
* Remove no longer used DO metadata DB config [#16212](https://github.com/CartoDB/cartodb/pull/16212)
* Fix CI build by changing machine spec [#16192](https://github.com/CartoDB/cartodb/pull/16192)
* Modify superadmin users activity endpoint to allow pagination [#16226](https://github.com/CartoDB/cartodb/pull/16226)
* Update cartodb-common to v1.1.1, which contains serveral logging fixes [#16182](https://github.com/CartoDB/cartodb/pull/16182)
* Only load DO totals in dashboard when it is needed [#16161](https://github.com/CartoDB/cartodb/pull/16161)
* Fix SAML and LDAP integrations for on-premise installations [#16239](https://github.com/CartoDB/cartodb/pull/16239)
* Read config for public statics compilation [#16234](https://github.com/CartoDB/cartodb/pull/16234)
* Show dataset version in subscription list and details [#16235](https://github.com/CartoDB/cartodb/pull/16235)
* Fix error that avoid to render Spatial Data Catalog properly in Internet Explorer [#16236](https://github.com/CartoDB/cartodb/pull/16236)
* Free users can't create datasets due to default state was private [16223](https://github.com/CartoDB/cartodb/pull/16223)
* Improve visibility over SAML errors [#16243](https://github.com/CartoDB/cartodb/pull/16243)
* SAML adjustments [#16246](https://github.com/CartoDB/cartodb/pull/16246)
* Retrieve user email for SAML logout before closing CARTO session [#16248](https://github.com/CartoDB/cartodb/pull/16248)
* SAML logout only for users who were created via SAML [#16253](https://github.com/CartoDB/cartodb/pull/16253)
* Skip flacky specs [#16261](https://github.com/CartoDB/cartodb/pull/16261)

4.44.0 (2020-11-20)
-------------------

### Features
* Email notifications toggle API endpoint [#15930](https://github.com/CartoDB/cartodb/pull/15930)
* New Email settings section in Account page to manage notifications [#15933](https://github.com/CartoDB/cartodb/pull/15933)
* Allow to create regular apikeys for data observatory datasets [#15940](https://github.com/CartoDB/cartodb/pull/15940)
* Add email_notifications to user decorator [#15949](https://github.com/CartoDB/cartodb/pull/15949)

### Bug fixes / enhancements
* Fix BigQuery connector not importing 0-bytes-processed datasets [#15916](https://github.com/CartoDB/cartodb/pull/15916)
* Error importing geopackage files with multiple layers [#15907](https://github.com/CartoDB/cartodb/pull/15907)
* Add DO notification in dashboard [#15929](https://github.com/CartoDB/cartodb/pull/15929)
* Data loss on table rename due to GhostTablesManager [#15935](https://github.com/CartoDB/cartodb/pull/15935)
* Add DO datasets sync size in /me endpoint [#15932](https://github.com/CartoDB/cartodb/pull/15932)
* Log subscribers to STDOUT and fix JSON format [#15957](https://github.com/CartoDB/cartodb/pull/15957)

4.43.0 (2020-11-06)
-------------------

### Features
* Fix dryrun connector end-point for org users ([#15918](https://github.com/CartoDB/cartodb/pull/15918))
* Fix column sanitization for connector syncs ([#15885](https://github.com/CartoDB/cartodb/pull/15885))
* Load config files as ERB templates to allow reading ENV values ([#15881](https://github.com/CartoDB/cartodb/pull/15881))
* Add public website DO catalog integration ([#15908](https://github.com/CartoDB/cartodb/pull/15908), [#15911](https://github.com/CartoDB/cartodb/pull/15911), [#15912](https://github.com/CartoDB/cartodb/pull/15912))

### Bug fixes / enhancements
* Relax rubocop checks to use ruby2.4+
* Fixed an error handling issue during synchronizations
* Improve import error messages [#15893](https://github.com/CartoDB/cartodb/pull/15893)
* Identify multi-line GeoJSON columns correctly on imports [#15891](https://github.com/CartoDB/cartodb/pull/15891)
* Some experimental code using a message broker
* Add DO geography key variables [#15882](https://github.com/CartoDB/cartodb/pull/15882)
* Migrate `ClientApplication` model to `ActiveRecord` [#15886](https://github.com/CartoDB/cartodb/pull/15886)
* Avoid delegating special methods in presenters [#15889](https://github.com/CartoDB/cartodb/pull/15889)
* Fix Dashboard/Data navigation for free users. Update Data preview texts [#15892](https://github.com/CartoDB/cartodb/pull/15892)
* Force CTE materialization in Ghost Tables query to improve performance [#15895](https://github.com/CartoDB/cartodb/pull/15895)
* Adapt default Rails mail logs to JSON format [#15894](https://github.com/CartoDB/cartodb/pull/15894)
* Fix export of Google Sheet files larger than 10MB [#15903](https://github.com/CartoDB/cartodb/pull/15903)
* Adding `builder_url` to `api/v4/me` endpoint [#15904](https://github.com/CartoDB/cartodb/pull/15904)
* Fix local tests run by parsing database config with ERB [#15901](https://github.com/CartoDB/cartodb/pull/15901)
* Migrate `Log` model to `ActiveRecord` [#15896](https://github.com/CartoDB/cartodb/pull/15896)
* Fix KML importing error when the layers have slashes in their names [#15897](https://github.com/CartoDB/cartodb/pull/15897)
* Create OAuth scope for reading/writing all datasets [#15884](https://github.com/CartoDB/cartodb/pull/15884)
* Migrate `Organization` model to `ActiveRecord` [#15884](https://github.com/CartoDB/cartodb/pull/15884)
* Fix bug reassigning geocodings [#15924](https://github.com/CartoDB/cartodb/pull/15924)
* Migrate `SharedEntity`, `LayerNodeStyle` and `ExternalSource` to `ActiveRecord` [#15920](https://github.com/CartoDB/cartodb/pull/15920)
* Fix broken Sequel <> ActiveRecord association [#15928](https://github.com/CartoDB/cartodb/pull/15928)
* Speedup query to do ApiKey grants [#15927](https://github.com/CartoDB/cartodb/pull/15927)

4.42.0 (2020-09-28)
-------------------

### Features
* New management capabilities for API Keys of other users ([#15819](https://github.com/CartoDB/cartodb/pull/15819))
* New Snowflake, Redshift connectors UI [#15814](https://github.com/CartoDB/cartodb/pull/15814)
* Import API documentation for Snowflake & Redshift connectors ([#15858](https://github.com/CartoDB/cartodb/pull/15858))
* Release Data Observatory subscriptions [#15834](https://github.com/CartoDB/cartodb/pull/15834)
* Allow to cancel premium DO requests [#15864](https://github.com/CartoDB/cartodb/pull/15864)

### Bug fixes / enhancements
* WMTS compatibility: Replace OGC parameters from cartodb-wmsproxy ([15866](https://github.com/CartoDB/cartodb/pull/15866))
* WMTS compatibility: Replace OGC parameters ([15849](https://github.com/CartoDB/cartodb/pull/15849))
* Fix inconsistent handling of SRID in syncs and imports ([15821](https://github.com/CartoDB/cartodb/pull/15821))
* Fix orm-check workflow when the diff has binary files
* Return expired subscriptions with status 'expired' ([93673](https://app.clubhouse.io/cartoteam/story/93673/return-expired-subscriptions))
* Bumps cartodb-common to v0.3.3 to fix error traces ([#15787](https://github.com/CartoDB/cartodb/pull/15787))
* Fix logs for named maps ([15826](https://github.com/CartoDB/cartodb/pull/15826))
* Remove automatic geocodings models and table ([#15817](https://github.com/CartoDB/cartodb/pull/15817))
* Fix column quoting for geometrification ([#15815](https://github.com/CartoDB/cartodb/pull/15815))
* Removing unused class ([#15816](https://github.com/CartoDB/cartodb/pull/15816))
* Added check to avoid modifications of Sequel model files ([#15800](https://github.com/CartoDB/cartodb/pull/15800))
* Refactor: Use Carto::User model as a CartodbCentralSynchronizable [#15807](https://github.com/CartoDB/cartodb/pull/15807)
* Bump cartodb-common to 0.3.4 [#15808](https://github.com/CartoDB/cartodb/pull/15808)
* Fixes missing includes of LoggerHelper [#15812](https://github.com/CartoDB/cartodb/pull/15812)
* Adds logging docs [#15813](https://github.com/CartoDB/cartodb/pull/15813)
* Add wildcard IP for Direct SQL connection [#15818](https://github.com/CartoDB/cartodb/pull/15818)
* Remove usage of `::User` Sequel model from the `ApplicationController` [#15804](https://github.com/CartoDB/cartodb/pull/15804)
* Bump version of cartodb-common module to v0.3.6 [#15820](https://github.com/CartoDB/cartodb/pull/15820)
* Setup Coverband dead code detector [#15811](https://github.com/CartoDB/cartodb/pull/15811)
* Include LoggerHelper as class methods in models [#15824](https://github.com/CartoDB/cartodb/pull/15824)
* Refactor of `Admin::VisualizationsController` code [#15830](https://github.com/CartoDB/cartodb/pull/15830)
* Fix Coverband - Resque integration [#15827](https://github.com/CartoDB/cartodb/pull/15827)
* Delete unused DataImport methods [#15833](https://github.com/CartoDB/cartodb/pull/15833)
* Fix missing LoggerHelper in CartoDB::LayerModule::Presenter [#15829](https://github.com/CartoDB/cartodb/pull/15829)
* Migrated and removed old `::ExternalDataImport` sequel model [#15844](https://github.com/CartoDB/cartodb/pull/15844)
* Fix map backups when deleting tables via Ghost Tables [#15832](https://github.com/CartoDB/cartodb/pull/15832)
* Add DO subscriptions improvements [#15847](https://github.com/CartoDB/cartodb/pull/15847)
* Migrate ::OauthToken from Sequel to ActiveRecord [#15840](https://github.com/CartoDB/cartodb/pull/15840)
* Fix passing `::User` instead of `::Carto::User` [#15848](https://github.com/CartoDB/cartodb/pull/15848)
* Fix DO subscriptions [#15855](https://github.com/CartoDB/cartodb/pull/15855)
* Make the logger honor the environment variable `RAILS_LOG_BASE_PATH` again
* Update DO subscriptions email [#15851](https://github.com/CartoDB/cartodb/pull/15851)
* Remove beta descriptor from Direct SQL Connection text [#15854](https://github.com/CartoDB/cartodb/pull/15854)
* Added a script to generate a graph of Sequel models associations [#15865](https://github.com/CartoDB/cartodb/pull/15865)
* Upgrade ruby-prof gem to 1.4.1 [#15867](https://github.com/CartoDB/cartodb/pull/15867)
* Migrate `::FeatureFlagsUser` to `ActiveRecord` [#15841](https://github.com/CartoDB/cartodb/pull/15841)
* Migrate `::SearchTweet` to ActiveRecord [#15859](https://github.com/CartoDB/cartodb/pull/15859)
* Make import/export of user metadata resilient to missing feature flag [#15872](https://github.com/CartoDB/cartodb/pull/15872)
* Fix Organization.overquota exception logging [#15873](https://github.com/CartoDB/cartodb/pull/15873)
* Revamp Rubocop config
* Fix visualization backup when permission is missing [#15874](https://github.com/CartoDB/cartodb/pull/15874)
* Show outdated subscriptions. Optimize requests [#15879](https://github.com/CartoDB/cartodb/pull/15879)
* Include `::Carto::ActiveRecordCompatibility` in all `Sequel` models [#15879](https://github.com/CartoDB/cartodb/pull/15879)
* Migrate `Permission` model to `ActiveRecord` [#15878](https://github.com/CartoDB/cartodb/pull/15878)

4.41.1 (2020-09-03)
-------------------

### Bug fixes / enhancements
* Now every user manages its own dbdirect IPs, regardless of being a organization user [#15805](https://github.com/CartoDB/cartodb/pull/15805)
* Add a script to measure Sequel model LOC [#15803](https://github.com/CartoDB/cartodb/pull/15803)

4.41.0 (2020-09-01)
-------------------

### Bug fixes / enhancements

* The `X-Request-ID` HTTP header is now propagated from incoming requests to outbound requests for better traceability [#15778](https://github.com/CartoDB/cartodb/pull/15778)
* Fix Catalog "I'm interested" button ([#15785](https://github.com/CartoDB/cartodb/pull/15785))
* Bumps cartodb-common to v0.3.3 to fix error traces ([#15787](https://github.com/CartoDB/cartodb/pull/15787))
* Pg-proxy compatibility: Store the IP firewall information in Redis ([#15791](https://github.com/CartoDB/cartodb/pull/15791))

4.40.0 (2020-07-31)
-------------------

### Bug fixes / enhancements
* Fix error installing odbc_fdw ([#](https://github.com/CartoDB/cartodb/pull/15782))
* WMTS compatibility: Replace the var `tile_matrix_set` by a supported SRS of the WMTS provided.
* ArcGIS imports: raise http timeout and max retry attempts for arcgis import service
* ArcGIS imports: improve log traces to better diagnose json non-conformance errors
* Downgrade bundler to 1.17.3 to avoid problems with Rails version
* Fix to prevent removing datasets from api_keys when it is replaced using overwrite as collision_strategy ([80981](https://app.clubhouse.io/cartoteam/story/80981/joinzoe-change-on-custom-api-key-after-import-collision-strategy-overwrite))
* Fix imports from query that contain `(sql_expression)::cast` ([#15765](https://github.com/CartoDB/cartodb/pull/15765))
* Fix wrong popup position, via new internal carto.js version 4.2.2-1 ([CARTO.js#2254](https://github.com/CartoDB/carto.js/pull/2254))
* Modify .gitignore
* Install Carto::Common::Logger with JSON support ([#15762](https://github.com/CartoDB/cartodb/pull/15762))
* Return all shared datasets ([#15767](https://github.com/CartoDB/cartodb/pull/15767))
* Migrate traces to new Carto::Common::Logger ([#15776](https://github.com/CartoDB/cartodb/pull/15776))

4.39.0 (2020-07-20)
-------------------

### NOTICES
* Adds `ssl_required` config parameter to govern ActionController's redirects. Defaults to `false` (no redirects to HTTPS attempted unless explicitly set to `true`). ([#15716](https://github.com/CartoDB/cartodb/pull/15716]))

### Features
* DOv2 Sync Service ([#15706](https://github.com/CartoDB/cartodb/pull/15706)) ([#15728](https://github.com/CartoDB/cartodb/pull/15728))
* Filter support when license DO datasets ([#15705](https://github.com/CartoDB/cartodb/pull/15705]))
* Synchronize REDIS when licensing from superadmin ([#15719](https://github.com/CartoDB/cartodb/pull/15719]))
* Allow the use of service account credentials on Big Query import UI ([#15722](https://github.com/CartoDB/cartodb/pull/15722))
* Added subscriptions info to the visualizations ([#15723](https://github.com/CartoDB/cartodb/pull/15723))
* Add new DO catalog ([#15733](https://github.com/CartoDB/cartodb/pull/15733))
* Fix server error at OAuth when authorize for datasets:metadata + any other datasets scope ([#15738](https://github.com/CartoDB/cartodb/pull/15738))
* api/v4/datasets returns shared dataset and access mode(read, write) [#15735](https://github.com/CartoDB/cartodb/pull/15735)
* Enable Oauth apps for all users [15749](https://github.com/CartoDB/cartodb/pull/15749)

### Bug fixes / enhancements
* Fix last modified check for db connectors ([#15711](https://github.com/CartoDB/cartodb/pull/15711))
* Improve OAuth error for expired sessions ([#15707](https://github.com/CartoDB/cartodb/pull/15707))
* Verify user email. ([#15683](https://github.com/CartoDB/cartodb/pull/15683))
* Set right referrer header for password reset page ([#15699](https://github.com/CartoDB/cartodb/pull/15699))
* Fix navigation bar tests
* Ignore update_timestamp function on migrations ([#15710](https://github.com/CartoDB/cartodb/pull/15710))
* Improve query builder performance ([#15725](https://github.com/CartoDB/cartodb/pull/15725))
* Upgrade rails to 4.2.11.3 ([#15737](https://github.com/CartoDB/cartodb/pull/15737))
* Avoid duplicates on data library loading ([#15720](https://github.com/CartoDB/cartodb/pull/15720))
* Update DO catalog route ([#15742](https://github.com/CartoDB/cartodb/pull/15742))
* Fixes CARTO attributions link
* Update CARTO.js to v4.2.1 ([#15748](https://github.com/CartoDB/cartodb/pull/15748))

4.38.0 (2020-06-05)
-------------------

### Features
* GCP Firewall managemente for DB Direct IPs ([#15610](https://github.com/CartoDB/cartodb/pull/15610))
* Rake tasks to list DB Direct certificates ([#15625](https://github.com/CartoDB/cartodb/pull/15625))
* PKCS#8 keys support for DB-Direct certificates ([#15622](https://github.com/CartoDB/cartodb/pull/15622))
* UI for managing IPs and Certificates for DB Direct connections ([#15589](https://github.com/CartoDB/cartodb/pull/15589))
* Add support for Node.js 12
* Add user mover support for PG12 (first step, only enabled in Central staging) ([#15686](https://github.com/CartoDB/cartodb/pull/15686))
* Increase limit of certificates for SQL direct from 3 to 5 ([#2536](https://github.com/CartoDB/support/issues/2536))

### Bug fixes / enhancements
* Fix missing connector metadata error information ([#15690](https://github.com/CartoDB/cartodb/pull/15690))
* Add maxRetries for aws s3 operation to improve reliability ([#15679](https://github.com/CartoDB/cartodb/pull/15679))
* Add metrics for connectors actions ([#155564](https://github.com/CartoDB/cartodb/pull/15564))
* Make DB Direct server_ca configurable ([#15650](https://github.com/CartoDB/cartodb/pull/15650))
* More clear DB Direct Firewall error messages ([#15652](https://github.com/CartoDB/cartodb/pull/15652))
* Normalize IP ranges applied to Firewall rules ([#15649](https://github.com/CartoDB/cartodb/pull/15649))
* Fix DB Direct instructions in certificate README ([#15647]https://github.com/CartoDB/cartodb/pull/15647)
* Fix Db Direct IPs Firewall management problem ([#15641](https://github.com/CartoDB/cartodb/pull/15641))
* Fix Db Direct Firewall management credentials problem ([#15640](https://github.com/CartoDB/cartodb/pull/15640))
* DO user settings are now stored under `do_settings:{@username}` ([#15630](https://github.com/CartoDB/cartodb/pull/15630))
* Improve performance of dataset view with many maps ([#15627](https://github.com/CartoDB/cartodb/pull/15627))
* Clarify message at Organization's Auth settings
* Improve performance of dependent visualizations ([#15632](https://github.com/CartoDB/cartodb/pull/15632))
* Do not send DO subscription request mails when requested by team organization user (`ch70618`)
* Fix kepler.gl link in Maps section ([#15644](https://github.com/CartoDB/cartodb/issues/15644))
* /api/v3/me endpoint returns less public data ([#5627](https://github.com/CartoDB/cartodb-platform/issues/5627))
* Retrieve IPs before adding or removing to avoid inconsistencies ([#15643](https://github.com/CartoDB/cartodb/pull/15643))
* Faster geometry types calculation for big datasets ([#15654](https://github.com/CartoDB/cartodb/pull/15654))
* Return error for requests whose authentication was succeeding with an expired session ([#15637](https://github.com/CartoDB/cartodb/pull/15637))
* Fix signup with multiple active invitations ([#15629](https://github.com/CartoDB/cartodb/pull/15629))
* Restore twitter connector for those having their own credentials ([#15656](https://github.com/CartoDB/cartodb/pull/15656))
* Scrub Rollbar data ([#2244](https://github.com/CartoDB/cartodb-central/issues/2244))
* Avoid order by favorited if no user privided ([#15666](https://github.com/CartoDB/cartodb/issues/15666))
* Sync last login date ([#2788](https://github.com/CartoDB/cartodb-central/issues/2788))
* Make user mover fail when custom plpython functions exist ([#15677](https://github.com/CartoDB/cartodb/pull/15677))
* Use pg_restore version matching target DB server ([#15676](https://github.com/CartoDB/cartodb/pull/15676))
* Speed up Ghost Tables Manager checks ([#15674](https://github.com/CartoDB/cartodb/pull/15674))
* v1/viz: Stop returning the db_size_in_bytes value ([#15678](https://github.com/CartoDB/cartodb/pull/15678))
* Ghost Tables Manager: Unify all table checks into a single query ([#15678](https://github.com/CartoDB/cartodb/pull/15678))
* Ghost Tables Manager: Don't do any synchronous check if the user has more than MAX_USERTABLES_FOR_SYNC_CHECK tables. ([#15678](https://github.com/CartoDB/cartodb/pull/15678))
* Modernize profiler code a little ([#15691](https://github.com/CartoDB/cartodb/pull/15691))
* OAuth: Keep state on errors ([#15684](https://github.com/CartoDB/cartodb/pull/15684))

4.37.0 (2020-04-24)
-------------------

### NOTICES
* DB Connectors removed from the main repository
* This release upgrades the CartoDB PostgreSQL extension to `0.36.0`. Run the following to have it available:
```shell
cd $(git rev-parse --show-toplevel)/lib/sql
sudo make install
```

### Features

* New internal API for managing DB-Direct certificates & IPs ([#15567](https://github.com/CartoDB/cartodb/pull/15567))
* Use Dataservices API client 0.30.0
* Enable deleting Kepler.gl maps ([#15485](https://github.com/CartoDB/cartodb/issues/15485))
* Add Kepler.gl maps to Recent content section in the Dashboard ([#15486](https://github.com/CartoDB/cartodb/issues/15486))
* Add Kepler.gl maps to the Maps section in the Dashboard's Home page ([#15487](https://github.com/CartoDB/cartodb/issues/15487))
* Request connector flow with all the states on the same screen ([#15515](https://github.com/CartoDB/cartodb/issues/15515))
* Hooks to override org settings for gear plugin ([#15126](https://github.com/CartoDB/cartodb/pull/15126))
* New app visualization type and endpoints for deploying apps [#15595](https://github.com/CartoDB/cartodb/pull/15595)

### Bug fixes / enhancements
* Fixes bug in CartoDB Central communication ([#15606](https://github.com/CartoDB/cartodb/pull/15606))
* Fix invalid connector IPs information
* Fix wording for feedback
* Use visualization user google api key when present ([#2394](https://github.com/CartoDB/support/issues/2394))
* Public privacy options for maps & datasets can be disabled in UI with quotas ([#524](https://github.com/CartoDB/product/issues/524))
* Fix lockout page due to wrong CustomStorage initialization ([#2444](https://github.com/CartoDB/support/issues/2444))
* Add is_enterprise field to /me ([#15551](https://github.com/CartoDB/cartodb/pull/15551))
* Add BigQuery execution capability
* Remove code related to deprecated plans ([#15563](https://github.com/CartoDB/cartodb/pull/15563))
* Fix ie11 bug due to non babelified toolkit packages ([#2456](https://github.com/CartoDB/support/issues/2456))
* Fix wrong link in footer for location-data-streams
* Fix Kepler maps configuration at Maps section that was causing endless reloads ([#15568](https://github.com/CartoDB/cartodb/pull/15568))
* Fix issue that caused data request form to don't include the company name for organization users ([#15554](https://github.com/CartoDB/cartodb/pull/15554))
* Fix "dataset not found" error in geocoding request for non-org users ([#2426](https://github.com/CartoDB/support/issues/2426))
* Consider unlimited quotas when counting remaining maps ([#2163](https://github.com/CartoDB/support/issues/2163))
* Validate email only on change ([#15575](https://github.com/CartoDB/cartodb/pull/15575))
* Fix viewer user creation from UI ([#15580](https://github.com/CartoDB/cartodb/pull/15580))
* Set node 10.15.1 as default and only for building assets, removing 6.9.2 ([#15530](https://github.com/CartoDB/cartodb/issues/15530))
* Update toolkit libraries to fix case sensitive fields ([#15569](https://github.com/CartoDB/cartodb/pull/15569))
* Fix to avoid locks when sorting rows in dataset table ([#2399](https://github.com/CartoDB/support/issues/2399))
* Fix whitelisted domains for OAuth signup ([#2495]https://github.com/CartoDB/support/issues/2495))
* Lazy loading of Dashboard routes ([#15581](https://github.com/CartoDB/cartodb/pull/15581))

4.36.0 (2020-03-09)
-------------------

### Features
* New Free 2020 Plan, Dashboard and Builder changes ([#15497](https://github.com/CartoDB/cartodb/pull/15497))
* Metadata API integration in license workflow ([#15483](https://github.com/CartoDB/cartodb/issues/15483))
* Kepler.gl visualizations (Dashboard): Integrate Kepler.gl visualizations saved to CARTO into Dashboard ([#15484](https://github.com/CartoDB/cartodb/issues/15484))

### Bug fixes / enhancements
* Hide DataCatalog to Free 2020 users ([#15500](https://github.com/CartoDB/cartodb/pull/15500))
* Hide Create oAuth Apps section in Connected Apps page to Free 2020 users ([#15500](https://github.com/CartoDB/cartodb/pull/15500))
* Update footer links based on account types ([#15502](https://github.com/CartoDB/cartodb/pull/15502))
* Improve welcome copy font ([#15503](https://github.com/CartoDB/cartodb/pull/15503))
* Fix dataset creation without map quotas ([#15504](https://github.com/CartoDB/cartodb/pull/15504))
* Fix imports when user quota cannot be calculated ([#15512](https://github.com/CartoDB/cartodb/pull/15512))
* Update Connectors UI styling ([#15514](https://github.com/CartoDB/cartodb/pull/15514))

4.35.0 (2020-02-21)
-------------------

### Features
* Inherit org owner feature flags ([#15410](https://github.com/CartoDB/cartodb/pull/15410))
* BigQuery Connector endpoints for dry runs and projects/datasets/tables listings ([#15414](https://github.com/CartoDB/cartodb/pull/15414))
* New PostgreSQL, MySQL and SQL Server connectors UI ([#15339](https://github.com/CartoDB/cartodb/issues/15339))
* Limit public datasets by quota ([#524](https://github.com/CartoDB/product/issues/524))
* Add PostgreSQL 12 and PostGIS 3 compatibility ([#6233](https://github.com/CartoDB/cartodb-platform/issues/6233))

### Bug fixes / enhancements
* Prevent multiple Ghost Tables jobs enqueued for same user ([#15277](https://github.com/CartoDB/cartodb/issues/15277))
* Invalidate session at logout ([#2334](https://github.com/CartoDB/support/issues/2334))
* Better error reporting for BigQuery connector ([#15383](https://github.com/CartoDB/cartodb/issues/15383))
* Fix DO subscriptions when estimated_delivery_days is NULL ([#15451](https://github.com/CartoDB/cartodb/pull/15451))
* Improve management of gcloud DO settings through API keys ([#15453](https://github.com/CartoDB/cartodb/pull/15453))
* Fix remaining trial days calculation ([#15470](https://github.com/CartoDB/cartodb/pull/15470))
* Improve management of gcloud DO settings through API keys ([#15453](https://github.com/CartoDB/cartodb/pull/15453) and [#15467](https://github.com/CartoDB/cartodb/pull/15467))
* Add private map count to /me ([#15464](https://github.com/CartoDB/cartodb/pull/15464))
* Fix CSV delimiter detection ([#15423](https://github.com/CartoDB/cartodb/issues/15423))
* Remove "FROM unpackaged" from cartodb extension installation process ([#15493](https://github.com/CartoDB/cartodb/pull/15493))
* BigQuery Connector UI enhancements ([#15393](https://github.com/CartoDB/cartodb/issues/15393))

4.34.0 (2020-01-28)
-------------------

### Features
* Use Dataservices API client 0.28.0

### Bug fixes / enhancements
* Add `rel='noopener noreferrer'` to third-party `target='_blank'` links, and `autocomplete='off'` to password fields. ([#15411](https://github.com/CartoDB/cartodb/pull/15411))
* Fix quotes for `rel='noopener noreferrer'` parameters
* Fix and replace broken links ([#15443])[https://github.com/CartoDB/cartodb/pull/15443])
* Fix assets version in package-lock.json to `1.0.0-assets.155`
* Improve analysis joins performance in Builder UI ([#15454])[https://github.com/CartoDB/cartodb/pull/15454])

4.33.1 (2020-01-27)
-------------------

4.33.0 (2020-01-24)
-------------------

### NOTICES
* This release upgrades the CartoDB PostgreSQL extension to `0.35.0`. Run the following to have it available:
```shell
cd $(git rev-parse --show-toplevel)/lib/sql
sudo make install
```

### Features
- Add pubsub connection to publish metrics events ([#15389](https://github.com/CartoDB/cartodb/pull/15389))
- Limit private maps by quota ([#15412](https://github.com/CartoDB/cartodb/pull/15412))

### Bug fixes / enhancements
* Add noindex meta to organization login page ([#15117](https://github.com/CartoDB/cartodb/issues/15117))
* Prevent sync starvation ([#15398](https://github.com/CartoDB/cartodb/issues/15398))
* Fix misplaced footer in Dialogs ([#15418](https://github.com/CartoDB/cartodb/pull/15418))
* Remove directo connections debug trace ([#15274](https://github.com/CartoDB/cartodb/pull/15274))
* New versioned sanitization of column names ([#15326](https://github.com/CartoDB/cartodb/issues/15326))
* Change Catalog dropdown placeholders (([#15335](https://github.com/CartoDB/cartodb/issues/15335)))
* Fix /embed_map for kuviz ([#15360](https://github.com/CartoDB/cartodb/pull/15360))
* Avoid extra calls when counting number of likes of each visualization ([#15349](https://github.com/CartoDB/cartodb/pull/15349))
* Add scroll to uploaded icons page ([CartoDB/support#2073](https://github.com/CartoDB/support/issues/2073))
* Disable the submit button in the Request Connector form when needed ([#15353](https://github.com/CartoDB/cartodb/issues/15353))
* Fix 414 Request-URI error choosing http method based on real query ([CartoDB/support#2263](https://github.com/CartoDB/support/issues/2263))
* Count kuviz for public map quota ([#15367](https://github.com/CartoDB/cartodb/pull/15367))
* Exclude table permissions from /viz with show_permission=false ([#15368](https://github.com/CartoDB/cartodb/pull/15368))
* Track kuviz events ([#15377](https://github.com/CartoDB/cartodb/pull/15377) and [#15386](https://github.com/CartoDB/cartodb/pull/15386))
* Add config option for disabling email MX check ([#15280](https://github.com/CartoDB/cartodb/pull/15280))
* Add default delivery days for data observatory metadata ([#15362](https://github.com/CartoDB/cartodb/pull/15362))
* Add required tips parameter to fix street geocoding in advanced mode ([CartoDB/support#2265](https://github.com/CartoDB/support/issues/2265))
* Use plpython3u for PG12+ ([#15228](https://github.com/CartoDB/cartodb/pull/15228))
* Avoid requesting password for kuviz with permissions and send email when sharing ([#15384](https://github.com/CartoDB/cartodb/pull/15384))
* Unique name for Kuvizs [#15385](https://github.com/CartoDB/cartodb/pull/15385)
* Check if the connector is configured to add it to the Connectors UI [#15399](https://github.com/CartoDB/cartodb/pull/15399)
* Add a new geocoder (Geocodio) [#15394](https://github.com/CartoDB/cartodb/issues/15394)
* Do dataset price returns zero or null [#15408](https://github.com/CartoDB/cartodb/pull/15408)
* Fix ensuring uniqueness working with kuviz [#15417](https://github.com/CartoDB/cartodb/pull/15417)
* Update CARTOframes onboarding [#15420](https://github.com/CartoDB/cartodb/pull/15420)
* Update CartoCSS info about URI images [CartoDB/developers#651](https://github.com/CartoDB/developers/issues/651)

4.32.0 (2019-12-27)
-------------------

### NOTICES
* This release upgrades the CartoDB PostgreSQL extension to `0.33.0`. Run the following to have it available:
```shell
cd $(git rev-parse --show-toplevel)/lib/sql
sudo make install
```

### Features
* Regular licensing for Data Observatory ([#15315](https://github.com/CartoDB/cartodb/pull/15315))
* BigQuery Connector beta release
* Add new parameter `import_as` to odbc connectors ([#15266](https://github.com/CartoDB/cartodb/pull/15266))
* Add support for Storage API to BigQuery connector, make it public, and allow separate a billing project
  ([#15266](https://github.com/CartoDB/cartodb/pull/15266))
* Split into Upload/connect tabs in new Connectors UI ([#15207](https://github.com/CartoDB/cartodb/issues/15207))
* New Connectors UI layout([#15194](https://github.com/CartoDB/cartodb/issues/15194))
* New UI for BigQuery connector ([#15284](https://github.com/CartoDB/cartodb/issues/15284))
* Federated Tables Beta Release ([#15315](https://github.com/CartoDB/cartodb/pull/15169)):
  * Add enpoints to list, register, update, and unregister Federated Servers
  * Add enpoints to list Remote Schemas
  * Add enpoints to list, register, update, and unregister Remote Tables
* Fixed issue while creating a new user's database: force to alter extension always as template_postgis may have the current version defined and the extension won't be installed

### Bug fixes / enhancements
* Avoid warnings when running test in parallel with an empty environment
* Improve concurrent Ghost Tables syncs handling ([#15272](https://github.com/CartoDB/cartodb/pull/15272))
* Fix consent screen in OAuth apps without user ([#15247](https://github.com/CartoDB/cartodb/pull/15247))
* Migrate old industry values to new ones ([#15273](https://github.com/CartoDB/cartodb/pull/15273)
* Update user industries options with the allowed values from Hubspot ([#15265](https://github.com/CartoDB/cartodb/pull/15265))
* ArcGIS connector: Stop skipping ids on failure.
* Adapt python scripts python3 syntax.
* Column options display bug ([#15325](https://github.com/CartoDB/cartodb/pull/15325))
* Fix kuviz permissions ([#15336](https://github.com/CartoDB/cartodb/pull/15336))
* Unlock Connectors UI ([CartoDB/support#2318](https://github.com/CartoDB/support/issues/2318))
* Destroy users with OAuth access tokens ([CartoDB/support#2301](https://github.com/CartoDB/support/issues/2301))
* Add element to track GTM events in Connectors UI ([#15340](https://github.com/CartoDB/cartodb/issues/15340))
* Minor fixes Connectors UI ([#15323](https://github.com/CartoDB/cartodb/issues/15323))
* Update Data Observatory storage types ([#15352](https://github.com/CartoDB/cartodb/pull/15352))
* Update internal-carto.js version to new released v4.2.0

4.31.0 (2019-11-19)
-------------------

### Features
* Show license information for OnPremises ([#15243](https://github.com/CartoDB/cartodb/pull/15243))

### Bug fixes / enhancements
* Remove X-Frame-Options header for kuviz visualizations ([CartoDB/cartodb#15019](https://github.com/CartoDB/cartodb/issues/15019))
* Remove duplicate banner in API Keys page ([CartoDB/cartodb#14936](https://github.com/CartoDB/cartodb/issues/14936))

4.30.1 (2019-11-15)
-------------------

### NOTICES
* This release upgrades the CartoDB PostgreSQL extension to `0.32.0`. Run the following to have it available:
```shell
cd $(git rev-parse --show-toplevel)/lib/sql
sudo make install
```

### Features
* Add quick link to copy dataset name ([CartoDB/product#391](https://github.com/CartoDB/product/issues/391))
* Add support for BigQuery connector (https://github.com/CartoDB/cartodb/pull/15179)

### Bug fixes / enhancements
* Reassign ownership after destroying an OAuth API key ([#15162](https://github.com/CartoDB/cartodb/pull/15162))
* Fix message in password confirmation modal when changing the password ([CartoDB/support#2187](https://github.com/CartoDB/support/issues/2187))
* Fix message in password protected maps ([CartoDB/design#1758](https://github.com/CartoDB/design/issues/1758)
* Fix Catalog Dropdowns scroll ([CartoDB/design#1744](https://github.com/CartoDB/design/issues/1744)
* Fix Visualization Searcher ([CartoDB/cartodb#15224](https://github.com/CartoDB/cartodb/issues/15224)
* Reassign ownership after destroying an OAuth API key ([#15162](https://github.com/CartoDB/cartodb/pull/15162))
* Show create dataset button when the user enters the dashboard the first time but already has datasets ([CartoDB/support#2187](https://github.com/CartoDB/support/issues/2187))

4.30.0 (2019-10-18)
-------------------

### NOTICES
* This release upgrades the CartoDB PostgreSQL extension to `0.31.0`. Run the following to have it available:
```shell
cd $(git rev-parse --show-toplevel)/lib/sql
sudo make install
```

### Features
* Add warning in the code editor when using a Data Services function ([CartoDB/support#2046](https://github.com/CartoDB/support/issues/2046))
* OAuth:
  * Regular api keys are now able to create tables ([#14978](https://github.com/CartoDB/cartodb/issues/14978))
  * Scope to list datasets metadata ([#15041](https://github.com/CartoDB/cartodb/pull/15041))
  * API endpoint to list datasets metadata ([#15013](https://github.com/CartoDB/cartodb/issues/15013))
  * Do not require icon_url ([#15039](https://github.com/CartoDB/cartodb/pull/15039))
  * Send notification on oauth_app deletion (#15016)
  * Add number of employees and use case to user profile ([#14966](https://github.com/CartoDB/cartodb/pull/14966))
  * Fixes migrations for users with OAuth related data (#14600)
  * Add more columns to oauth_app ([#15015](https://github.com/CartoDB/cartodb/issues/15015))
  * Track OauthApp and OauthAppUser events in Segment ([#15055](https://github.com/CartoDB/cartodb/pull/15055))
  * Update Auth API swagger spec to include schemas and table_metadata grants ([#14998](https://github.com/CartoDB/cartodb/issues/14998))
  * Allow developers to manage their OAuth apps in the dashboard ([#15031](https://github.com/CartoDB/cartodb/pull/15031))
  * Scope to access DO API ([CartoDB/cartodb#15119](https://github.com/CartoDB/cartodb/issues/15119))
* Add number of employees and use case to user profile ([#14966](https://github.com/CartoDB/cartodb/pull/14966))
* Add CARTO Data Source Request link ([CartoDB/product#441](https://github.com/CartoDB/product/issues/441))
* Data Observatory token endpoint ([#15097](https://github.com/CartoDB/cartodb/pull/15097))
* Add GET MFA status to EUMAPI ([CartoDB/cartodb#15101](https://github.com/CartoDB/cartodb/issues/15101))
* Rake task to purchase Data Observatory datasets ([CartoDB/cartodb#15076](https://github.com/CartoDB/cartodb/issues/15076))
* Data Observatory licensing API ([#15136](https://github.com/CartoDB/cartodb/pull/15136))
* Remove Hubspot tracking from cartodb. All the tracking will be managed from Google Tag Manager ([#15128](https://github.com/CartoDB/cartodb/pull/15128))
* Display banner in embed for free users ([CartoDB/product#409](https://github.com/CartoDB/product/issues/409))
* Simplify CARTOframes tutorial([15133](https://github.com/CartoDB/cartodb/issues/15133))
* Catalogue page:
  * Add structure for new Catalogue page ([#15109](https://github.com/CartoDB/cartodb/pull/15109))
  * Add list of datasets for new Catalogue page ([#15115](https://github.com/CartoDB/cartodb/issues/15115))
  * Add interactivity/filtering section to new Catalogue page ([#15116](https://github.com/CartoDB/cartodb/issues/15116))
  * Add detail page to new Catalogue ([#15124](https://github.com/CartoDB/cartodb/issues/15124))
* Add Kuviz to Maps page:
  * (a) - Add kuviz to visualizations request (maps) ([#15192](https://github.com/CartoDB/cartodb/issues/15192))
  * (b) - Quick actions ([#15174](https://github.com/CartoDB/cartodb/issues/15174))
  * (c) - Bulk actions ([#15173](https://github.com/CartoDB/cartodb/issues/15173))
  * (d) - Dropdown filter ([#15175](https://github.com/CartoDB/cartodb/issues/15175))
  * (e) - Custom kuviz card ([#15193](https://github.com/CartoDB/cartodb/issues/15193))


### Bug fixes / enhancements
* Change utm_parameters ([#15146](https://github.com/CartoDB/cartodb/pull/15146))
* Fix API keys page when tables had certain reserved names ([#15059](https://github.com/CartoDB/cartodb/pull/15059))
* Stricter email domain validation ([#15030](https://github.com/CartoDB/cartodb/pull/15030))
* Redirect viewer users to shared visualizations page, and show shared visualizations in Home ([CartoDB/support#2032](https://github.com/CartoDB/support/issues/2032))
* Fix user presenter ([#15033](https://github.com/CartoDB/cartodb/pull/15033))
* Remove CARTO logo option ([CartoDB/support#2091](https://github.com/CartoDB/support/issues/2091))
* Change embeds attribution character ([#14914](https://github.com/CartoDB/cartodb/issues/14914))
* Fix disabled privacy button in Builder when there are no other public maps ([CartoDB/support#2163](https://github.com/CartoDB/support/issues/2163))
* Include password confirmation in the delete mobile app modal ([CartoDB/support#2155](https://github.com/CartoDB/support/issues/2155))([#15061](https://github.com/CartoDB/cartodb/pull/15061))
* Rename "Professional" Plan to "Individual" Plan ([#15069](https://github.com/CartoDB/cartodb/pull/15069))
* The type of the tables_id column of user_tables has changed from integer to oid ([#15068](https://github.com/CartoDB/cartodb/issues/15068))
* Revamp link to DB connectors feedback ([#1614](https://github.com/CartoDB/design/issues/1614))
* Fix schema name in create API key permission ([#15082](https://github.com/CartoDB/cartodb/pull/15082))
* Minor CSS fixes in Mobile Apps page ([#15090](https://github.com/CartoDB/cartodb/pull/15090))
* Revert connectors link to previous version ([#15096](https://github.com/CartoDB/cartodb/pull/15096))
* Fix broken link in oauth app page ([#15098](https://github.com/CartoDB/cartodb/issues/15098))
* Include users API key for EUMAPI ([#15102](https://github.com/CartoDB/cartodb/issues/15102))
* Fix Mobile Apps deletion bug ([CartoDB/support#2218](https://github.com/CartoDB/cartodb/pull/15135))
* Update Dataservices API client default version to `0.27.0` (#15134)
* Allow users to login from forbidden map/dataset page. ([CartoDB/support#2031](https://github.com/CartoDB/support/issues/2031))
* Fix password validation for SAML ([#15147](https://github.com/CartoDB/cartodb/pull/15147))
* Dashboard: Rename catalogue to catalog ([#15158](https://github.com/CartoDB/cartodb/issues/15158))
* Fix dataset list header sticky header top in homepage ([#15164](https://github.com/CartoDB/cartodb/issues/15164))

4.29.0 (2019-07-15)
-------------------

### NOTICES
* This release upgrades the CartoDB PostgreSQL extension to `0.28.1`. Run the following to have it available:
```shell
cd $(git rev-parse --show-toplevel)/lib/sql
sudo make install
```

### Features
* Datasets that contain a column named `carto_geocode_hash` are not synchronized by replacing tables, but use
  `CDB_SyncTable` instead (from the CartoDB PostgreSQL extension 0.28.0)
  ([#14991](https://github.com/CartoDB/cartodb/pull/14991))
* OAuth:
  * Support datasets create scope ([#14592](https://github.com/CartoDB/cartodb/issues/14592))
  * Grant schemas create scope ([#14591](https://github.com/CartoDB/cartodb/issues/14591))
  * Save ownership_role_name in cdb_conf_info ([#14593](https://github.com/CartoDB/cartodb/issues/14593))
  * Install schema triggers (upgrade to postgresql extension 0.29.0) to reassign owner of relation after creation ([#14594](https://github.com/CartoDB/cartodb/pull/14594))
* Inform users about their quota usage ([CartoDB/product#334](https://github.com/CartoDB/product/issues/334))

### Bug fixes / enhancements
* Document and fix timeouts for the ArcGIS connector ([CartoDB/support#2075](https://github.com/CartoDB/support/issues/2075))
* Document column names normalization ([CartoDB/support#2111](https://github.com/CartoDB/support/issues/2111))
* Remove some rollbar logging ([#15001](https://github.com/CartoDB/cartodb/issues/15001))
* Include scopes for granted OAuth apps endpoint and hide private information ([#15002](https://github.com/CartoDB/cartodb/issues/15002))
* Add new parameters to send via GTM ([#15021](https://github.com/CartoDB/cartodb/pull/15021))

4.28.0 (2019-07-01)
-------------------

### Features
* Inform users about their quota usage ([CartoDB/product#334](https://github.com/CartoDB/product/issues/334))
* API to manage OAuth apps ([#14985](https://github.com/CartoDB/cartodb/issues/14985), [#14986](https://github.com/CartoDB/cartodb/issues/14986))

### Bug fixes / enhancements
* Include objectid column from GDB files to be used as ID column when the content guesser is activated [#14965](https://github.com/CartoDB/cartodb/pull/14965)
* Fix migrations of users with oauth_app_user_roles ([#14981](https://github.com/CartoDB/cartodb/issues/14981))

4.27.1 (2019-06-20)
-------------------

### Features
* New maintenance mode page ([#14946](https://github.com/CartoDB/cartodb/pull/14946))

### Bug fixes / enhancements
* Update user industries options with the allowed values from Hubspot ([#14959](https://github.com/CartoDB/cartodb/pull/14959))
* New Superadmin API to get user activity stats ([CartoDB/cartodb-central#2455](https://github.com/CartoDB/cartodb-central/issues/2455))
* Do not require trackjs config ([#14979](https://github.com/CartoDB/cartodb/pull/14979))

4.27.0 (2019-06-17)
-------------------

### NOTICES
* This release upgrades the CartoDB PostgreSQL extension to `0.27.1`. Run the following to have it available:
```shell
cd $(git rev-parse --show-toplevel)/lib/sql
sudo make install
```

### Features
* Limit public maps ([#14861](https://github.com/CartoDB/cartodb/issues/14861))
* Add notification warning to display user notifications when necessary [#14859](https://github.com/CartoDB/cartodb/issues/14859)
* Limit regular api keys ([#14863](https://github.com/CartoDB/cartodb/issues/14863))
* New attributes to /me endpoint (#14862)
* Kuviz (custom visualizations) API and visualization endpoints [#14900](https://github.com/CartoDB/cartodb/pull/14909)
* Inform users about quota errors (#14921)

### Bug fixes / enhancements
* Load Track.js only 20% of the time [#14928](https://github.com/CartoDB/cartodb/pull/14928)
* Fix choice of dataservices provider for metrics [#14729](https://github.com/CartoDB/cartodb/pull/14729)
* Improve caching management when table permissions change ([CartoDB/cartodb-management#5218](https://github.com/CartoDB/cartodb-management/issues/5218))
* Chaging test related to deprecated st_text function [#14865](https://github.com/CartoDB/cartodb/pull/14865)
* Fix row count mix ([CartoDB/support#2039](https://github.com/CartoDB/support/issues/2039))
* Sanitize profile form inputs
* Fix map list style inside the delete dataset dialog [#14685](https://github.com/CartoDB/cartodb/issues/14685)
* Update database_host IP for every user from a server rake [#14854](https://github.com/CartoDB/cartodb/pull/14854)
* Fix paging parameters ([CartoDB/cartodb-management#5215](https://github.com/CartoDB/cartodb-management/issues/5215))
* Rake task to remove password salt [#14834](https://github.com/CartoDB/cartodb/pull/14834)
* Adds organization appearance to forget link URL ([CartoDB/cartodb#14875](https://github.com/CartoDB/cartodb/issues/14875))
* Add public_map_quota to user ([CartoDB/cartodb-central#2452](https://github.com/CartoDB/cartodb-central/issues/2452))
* Fix published maps in Editor ([CartoDB/support#2048](https://github.com/CartoDB/support/issues/2048))
* Updates `odbc_fdw` extension to version `0.4.0` [#14885](https://github.com/CartoDB/cartodb/pull/14885)
* Add regular_api_key_quota to user ([CartoDB/cartodb-central#2472](https://github.com/CartoDB/cartodb-central/issues/2472))
* Add rescue for PG::UndefinedColumn on update_table_geom_pg_stats [#2034](https://github.com/CartoDB/support/issues/2034)
* Filter TrackJS errors in embed maps ([#14890](https://github.com/CartoDB/cartodb/issues/14890))
* Minor copy edit in final step of Builder Onboarding
* Filter API keys by type (#14904)
* Change API keys page layout ([#14907](https://github.com/CartoDB/cartodb/pull/14907))
* Fix empty navigation for non engine users in API keys page ([#14916](https://github.com/CartoDB/cartodb/pull/14916))
* Update Welcome message with plan info ([#14871](https://github.com/CartoDB/cartodb/issues/14871))
* New signup plan ([CartoDB/cartodb-central#2456](https://github.com/CartoDB/cartodb-central/issues/2456))
* Minor copy edit ([#14922](https://github.com/CartoDB/cartodb/pull/14922))
* Fix notification warning positioning issue ([#14920](https://github.com/CartoDB/cartodb/pull/14920))
* Update quota copies (#14945)
* Fix public page with invalid datasets ([#14939](https://github.com/CartoDB/cartodb/issues/14939))
* Fix tab scroll in modal ([#14955](https://github.com/CartoDB/cartodb/pull/14955))
* Fix onboarding box styles in dashboard ([#1612](https://github.com/CartoDB/design/issues/1612))
* Take trial users to /upgrade page ([#14956](https://github.com/CartoDB/cartodb/issues/14956))
* [Maintenance Page] Remove unnecessary call ([#14977](https://github.com/CartoDB/cartodb/pull/14977))
* Support for the new Free price plan ([#15478](https://github.com/CartoDB/cartodb/pull/15478))

4.26.1 (2019-05-06)
-------------------

### NOTICES
* For increased security, it's recommended to update the config to include a `secret_key_base`. You can generate a
  suitable random key by using `bundle exec rake secret`

### Features
* Visualizations backup revamp [#14698](https://github.com/CartoDB/cartodb/issues/14698)
  * Remove `VisualizationsExportService` [#14744](https://github.com/CartoDB/cartodb/pull/14744)
  * `visualization_backups` table Migration [#14749](https://github.com/CartoDB/cartodb/pull/14749)
  * New visualizations backup [#14745](https://github.com/CartoDB/cartodb/pull/14745)
  * Restore visualizations from new backup [#14764](https://github.com/CartoDB/cartodb/pull/14764)
* Tag search [#14777](https://github.com/CartoDB/cartodb/pull/14777)
* Add `search_preview` endpoint for quick tags and visualizations search [#14797](https://github.com/CartoDB/cartodb/pull/14797)
* Search visualizations by tag in regular search [14798](https://github.com/CartoDB/cartodb/pull/14798)
* Ghost tables event trigger creation [#14697](https://github.com/CartoDB/cartodb/issues/14697)
* Password encryption with Argon2 [14811](https://github.com/CartoDB/cartodb/pull/14811)
* Dashboard onboarding: Create components markup for wizard [#14787](https://github.com/CartoDB/cartodb/pull/14787)
* Dashboard onboarding [#14823](https://github.com/CartoDB/cartodb/pull/14823)
* Include tags in search results [CartoDB/product#243](https://github.com/CartoDB/product/issues/243)

### Bug fixes / enhancements
* Add link to Help Center to invitation emails
* Remove locked maps from total_likes and total_shared counts [#14727](https://github.com/CartoDB/cartodb/pull/14727)
* Unclear LDS Renewal Date ([#14724](https://github.com/CartoDB/cartodb/issues/14724))
* Data Library defaults to .gpkg for import
* Change Builder Feedback Form ([#14708](https://github.com/CartoDB/cartodb/issues/14708))
* Dataset name doesn't change when it's updated ([#14735](https://github.com/CartoDB/cartodb/pull/14735))
* New Dashboard documentation ([#14712](https://github.com/CartoDB/cartodb/pull/14712))
* Fix initial rate limit setting
* Bolt now can: retry with timeout, execute a rerun function for retry. The importer now uses bolt
  for the register phase in order to avoid multiple ghost table calls in the future[#14736](https://github.com/CartoDB/cartodb/pull/14736)
* Fix `db:create` rake (#14766)
* Design review changes ([CartoDB/product#272](https://github.com/CartoDB/product/issues/272))
* Invite User menu missing go back icon ([#14739](https://github.com/CartoDB/cartodb/issues/14739))
* Fix error when duplicating shared dataset in dashboard ([#14750](https://github.com/CartoDB/cartodb/issues/14750))
* Set results per page to 6 in maps and datasets for Home Page ([#14756](https://github.com/CartoDB/cartodb/pull/14756))
* Display shared with colleagues list in map and dataset card ([#14748](https://github.com/CartoDB/cartodb/pull/14748))
* Disable 'New dataset' options when no available/remaining storage quota ([#14762](https://github.com/CartoDB/cartodb/pull/14762))
* Footer and pagination fix in create and share dialogs [#14765](https://github.com/CartoDB/cartodb/pull/14765)
* Design review: update bulk actions labels and sticky table headings ([CartoDB/product#299](https://github.com/CartoDB/product/issues/299))
* Unify modal footers ([#14769](https://github.com/CartoDB/cartodb/pull/14769))
* Fix headers in search page and empty or initial states in dashboard([#14772](https://github.com/CartoDB/cartodb/pull/14772))
* Add sql_query parameter on database connector sync examples([#14781](https://github.com/CartoDB/cartodb/pull/14781))
* Fix layer interface does not appear ([CartoDB/product#1988](https://github.com/CartoDB/product/issues/1988))
* Fix z-index in Quick Actions dropdown ([#14780](https://github.com/CartoDB/cartodb/pull/14780))
* Fix extra API call in global search ([#14774](https://github.com/CartoDB/cartodb/issues/14774))
* Fix Radio buttons not being displayed correctly in connect dataset modal ([#14776](https://github.com/CartoDB/cartodb/issues/14776))
* Make drop functions code PG11 compatible ([#14792](https://github.com/CartoDB/cartodb/pull/14792))
* Remove Builder enabled notification from Builder and migrated Dashboard ([#14784](https://github.com/CartoDB/cartodb/pull/14784))
* Add dependent visualizations to visualizations method in GET ([#14802](https://github.com/CartoDB/cartodb/pull/14802))
* Fix wrong link to Dashboard Help Center articule ([#14799](https://github.com/CartoDB/cartodb/issues/14799))
* Sidebar overlaps Header in profile page ([#14803](https://github.com/CartoDB/cartodb/issues/14803))
* Remove migrated dashboard ([#14741](https://github.com/CartoDB/cartodb/pull/14741))
* Change tag icon and spacing ([#14773](https://github.com/CartoDB/cartodb/issues/14773))
* Dashboard onboarding: Timeline animation and bug fixes ([#14789](https://github.com/CartoDB/cartodb/pull/14789))
* Fix minor CSS issues in Groups and Add groups panels ([#14786](https://github.com/CartoDB/cartodb/issues/14786))
* Add badge for first onboarding visitors ([#14831](https://github.com/CartoDB/cartodb/pull/14831))
* Fix "Duplicate datasets" action in the dashboard ([#2023](https://github.com/CartoDB/support/issues/2023))
* CSS color variables refactor ([#14837](https://github.com/CartoDB/cartodb/pull/14837))
* Fix trial expired message without expiration date ([CartoDB/support#1997](https://github.com/CartoDB/support/issues/1997))
* Obfuscate password in connector content ([CartoDB/support#2013](https://github.com/CartoDB/support/issues/2013))
* Remove Editor dashboard from cartodb folder ([#14796](https://github.com/CartoDB/cartodb/pull/14796))
* Replace title for items number when selecting visualizations ([#14832](https://github.com/CartoDB/cartodb/issues/14832))
* Organize CSS files following 7-1 pattern style ([#14843](https://github.com/CartoDB/cartodb/pull/14843))
* Fix email enumeration vulnerability [#5217](https://github.com/CartoDB/cartodb-management/issues/5217)
* Synchronize password re-encryption with central ([#14867](https://github.com/CartoDB/cartodb/pull/14867))

4.26.0 (2019-03-11)
-------------------

### NOTICES
* **BREAKING**: Drop support for Node.js 6
* **BREAKING**: Drop support for npm 3 and `npm-shrinkwrap.json` file.
* **BREAKING**: CartoDB now requires Ruby 2.4

### Bug fixes / enhancements
* Fix storage link [#14723](https://github.com/CartoDB/cartodb/pull/14723)
* Upgrade googleapis gem to 0.28 in order to make it compatible with ruby 2.4.5 [#14683](https://github.com/CartoDB/cartodb/pull/14683)
* Setup TrackJS and Google Tag Manager in New Dashboard ([#14693](https://github.com/CartoDB/cartodb/pull/14693))
* Update Dataservices API client default version to `0.26.2` (#14695)
* Fix dataset search with dependent visualizations ([CartoDB/product#267](https://github.com/CartoDB/product/issues/267)))
* Fix Lockout page ([product#261](https://github.com/CartoDB/product/issues/261))
* Use .toLocaleDateString() to format date in notification page ([#14707](https://github.com/CartoDB/cartodb/pull/14707))
* Fix likes feature in Search Page ([#14709](https://github.com/CartoDB/cartodb/pull/14709))
* Adapt current dashboard's request interceptor ([#14489](https://github.com/CartoDB/cartodb/issues/14489))
* Bulk actions in datasets and maps revised and fixed ([#14700](https://github.com/CartoDB/cartodb/pull/14700))
* Fix .carto not creating a map in old dashboard ([#14713](https://github.com/CartoDB/cartodb/pull/14713))
* Remove patches for Rails 3 and ruby 2.4 not longer needed [#14667](https://github.com/CartoDB/cartodb/pull/14667)
* Reorder Quick actions menu ([CartoDB/product#282](https://github.com/CartoDB/product/issues/282))
* Update gems to ones that support Ruby 2.4 (#14722)
* Scroll fixes ([#14704](https://github.com/CartoDB/cartodb/issues/14704), [#14703](https://github.com/CartoDB/cartodb/issues/14703))
* Fix bug with Shift and Click ([CartoDB/product#279](https://github.com/CartoDB/product/issues/279))
* Improve shift and click behavior ([CartoDB/product#278](https://github.com/CartoDB/product/issues/278))
* Add new Ghost tables resque task with username as parameter([#14731](https://github.com/CartoDB/cartodb/pull/14731))
* Add developer center documentation folder to doc [14710](https://github.com/CartoDB/cartodb/pull/14710)
* Improve feedback popup ([CartoDB/product#272](https://github.com/CartoDB/product/issues/272))

4.25.2 (2019-02-25)
-------------------

### NOTICES
* Updating shrinkwrap and package-lock before Node.js upgrade [#14669](https://github.com/CartoDB/cartodb/pull/14669)
* This release upgrades the CartoDB PostgreSQL extension to `0.25.0`. Run the following to have it available:
```shell
cd $(git rev-parse --show-toplevel)/lib/sql
sudo make install
```
- Updating installation guide due to Node.js & Ruby version upgrades [#14692](https://github.com/CartoDB/cartodb/pull/14692)

### Features
* Added a rake task to generate finer grain LDS metrics reports (user/day granularity) [#14671](https://github.com/CartoDB/cartodb/pull/14671)

### Bug fixes / enhancements
* Add filtering by types to /tags endpoint and use it in the new dashboard ([CartoDB/product#259](https://github.com/CartoDB/product/issues/259)))
* In ruby 2.4.5 looks like rescue fails for operator precendence [#14666](https://github.com/CartoDB/cartodb/pull/14666)
* Fix users that had sort by likes stored [#14668](https://github.com/CartoDB/cartodb/pull/14668)
* Relocate styles to the New Dashboard folder [#14672](https://github.com/CartoDB/cartodb/pull/14672)
* Update links in quota & metrics section in New Dashboard [#14574](https://github.com/CartoDB/cartodb/issues/14574)
* Fix quick actions dropdown in maps and datasets card - Dashboard
* Update pending notifications badge when checking out notifications in the New Dashboard
* Show new footer in settings and private user pages ([#14342](https://github.com/CartoDB/cartodb/issues/14342))
* Format quota numbers with separators in Home Page ([#14680](https://github.com/CartoDB/cartodb/pull/14680))
* Number of favorites in filter dropdown does not update when fav/unfav items in new Dashboard [CartoDB/product#256](https://github.com/CartoDB/product/issues/265)
* Fix for importer, which did not work when configuring the temp directory (`unp_temporal_folder`) to a path containing capital letters [#14688](https://github.com/CartoDB/cartodb/pull/14688)
* Add trial end date to personal30 account users [#14679](https://github.com/CartoDB/cartodb/pull/14679)
* Fix Drag&Drop behaviour from Home Page ([#14682](https://github.com/CartoDB/cartodb/pull/14682))
* Update recent content section when content changes in Home ([#14662](https://github.com/CartoDB/cartodb/issues/14662))

4.25.1 (2019-02-11)
-------------------

### Features
* /tags endpoint to retrieve the user's tags with usage count (https://github.com/CartoDB/product/issues/208)
* Remove support for likes in favor of having favorites [#14618](https://github.com/CartoDB/cartodb/pull/14618))

### Bug fixes / enhancements
* Add base URL to lockout redirection in static pages ([#14617](https://github.com/CartoDB/cartodb/pull/14617))
* Improve the in_database operations fixing some rails behaviors that were problematic for us ([#14642]https://github.com/CartoDB/cartodb/pull/14642)
* Makes maps listing go faster with related tables (user db size cache issue, #14165)
* Do not redirect to /login by default when error is unknown in network interceptor ([#14616](https://github.com/CartoDB/cartodb/pull/14616))
* Update CARTO.js to v4.1.10
* Show zero when remaining quota is negative in metrics section of New Dashboard ([#14565](https://github.com/CartoDB/cartodb/issues/14565))
* Enable search box geocoder provider selection ([#14622](https://github.com/CartoDB/cartodb/pull/14622))
* New Lockout page for New Dashboard ([#14589](https://github.com/CartoDB/cartodb/issues/14589))
* Fix organization invitation styles ([#14629](https://github.com/CartoDB/cartodb/issues/14629))
* Fix typo in new dashboard search suggestions ([#14632](https://github.com/CartoDB/cartodb/pull/14632))
* Update navigation in all private pages ([#14312](https://github.com/CartoDB/cartodb/issues/14312))
* Update maps section after usability tests in new dashboard ([#214](https://github.com/CartoDB/product/issues/214), [#215](https://github.com/CartoDB/product/issues/215), [#216](https://github.com/CartoDB/product/issues/216))
* Avoid quota notifications for viewer users (https://github.com/CartoDB/support/issues/1916)
* Fix Links to datasets shared with me ([CartoDB/product#229](https://github.com/CartoDB/product/issues/229))
* Order Datasets by "Favourited first" and "Last Modified" ([CartoDB/product#237](https://github.com/CartoDB/product/issues/237))
* Fix Cancel button not working in metadata edition view ([CartoDB/product#232](https://github.com/CartoDB/product/issues/232)))
* Show latest maps/datasets within Recent Content in Home ([product#207](https://github.com/CartoDB/product/issues/207))
* Usability Fixes for New Dashboard ([#14565](https://github.com/CartoDB/cartodb/issues/14565))
* Tags section for Home Page ([CartoDB/product#208](https://github.com/CartoDB/product/issues/208))
* Avoid sending seat limit reached email if the new user is viewer ([#14650](https://github.com/CartoDB/cartodb/pull/14650))
* Fix visualization URL with hyphens in /viz ([product#229](https://github.com/CartoDB/product/issues/229))
* Show user info in Condensed Map Card ([CartoDB/product#247](https://github.com/CartoDB/product/issues/247))
* Show Feedback Popup ([CartoDB/product#222](https://github.com/CartoDB/product/issues/222))
* Deprecate Google+ API and use Google Sign-In instead ([CartoDB/product#196](https://github.com/CartoDB/product/issues/196))
* Set condensed maps view in Search page ([CartoDB/product#240](https://github.com/CartoDB/product/issues/240))

4.25.0 (2019-01-28)
-------------------

### NOTICES
* Limits V2: removing feature flag

### Features
* Ability to customize emails for the organization (#14627)
* Enable search box geocoder provider selection ([#14622](https://github.com/CartoDB/cartodb/pull/14622))

### Bug fixes / enhancements
* Add base URL to lockout redirection in static pages ([#14617](https://github.com/CartoDB/cartodb/pull/14617))
* Makes maps listing go faster with related tables (user db size cache issue, #14165)
* Do not redirect to /login by default when error is unknown in network interceptor ([#14616](https://github.com/CartoDB/cartodb/pull/14616))
* Update CARTO.js to v4.1.10
* Show zero when remaining quota is negative in metrics section of New Dashboard ([#14565](https://github.com/CartoDB/cartodb/issues/14565))
* New Lockout page for New Dashboard ([#14589](https://github.com/CartoDB/cartodb/issues/14589))
* Fix organization invitation styles ([#14629](https://github.com/CartoDB/cartodb/issues/14629))
* Fix typo in new dashboard search suggestions ([#14632](https://github.com/CartoDB/cartodb/pull/14632))
* Update navigation in all private pages ([#14312](https://github.com/CartoDB/cartodb/issues/14312))
* Send visited page event when is first time visiting New Dashboard ([product#209](https://github.com/CartoDB/product/issues/209))
* Revisit maps and datasets in empty and initial status in New Dashboard ([#14534](https://github.com/CartoDB/cartodb/issues/14534)) ([product#227](https://github.com/CartoDB/product/issues/227))

4.24.0 (2019-01-16)
-------------------

### NOTICES
* This release upgrades the CartoDB PostgreSQL extension to `0.24.1`. Run the following to have it available:
```shell
cd $(git rev-parse --show-toplevel)/lib/sql
sudo make install
```

=======
### Features
* You can configure your API key for the search bar, powered by TomTom, both in Editor and Builder, with `geocoder.tomtom.search_bar_api_key` (#14578).
* /viz endpoint supports ordering by :estimated_row_count and :privacy ([#14320](https://github.com/CartoDB/cartodb/issues/14320))
* /viz endpoint supports multiple ordering ([#14372](https://github.com/CartoDB/cartodb/issues/14372))
* /viz endpoint supports ordering by :favorited ([#14372](https://github.com/CartoDB/cartodb/issues/14372))
* /viz endpoint includes dependent visualizations and supports ordering by it ([#14424](https://github.com/CartoDB/cartodb/issues/14424))
* /viz endpoint orders search results by relevance ([#14325](https://github.com/CartoDB/cartodb/issues/14325))
* Add support for Node.js 10 and npm 6 (#14501).
* Password validation against common passwords & usernames (#14522)
* Added next billing cycle to /me endpoint ([#14463](https://github.com/CartoDB/cartodb/issues/14463))
* New Welcome module for New Dashboard (#14527)
* OAuth public release (WIP):
  * Sync `oauth_apps` with Central (#14493)
  * Include `oauth_app` and friends in user migrator (#14492)
* Added condensed map view in the New Dashboard [#14546](https://github.com/CartoDB/cartodb/issues/14546)
* Maps and Datasets page placeholders revisited for New Dashboard([#14534](https://github.com/CartoDB/cartodb/issues/14534))
* Open maps and datasets in new tab in New Dashboard ([#14565](https://github.com/CartoDB/cartodb/issues/14565))
* Remove mfa feature flag ([Central#2392](https://github.com/CartoDB/cartodb-central#2392))
* Add quota section in New Dashboard Homepage ([#14463](https://github.com/CartoDB/cartodb/issues/14463))
* Remove ordering from Settings dropdown in New Dashboard ([#14565](https://github.com/CartoDB/cartodb/issues/14565))
* Fix quota count in New Dashboard
* Navigate search results with up & down keys in New Dashboard ([#14507](https://github.com/CartoDB/cartodb/issues/14507)
* Selecting maps and datasets using SHIFT+Click in New Dashboard  ([#14545](https://github.com/CartoDB/cartodb/issues/14545))
* Changed Mapbox geocoder URL to permanent one for Editor. ([CARTO.js#2217](https://github.com/CartoDB/carto.js/issues/2217))
* Changed Mapbox geocoder URL to permanent one for Builder. ([CARTO.js#2217](https://github.com/CartoDB/carto.js/issues/2217))

### Bug fixes / enhancements
* Changed the Interal Engine public name for Enterprise engine to avoid issues with the clients (#14538)
* Improved performance in /viz endpoint when ordering by dependent visualizations ([#14508](https://github.com/CartoDB/cartodb/issues/14508))
* Avoid breaking the import if a timeout occurs during geometry fixing (ArcGIS import) (#14560)
* Revert favorited ordering for Datasets in New Dashboard (#14552)
* Fix visualization ordering by favorited with dependent visualizations (#14555)[https://github.com/CartoDB/cartodb/issues/14555]
* Rake to fix batch geocoder multypolygon type mismatch (dataservices-api#538)
* Fixes bug that didn't showed properly the New Dashboard's welcome module [#14570](https://github.com/CartoDB/cartodb/pull/14570)
* Fix dataset button in homepage new dashboard ([#14558](https://github.com/CartoDB/cartodb/issues/14558))
* Revisit footer in new dashboard ([#14470](https://github.com/CartoDB/cartodb/issues/14470))
* Added analyze to the calculation of pg_stats while importing the dataset ([#14603](https://github.com/CartoDB/cartodb/pull/14603))
* Improve password expiration flow ([#14502](https://github.com/CartoDB/cartodb/issues/14502))
* Fix Oauth redirection for subdomainless ([#14587](https://github.com/CartoDB/cartodb/issues/14587))
* Fix MFA screen customization for organizations ([#14563](https://github.com/CartoDB/cartodb/issues/14563))
* Show MFA screen after login when there is no session ([#14564](https://github.com/CartoDB/cartodb/issues/14564))
* Redirect to original URL after MFA verification ([#14566](https://github.com/CartoDB/cartodb/issues/14566))

4.23.4 (2018-12-18)
-------------------

### Features
* OAuth public release (WIP):
  * Sync `oauth_apps` with Central (#14493)

### Bug fixes / enhancements
* Fix baseurl in datasets public dashboard page (#14524)
* Request login when reactivating mfa from account (#14509)
* Added new security header X-Content-Type-Options (#14530)
* Fix OAuth consent screen when not logged in (#14518)

4.23.3 (2018-12-03)
-------------------

### Features
* Send org_admin parameter to central (#14483)

### Bug fixes / enhancements
* No request made to enable MFA #14505

4.23.2 (2018-11-27)
-------------------

### Bug fixes / enhancements
* Redirect to MFA setup to logged users from dashboard AJAX calls (#14435)
* MFA flash login errors (#14456)
* Do not intercept marker request (#14491)

4.23.1 (2018-11-26)
-------------------

### Features
* OAuth provider (WIP):
  * Revoke permissions when owner stops sharing you a dataset (#14472)

### Bug fixes / enhancements
* Fix visualization URLs avoiding quotes in the database schema ([#14475](https://github.com/CartoDB/cartodb/pull/14475))
* Disable user multifactor auths on skip ([#14447](https://github.com/CartoDB/cartodb/issues/14447))
* Fix pagination in visualization API when ordering by size ([#14476](https://github.com/CartoDB/cartodb/issues/14476))

4.23.0 (2018-11-19)
-------------------

### Features
* Lock login if too many failed attempts (#14334)
* OAuth provider (WIP):
  * UI improvements (#14389)
* MFA (WIP)
  * Login (#14336)
  * Admin management (#14347)
  * Support user migration (#14337)
  * User management (#14403)
  * Sync MFA status to central ([Central#2379](https://github.com/CartoDB/cartodb-central#2379))
  * Add support in EUMAPI (#14425)
* Change password functionality for Carto Gears (#14351)
* /viz endpoint supports ordering by :name and specifying an `order_direction` (#14316)

### Bug fixes / enhancements
* Protected maps now asks for password even if it goes through `public_map` endpoint (#14420)
* Sync new password resets fields with central (#14333)
* Can't add legend due to wrong CartoCSS (#14418)
* Fix parallel execution of some acceptance specs (#14391)
* Use shared partials for logo and button animation in session views
* Do not concatenate the schema if it's already defined while fetching overview tables #14414

4.22.2 (2018-11-05)
-------------------

### Features
* MFA (WIP)
  * Migration, models and controllers (#14335)
* Forgot password (#14333)
* OAuth provider (WIP):
  * Add scopes for accessing datasets (#14292)
* Improve dropping db role of an API key (#14307)

### Bug fixes / enhancements
* Scrollbar resized after notifications (#12953)
* Fix encoding corner case with ICU for some CSV files (https://github.com/CartoDB/support/issues/1808)
* Add timeout for AR and Sequel connections (#13266)
* Fix Feedback modal on Enter (https://github.com/CartoDB/support/issues/1804)
* Apply code style for "Layer hidden" notification in advanced mode (#13355)
* Fixed varnish validation for http function due a regexp problem (https://github.com/CartoDB/support/issues/1727)
* Fix input widths (#13453)
* Update tags style (#13756)
* Add more formats to the base datasource class to be used by for example Box connector (#10183)
* Fix sharing datasets with groups (https://github.com/CartoDB/onpremises/issues/637)
* Update some old vulnerable dependencies (#14368)
* Fix shrinkwrap generation through a carto.js release (https://github.com/CartoDB/cartodb/pull/14369)
* Revert tag style, add color to privacy modal (#13756)

4.22.1 (2018-10-18)
-------------------

### NOTICES
* Ensuring right `search_path` for non organization `publicuser`

### Features
* Improve dropping db role of an API key (#14307)

### Bug fixes / enhancements
* Add `remove_overview_tables` rake
* Allowing views in API Keys (#14309)
* Redirect locked users to /lockout page (#14310)

4.22.0 (2018-10-04)
-------------------

### Features
* Support forcing password change upon first login in EUMAPI (#14295)

### Bug fixes / enhancements
* Correctly set the logger level, instead of log rotation (#14302)
* Update legends for heatmap aggregation when the colors change from the style editor (#13763)
* Update legends for color ranges when the color list order changes

4.21.0 (2018-09-24)
-------------------

### NOTICES
* Dataservices-API has changed and now it needs permissions to execute DS queries for each API key. You can update the existing users running this rake: `bundle exec rake carto:api_key:create_api_key_grants`
* This release upgrades the CartoDB PostgreSQL extension to `0.24.0`. Run the following to have it available:
```shell
cd $(git rev-parse --show-toplevel)/lib/sql
sudo make install
```

### Features
- Add dataservices permissions in Auth API (#14263)
- OAuth provider (WIP):
  - Add scopes for accessing dataservices (#14276)
  - Add scopes for accessing user public profile (#14279)

### Bug fixes / enhancements
* Fix legacy functions in the data mover that doesn't process multiword type functions
* Fix `image_tag` function to include the assets versioning (#14266)
* Fix broken tests due to time stubbing (#14287)
* Remove username from Postgres roles
* Style password change form with organization colors (#14296)
* Add `create_api_key_grants` rake (https://github.com/CartoDB/support/issues/1748)

4.20.2 (2018-09-10)
-------------------

### Features
* OAuth provider: You can authenticate an external app against CARTO using OAuth, and get an API Key for the authorized user (WIP)
  * Add new design for OAuth consent screen (#14237)
  * Limit the number of simultaneous refersh tokens (#14243)
  * Silent flow (#14244)

### Bug fixes / enhancements
* Api keys endpoint maintains the following order: master, default and regular (https://github.com/CartoDB/cartodb/pull/14257)
* Fix tooltips not hiding in size & color controls in mobile (https://github.com/CartoDB/cartodb/issues/14098)
* Add another error to OOM detection in imports (#14259)
* Don't reset connections on source database when updating database_host (https://github.com/CartoDB/cartodb-platform/issues/4783)

4.20.1 (2018-08-24)
-------------------

### Features
* OAuth provider: You can authenticate an external app against CARTO using OAuth, and get an API Key for the authorized user (WIP)
  * Redirect back to OAuth flow after login (#14236)
  * Implicit flow (#14167)
  * Allow restricting application to only a set of organizations (#14180)

### Bug fixes / enhancements
* Update content of twitter:site meta tag (https://github.com/CartoDB/cartodb/issues/14264)
* Fix lots of requests triggered in datasets view (https://github.com/CartoDB/cartodb/issues/14190)
* Hide like button if the user is not logged in (https://github.com/CartoDB/cartodb/issues/13098)
* Fix OAuth login for the organizations (#14238)
* Better OAuth error management (#14214)

4.20.0 (2018-08-13)
-------------------

### NOTICES
* This release upgrades the CartoDB PostgreSQL extension to `0.23.2`. Run the following to have it available:
```shell
cd $(git rev-parse --show-toplevel)/lib/sql
sudo make install
```

* New database configuration is required. Please add `prepared_statements: false` to `database.yml`
(check `database.yml.sample` for an example)

* This release introduces a new API Key system. In order to migrate existing users, run the following command:
`bundle exec rake carto:api_key:create_default`

### Features
* Update CARTO logo in maps (https://github.com/CartoDB/design/issues/1324)
* Password expiration ([Central#2226](https://github.com/CartoDB/cartodb-central#2226))
* New rake to fix inconsistent permissions (`bundle exec rake cartodb:permissions:fix_permission_acl`)
* OAuth provider: You can authenticate an external app against CARTO using OAuth, and get an API Key for the authorized user (WIP)
  * Data model (#14163)
  * Consent screen backend (#14164)
  * New endpoint for user information, `/api/v4/me` (#14229)
  * Access_token expiration and refresh_tokens (#14230)
* Support FileGeodatabase format uploads (https://github.com/CartoDB/cartodb/issues/10730)

### Bug fixes / enhancement
* Use a SVG icon instead of a simple `+` sign in the `Add {layer|analysis|widget}` buttons. (https://github.com/CartoDB/cartodb/issues/#14234)
* Remove options from empty layers' contextual menu (#13451)
* Add link to `datasets/shared/locked` (https://github.com/CartoDB/cartodb/issues/14188)
* Don't show "- Rows" instead of 0 if the dataset has been updated recently (https://github.com/CartoDB/cartodb/pull/14228)
* Use input instead of select for `job_profile` (https://github.com/CartoDB/cartodb/pull/14227)
* Don't show "- Rows" instead of 0 if the dataset has been updated recently ()
* Fix panning and interactivity in Safari (https://github.com/CartoDB/cartodb/issues/14115)
* Add a warning when the user is about to delete multiple analyses at once (https://github.com/CartoDB/cartodb/pull/14222)
* Fix problems when searching datasets for API Keys management (https://github.com/CartoDB/support/issues/1678)
* Fix histogram tooltips not being updated after column change (https://github.com/CartoDB/cartodb/issues/14155)
* Update googlemaps api version to v3.32 (https://github.com/CartoDB/cartodb/issues/13902)
* Fix wrong position for color dialog and sticky popups when styling analysis (https://github.com/CartoDB/support/issues/1649 and https://github.com/CartoDB/support/issues/1673)
* Fix incorrect metric event styling a layer (https://github.com/CartoDB/cartodb/issues/14183)
* Fix legend for style by boolean field (https://github.com/CartoDB/support/issues/1647)
* Fix disconnect from external data sources (gdrive, box and dropbox) for organization users (https://github.com/CartoDB/support/issues/1671)
* Fix broken data tab when analyses or custom SQL are present (https://github.com/CartoDB/cartodb/issues/14169)
* Don't render geometry columns that are not the_geom (https://github.com/CartoDB/support/issues/1404)
* Use setView instead of flyTo to improve zoom transitions (https://github.com/CartoDB/carto.js/pull/2178)
* Fix torque layers when filter analysis is added (https://github.com/CartoDB/support/issues/1038)
* Copyright symbol not appearing on exported image (https://github.com/CartoDB/cartodb/issues/13411)
* Keep selected popup tab after fetch (https://github.com/CartoDB/support/issues/1396)
* Fix HTML templates for Hover popups (https://github.com/CartoDB/cartodb/issues/11284)
* Twitter import only if enabled and with user/org configuration (https://github.com/CartoDB/support/issues/1612).
* Fix category name overflow when styling by value (https://github.com/CartoDB/support/issues/1644)
* Improve input image when color changes (https://github.com/CartoDB/cartodb/issues/11326)
* Fix pagination buttons style (https://github.com/CartoDB/cartodb/issues/13456)
* Fix edit month in table cell (https://github.com/CartoDB/support/issues/1352)
* Fix wrong style after creating a feature (https://github.com/CartoDB/cartodb/issues/13680)
* Map instantiation is now debounced thanks to Carto.js 4.0.12 (https://github.com/CartoDB/cartodb/pull/14142)
* Fix bug computing next page in datasets (https://github.com/CartoDB/cartodb/issues/14138)
* Move to the last page after adding a row (https://github.com/CartoDB/cartodb/issues/10720)
* Fix pagination after deleting a row (https://github.com/CartoDB/cartodb/issues/9868)
* Fix Widget view click (https://github.com/CartoDB/cartodb/issues/13409)
* Improve style for Analysis modal blocks (https://github.com/CartoDB/cartodb/issues/13361)
* Use ellipsis for widgets title (https://github.com/CartoDB/cartodb/issues/13332)
* Fix dark menu links (https://github.com/CartoDB/cartodb/issues/11257)
* Fix legend editor margin (https://github.com/CartoDB/cartodb/issues/13338)
* Fix slider width for point/stroke size (https://github.com/CartoDB/support/issues/1641)
* Fix gradient legends margin (https://github.com/CartoDB/support/issues/1640)
* Fix drag new layer from Torque source (https://github.com/CartoDB/support/issues/1625)
* Fix custom carousel item select event (https://github.com/CartoDB/cartodb/issues/14070)
* Fix gaps in tiles (https://github.com/CartoDB/support/issues/1362)
* Fix style issues (https://github.com/CartoDB/cartodb/pull/14123)
* Fix SVG spinner animations (https://github.com/CartoDB/cartodb/issues/14105)
* Fix Dataset header dropdown (https://github.com/CartoDB/support/issues/1614)
* Remove unneeded space in collapsed legends view (https://github.com/CartoDB/cartodb/issues/14091)
* Validate Visualization type (#13841)
* Do not assume that if min and max are equal we come from a fixed value (https://github.com/CartoDB/carto.js/issues/2146)
* Add mode to raise max-height when widgets are not present (https://github.com/CartoDB/carto.js/issues/2146)
* Add schema to column_names (#14121)
* Deprecate Twitter connector in `add dataset` modal (https://github.com/CartoDB/cartodb/issues/14081)
* Set new message on privacy warning modal when new privacy is LINK (https://github.com/CartoDB/cartodb/issues/14030)
* Improve size & color UI when styling layers (https://github.com/CartoDB/product/issues/54)
* Show Organization notifications in static pages (https://github.com/CartoDB/cartodb/issues/14089)
* Log user destruction errors to Rollbar (#13745)
* Fix wrong margins in the layer selector when the top layer has a bubble legend (https://github.com/CartoDB/support/issues/1566)
* Fix error when styling points by value in animated aggregation style (https://github.com/CartoDB/cartodb/issues/14085)
* Show errors coming from QueryRowsCollection in Dataset/Builder (https://github.com/CartoDB/cartodb/issues/14066)
* Export JPG image as JPEG format instead of PNG (https://github.com/CartoDB/cartodb/issues/14042)
* Redirect to login or fix URL if trying to access another user private pages (https://github.com/CartoDB/cartodb/pull/14013)
* Add Google Tag Manager to Static Pages (https://github.com/CartoDB/cartodb/issues/14029)
* Sync ArcGIS datasets with null values in ogc_fid or gid (CartoDB/support/issues/1460)
* List organization admin users in your Organisation settings (https://github.com/CartoDB/support/issues/1583)
* Send `Visited Private Page` event from Dashboard (#14041), update user model (#14084) and db size cache (#14102)
* Fix Mapviews don't appear on bar chart rollover (https://github.com/CartoDB/support/issues/1573)
* Fix Broken CTA in the 'Connect Dataset' modal (https://github.com/CartoDB/cartodb/issues/14036)
* Fix `Create map` from data library https://github.com/CartoDB/cartodb/issues/14020#event-1655755501
* Fix wrong requests because of bad png tile urls generation (https://github.com/CartoDB/cartodb/pull/14000)
* Fix migration of users with invalid search_tweets.data_import_id (#13904)
* Import / export synchronization oauths and connector configurations (#14003)
* Retain backwards compatibility with exports without client applications(#14083)
* Redirect organization users in static pages (https://github.com/CartoDB/cartodb/pull/14009)
* Update extension to 0.22.1 to fix problems granting permissions to tables with sequences (cartodb-postgresql#330)
* Update extension to 0.22.2 to fix hyphenates usernames (cartodb-postgresql#331)
* Update extension to 0.23.0 to add a new helper function `_CDB_Table_Exists(table_name_with_optional_schema TEXT)` (cartodb-postgresql#332)
* Added format option to load datasets into the data library (#14216)
* Log Resque errors (#14116)
* Avoid creating double indices on sync (#14157)
* Do not crash when checking nil password (#14099)
* Do not crash when saving WMS layers with long metadata (Suppoer#1643)
* Remove Auth API FF, enable it by default (#13857)
* Fix table sharing from users with hyphens in their name (quoting) (support#1635)
* Datasets search now is working as intendended with special characters like "_"
* User mover does not export user metadata if org metadata is not exported
* Fail fast instead of locking dashboard / user data size calculation on table deletion (#12829)
* Update odbc_fdw extension to `0.3.0`
* Triggering ghost tables and common data when visiting the dashboard (#14010)
* Now you can limit the amount of memory used by ogr2ogr adding the `memory_limit` option in bytes to the ogr2ogr section of the `app_config.yml`

### Internals
* Re-enable sourcemaps in production, they were broken since the move to webpack v4 (https://github.com/CartoDB/cartodb/pull/14150)
* Add `internal-carto.js` to transpilation process in Webpack (https://github.com/CartoDB/cartodb/pull/14117)
* Create a new JS bundle for Lockout page (https://github.com/CartoDB/cartodb/issues/14019)
* Update to Webpack 4, move CSS processing from Grunt to Webpack (https://github.com/CartoDB/cartodb/pull/14033)


4.12.x (2018-05-24)
---

### NOTICE
OnPremises 2.2.0 was closed in tag 4.11.113, pointing to this commit: [a236036](https://github.com/CartoDB/cartodb/commit/a2360360bdd42706e5fb57e3729811c41e292c5e)


### NOTICE
This release upgrades the CartoDB PostgreSQL extension to `0.22.0`. Run the following to have it available:
```shell
cd $(git rev-parse --show-toplevel)/lib/sql
sudo make install
```

This release changes the way Google ouath login works. If you are using it, you need to add the client_secret
to the oauth.google_plus section of the configuration file.

### NOTICE
This releases updates the database connections, and `database.yml` needs to be updated to reflect it. The adapter
should be replaced from `postgres` to `postgresql`. See `database.yml.sample` for an example.

This upgrade changes the configuration format of basemaps. You must replace all `url` keys for `urlTemplate`. It is
recommended that you replace the `basemaps` section completely, since this release also adds supports for high
resolution maps, which have added `urlTemplate2x` keys to the configuration.

You can then run `bundle exec rake carto:db:sync_basemaps_from_app_config` to synchronize existing layers.
### NOTICE

This upgrade changes AWS gem version. Now you must specify `region` within your AWS configurations. Check `app_config.yml.sample`.

### Features
* Export GPKG files (CartoDB/support#1220)
* Show migrated public pages (/me, /maps, /datasets) for all builder users (#14039)
* Allow users to edit all their information in Profile (#13793)
* Ask for password confirmation when updating organization or user settings (#13795)
* Public dataset migration (#13803)
* Organization page migration (#13742)
* Public pages migration (#13742)
* Profile page migration (#13726)
* Add more profile data fields ([Central#2184](https://github.com/CartoDB/cartodb-central#2184))
* Add password expiration for orgs ([Central#2225](https://github.com/CartoDB/cartodb-central#2225))
* Signup and confirmation pages migration (#13641)
* Improve API keys view for the new Auth API (#13477)
* Add search to widgets in mobile views (#13658)
* Update multiple widgets at once (#13596)
* Adjust widget styles in embed maps mobile view (#13487)
* Add customizable color ramps for qualitative attributes ([#9002](https://github.com/CartoDB/cartodb/issues/9002))
* checks username length on organization signup ([#13561](https://github.com/CartoDB/cartodb/pull/13561))
* Add cookie privacy setting to embed via queryString parameter ([#13510](https://github.com/CartoDB/cartodb/pull/13510))
* User feed migration
* Add legends to mobile view in embed maps (#13417)
* Unplug pluggable frontends (#13446)
* Replace Mapzen geocoding with Mapbox (#13450)
* Disable following analysis steps (#13311)
* Enable deleting geometry anchors in edit mode (#11341)
* Fix marker bugs (#1207)
* Improve copies for analyses, move MORE INFO link (#13384)
* Add routing to widgets
* When editing a widget, disable the other ones (#13374)
* Back button support (#13115)
* Embed static view (#12779)
* Add tooltip on Builder actions (#13102)
* Add Grunt tasks to generate static files (#13130)
* Do not request image files in Dropbox/Google sync (CartoDB/support#1192, CartoDB/support#1436)
* Improve geocoding onboarding (#13046)
* Editor static view (#13043)
* Add trial notification in static views (#13079)
* Account static view (#12749)
* Force UTF-8 encoding in the Compass task
* Trigger error when interactivity request fails (#13093)
* Add interactivity error infobox (#13027)
* Add limits for torque (#13085)
* Add limits for vector tiles (#13026)
* Stop adding legends automatically when styling a layer (#13052)
* Improved cartography values for line & point size (CartoDB/support#1092 CartoDB/support#1089)
* Added support for TomTom as services provider (CartoDB/dataservices-api/issues/492)
* Remove forget confirmation from onboarding tour (#13039)
* Add onboarding FS events (#13004)
* Map: rearrange layer options in layers list (#13006)
* Style: Rename "none" aggregation to "points" (#13005)
* Clean assets script
* Improve error on widgets (CartoDB/deep-insights.js#574)
* Add pagination support in data imports listing in superadmin (#12938).
* Profile static view (#12704)
* Add FullStory (if available) in user dashboard
* Change default style for polygon, point and line geometries (design#983)
* Unify scrollbars style (#12184)
* Add endpoint for current user account deletion (#12841)
* Add contextual help to Analysis UI (#11907)
* Add endpoints for updating user account & profile details (#12726)
* Add /api/v3/me endpoint (#12599, #12790, #12771)
* Add assets version column in user model (#12676)
* Dashboard static view (#12680)
* Vector rendering improvements #12722.
* Enable georeferencer for database connectors (#12566)
* Enable other hosts apart from account host to include CORS headers via the cors_enabled_hosts param in app_config.yml (#12685)
* Add tooltips to show bucket data in time-series (#11650)
* Improve legend items management (#12650)
* Avoid multiple time-series by filtering the carousel options (#12395)
* Add privacy button behavior for shared datasets (#11342)
* Use add/replace notificat
ion for time-series (#12670)
* Fix icons in category legends (#11630)
* Sidebar UI tweaks (#12479)
* Add carto-node client library (#12677)
* Migrate rails views to js templates (#12763)
* Improving affordance of Delete icon (#12531)
* Change select "attribute" placeholders (#12498)
* Add pointer cursor to the sliders (#12499)
* Fixed a bug that would break the bubble legend on IE11 (#support/891)
* Open visualization endpoint to anonymous users, returning related_canonical_visualizations with visible ones, and related_canonical_visualizations_count with the full count (#12908)
* Support for SAML signed logout requests (#12355)
* Provide a way to display broken layers pointing to non existent nodes (#12541)
* Provide CartoCSS attribute within layer info in vizjson v3 (CartoDB/support#858)
* Support for nested properties in CartoCSS (#12411)
* Tooling to add and remove arbitrary datasets to Data Library (#13666, #13667)
* New loading button styles (#12132)
* [WIP] Export/import organization/user metadata to allow user migration (#12271, #12304, #12323, #12588, #12380, #12510)
* Start using ::outline symbolizer for polygon stroke (#12412)
* New force param in EUMAPI organization users destroy operation to force deletion even with unregistered tables (#11654)
* Removed the usage of the `organizations_admin` feature flag (#12131)
* Show number of selected items in Time-Series widgets (#12179)
* Show ranges in time series widget selection (#12291)
* Bump Webpack version (#12392)
* Start using ::outline symbolizer for polygon stroke (#12412)
* Explicit error on password protected visualization requests (#13123)
* New force param in EUMAPI organization users destroy operation to force deletion even with unregistered tables (#11654).
* Removed the usage of the `organizations_admin` feature flag (#12131)
* Time-series widgets aggregated by time (#12324)
* Show number of selected items in Time-Series widgets (#12179).
* Add source to widgets (#12369).
* Show ranges in time series widget selection (#12291)
* Bump Webpack version (#12392).
* Session expiration (Central #2224). Configure in `app_config.yml` -> `passwords` -> `expiration_in_d`
* Session expiration (Central #2224). Configure in `app_config.yml` -> `passwords` -> `expiration_in_s`
* Password expiration ([Central#2226](https://github.com/CartoDB/cartodb-central#2226))
* New user render timeouts and propagation of timeout values to Redis (#12425)
* Included aggregation tables configuration change to the user migrator (#13883)
* New Tooling to gather Dataservices' provider metrics (#13710)
* Default basemap is used for all Builder maps regardless of dataset basemap (#12700)
* The selection window on a histogram widget can be dragged (#12180)
* Now the max_layers property only counts data layers to avoid problems with basemaps (#13898)
* Visualization endpoint now returns related canonical visualizations under demand (#12910)
* Move playback on animated time series by clicking on it (#12180)
* Fix bug in the way we calculate stats for the mapviews (#13911)
* Move play/pause button to besides the time series (#12387)
* Updates Dataservices API client default version to `0.18.0` (#12466)
* Time-series: add timezone selector to timeseries histogram (#12464)
* Updates Dataservices API client default version to `0.19.0` (#12494)
* Don't display slider if there's only one value (#bigmetadata/202)
* Mustache conditionals support improved in popups (#support/763)
* Updates Dataservices API client default version to `0.20.0` (#12633)
* Remove data-observatory-multiple-measures feature flag (#304)
* Improve legends error (cartodb.js#1758)
* Updates Dataservices API client default version to `0.22.0`
* Improve user migrator
* Support high-resolution basemaps (#12845)
* Now is possible to use wildcard character (\*) in the whitelist emails for organization signups (#12991)
* Integrated the internal release of carto.js (https://github.com/CartoDB/cartodb.js/issues/1855)
* User accounts in locked state returns 404 for resources like maps or visualizations and redirection for private endpoints (#13030)
* Force use a different password when password change ([Central#2223](https://github.com/CartoDB/cartodb-central#2223))
* Limits V2
  * Add rate limits for sql_copy ([CartoDB-platform#4394](https://github.com/CartoDB/cartodb-platform/issues/4394))
  * Add rate limits persistence (#13626)
  * Include rate limits in user migration (#13712)
  * Remove rate limits on user deletion (#13657)
  * Sync price plans and rate limits (#13660)
  * Add rate limit index to account_types (#13664)
  * Add account_type FK in users table (#13571)
  * Create account_types and default rate limits (#13572)
* Auth API
  * Keys creation (#13170)
  * Create master API key on user creation (#13172)
  * Create default public API key on user creation (#13471)
  * Keys destruction (#13171)
  * Organization concerns (#13511)
  * Token regeneration (#13321)
  * Keys listing (#13327)
  * Disable keys for locked users (#13560)
  * Header authentication (#13329)
  * Keep API Key permissions up to date when tables change (#13333)
  * Delete API keys on user deletion (#13470)
  * Inherit from public user for API key permissions (#13464, #13550)
  * Sync master key with user model (#13540)
  * Regenerate all user/orgs api keys (#13586)
  * Do not allow empty api list in Auth API [#13291](https://github.com/CartoDB/cartodb/issues/13291)
  * Conventions (#13491)
  * API Keys are exported and imported (#13346)
  * 500 error when mixing auth mechanisms (#13723)
* Added new endpoint for database management tool for validation and some changes in the `get_databases_info` one (#13257)
* Added lockout page to show when a user is locked up due to expiration of the trial (#13100)
* Add decade aggregation to time series widget [Support #1071](https://github.com/CartoDB/support/issues/1071)
* Updates Dataservices API client default version to `0.23.0`
* Added Mapbox services providers (#cartodb-platform/3835)
* Add support for queryparams and special permissions in Auth API (#13597)
* Add rakes for generating default API Keys (#13595)
* Use carto.js v4.0.0-beta.13
* Change Mapbox modal (#1265)
* Hide legend title and header if not enabled (https://github.com/CartoDB/support/issues/1349)

### Bug fixes / enhancements
* Fix create map / add layer button being disabled (#14061)
* Fix layers list item border color (https://github.com/CartoDB/cartodb/pull/14002)
* Remove padding to delete button in analyses (https://github.com/CartoDB/cartodb/pull/14001)
* Fix wrong requests because of bad png tile urls generation (https://github.com/CartoDB/cartodb/pull/14000)
* Fix copy on Twitter connector deprecation
* Properly destroys and sets cartodb_base_url cookie (https://github.com/CartoDB/cartodb/pull/14064)
* Fix apply button loading state for queries that alter the data (https://github.com/CartoDB/cartodb/pull/13979)
* Fix synchronization IDs in migrations (CartoDB/support/issues/1603)
* Avoid parsing errors twice when saving CartoCSS (https://github.com/CartoDB/cartodb/pull/13986)
* Show "Select points in polygons" analysis only for polygons (https://github.com/CartoDB/cartodb/pull/13982)
* Allow only numeric values in latitude/longitude select in georeference analysis (https://github.com/CartoDB/cartodb/pull/13974)
* Fix dataset name overflow in widgets (https://github.com/CartoDB/cartodb/pull/13972)
* Fix the public table view for non-migrated-users  (#13969)
* Fix widgets not updating (https://github.com/CartoDB/cartodb/pull/13971)
* Fix legend paddings/margins (https://github.com/CartoDB/cartodb/pull/13966)
* Fix the name of the bundle for public_Table on production (#13965)
* Fix how to decide which public_table version to show (#13694)
* GTM DataLayer Tweaks (https://github.com/CartoDB/cartodb/pull/13961)
* Setup Google Tag Manager (https://github.com/CartoDB/cartodb/pull/13946)
* Differentiate public schema from "public" user's schema (https://github.com/CartoDB/cartodb/pull/13987)
* Fix an error on always activated notifications at account and profile pages (#13691)
* Fix legend margin (https://github.com/CartoDB/support/issues/1510)
* Fix overviews permissions when sharing tables or using auth API keys (https://github.com/CartoDB/support/issues/1415)
* Update torque to fix google maps bug (https://github.com/CartoDB/support/issues/1498)
* Upgrade @carto/zera to avoid bugs related with fractional zoom levels (https://github.com/CartoDB/cartodb-platform/issues/4314)
* Fix short-names analyses translations (#13828)
* Escape prefixes and suffixes in formula widgets (#13895)
* Redirect to widgets list after deleting a widget (#13485)
* Keep widgets list order (#13773)
* Change analyses short names (#13828)
* Fix popups with just images on IE and Edge (#13808)
* Enrich downloaded layer event (#13391)
* Includes a rake tasks to export/import named maps for users (#13927)
* Handle redirection when adding widgets (https://github.com/CartoDB/support/issues/1464)
* Add overlap option in animated heatmap style form (https://github.com/CartoDB/support/issues/1331)
* Fix bottom extra space in legends (#13765)
* Fix Heatmap legend does not update after style changes (https://github.com/CartoDB/cartodb/issues/13763)
* Includes a rake tast to destroy duplicated overlays that should be unique.
* Disable Twitter Connector and show Warning for users without their own credentials (https://github.com/CartoDB/product/issues/49)
* Fix Category Widgets height on smaller screens (https://github.com/CartoDB/cartodb/issues/13829)
* Consistent margins in Auth API UI
* Skip importing legacy functions (https://github.com/CartoDB/cartodb/issues/13677)
* Embed improvements (https://github.com/CartoDB/cartodb/issues/13765)
* FullStory tweaks (https://github.com/CartoDB/cartodb/pull/13753)
* Allows imports of synchronizations without a log
* Fix embed maps on firefox, which caused displaced popups as well (https://github.com/CartoDB/support/issues/1419)
* Fix a case where the layer selector was displaying incorrectly (https://github.com/CartoDB/support/issues/1430)
* Add auth_github_enabled ([Central#2154](https://github.com/CartoDB/cartodb-central/issues/2154))
* Update charlock_holmes to 0.7.6 (ICU compatibility)
* Skip canonical viz with missing tables from metadata export
* Fix dialog footer in some modals (CartoDB/onpremises/issues/507)
* Fix alignment for formula widget edit form (CartoDB/onpremises/issues/511)
* Fix copies order in html legends editor (CartoDB/onpremises/issues/504)
* Fix export view template showing glitch in IE and Firefox(CartoDB/onpremises/issues/484)
* Show layer selector in the legends tab on small breakpoint (https://github.com/CartoDB/support/issues/1412)
* Allows import of an exported dataset with external data imports without a syncronization (#13766)
* Fix users with unexisting physical tables on export ([#13721](https://github.com/CartoDB/cartodb/issues/13721))
* Fix saving hdpi url templates when not needed (#13746)
* Fix analysis modal alignment and password form (CartoDB/onpremises/issues/520)
* Do not add new notifications if notification content already exists (#13407)
* Fix wrong dataset header width in chrome (https://github.com/CartoDB/support/issues/1398)
* Fix widgets size in Builder (#13682)
* Fix SQL function analysis error with dragged source (https://github.com/CartoDB/cartodb/pull/13732)
* Fix histogram widgets collapsing (#13705)
* Use Promises in query models to handle async states (#13478)
* Fix "Add new analysis" button in IE (CartoDB/onpremises/issues/485)
* Fix button when addign new widgets (CartoDB/onpremises/issues/513)
* Fix private map view styles in IE (CartoDB/onpremises/issues/499)
* Fix privacy modal styles in IE (CartoDB/onpremises/issues/505)
* Fix auto align in tooltips in IE (CartoDB/onpremises/issues/519)
* Fix arrows styles for IE in dataset view (CartoDB/onpremises/issues/521)
* Add loading state to API Keys form button
* Fix widgets disabled state (#13707)
* Fix embed maps footer when there is no toolbar (#13704)
* Add helper text to mapbox basemap view (#13699)
* Fix legends not refreshing when moving layers (#13696)
* Fix broken api keys for organization users
* Fix multiple bugs in widgets (#13686)
* Fix category widget search on Android (https://github.com/CartoDB/support/issues/1074)
* Improve pagination in category widgets (https://github.com/CartoDB/support/issues/1161)
* Fix onboardings in layer content views (#13674)
* Safe access to vis map for old visualizations without maps (#13665)
* Don't fetch rows when fetching columns for analyses (#13654)
* Fix pagination style for category widgets (https://github.com/CartoDB/support/issues/1161)
* Add isSourceType false by default to select-view (#13655)
* Parameter text for Filter by Column Value Analysis Method (https://github.com/CartoDB/design/issues/1125)
* Fix `Fix them` redirection bug (https://github.com/CartoDB/cartodb/issues/9974)
* Fix bad SQL behavior: infinite loop and blank panels (https://github.com/CartoDB/cartodb/issues/13603)
* Several style fixes in IE11 (https://github.com/CartoDB/cartodb/issues/13635)
* Fix table head style in IE11 (https://github.com/CartoDB/cartodb/issues/13606)
* Allows a viewer user to sign up to an org with no unassigned quota ([#1341](https://github.com/CartoDB/support/issues/1341))
* Freeze required Google Maps script to v3.30 (https://github.com/CartoDB/cartodb/pull/13562)
* Add `shield-placement-keyword` CartoCSS property (#13612)
* Fix icons in custom html legends (#13600)
* Rename 'cartodb3' to 'builder'
* Make legends collapsable (#13531)
* Add marker size to layer cartocss props to reinstantiate torque map (#13590)
* Fix select geometries dropdown in JOIN analysis ([Support#1281](https://github.com/CartoDB/support/issues/1281))
* Fix IE11 Drag&Drop ([Support#876](https://github.com/CartoDB/support/issues/876))
* Add new attributes to events ([Central#1997](https://github.com/CartoDB/cartodb-central#1997))
* Removed references to analytics JS files in static pages (#13543)
* Add titles (and description) to embeds in mobile viewports (#13517)
* Support several versions of pg_dump and pg_restore binaries (CartoDB/cartodb-central#2073)
* User feed renders google maps properly when user has it enabled
* New Synchronization records can enter error state preventing future synchronizations (#13435)
* Prevent destroying modals with `keepOpenOnRouteChange` property enabled on Builder when route changes. ([Support#1293](https://github.com/CartoDB/support/issues/1293))
* Import gpkg without coordinate system. ([Support#1303](https://github.com/CartoDB/support/issues/1303))
* Improved bundling aliases
* User migrator deletes import log after importing failure (#13542)
* Remove Tangram's vector rendering support in Builder embeds ([#13461](https://github.com/CartoDB/cartodb/issues/13461))
* Remove Tangram references (#13461)
* Restore translation keys to static pages (#13492)
* Show signup errors when org-user signup fails [Support#1312](https://github.com/CartoDB/support/issues/1312)
* Fix wrong user quotas [Support#1304](https://github.com/CartoDB/support/issues/1304)
* Fix Embed map disappears when reducing size of screen [Support#1299](https://github.com/CartoDB/support/issues/1299)
* Avoid sending multiple notifications for stuck imports (#11833)
* Support statement timeout in ArcGIS connector [Support#1287](https://github.com/CartoDB/support/issues/1287)
* Support invalid ArcGIS layer [Support#1291](https://github.com/CartoDB/support/issues/1291)
* Update Leaflet to version 1.3.1
* Remove tangram by updating cartodb.js version
* Remove `To column` option from `Connect with lines` analysis [#12955](https://github.com/CartoDB/cartodb/issues/12955)
* Don't disable delete analysis button if layer already has some [Support#1283](https://github.com/CartoDB/support/issues/1283)
* Submit form with Enter key in the Add layer modal > Connect dataset tab (#13441)
* Add routing to analyses nodes (#13364)
* Fix organization signup page not working on subdomainless #13012
* Deletes redis metadata after org destruction (#13687)
* Fix publish modal in settings view (#13418)
* Improve onboarding for when user adds an empty layer (#11876)
* Don't show the publish modal when the user clicks on the privacy button (#13366)
* Add auth tokens to dependent visualizations (#13394)
* Logged in organization user gets redirected to dashboard [#11832](https://github.com/CartoDB/cartodb/issues/11832)
* Redirect to login from static pages if there is no user (#13277)
* Add support for collision_strategy=overwrite when creating a dataset from a query (#13139)
* Fix popup content in time series widget (#1269)
* Update pop up when applying HTML changes (#1263)
* Rollback make new widgets appear on top (#13244)
* Show quota alert in georeference city analysis (#13354)
* Show layer name in delete layer modal (#13363)
* Show tooltips only if the target element is visible (#12098)
* Consolidate DeepInsight components in Builder (#13271)
* Unify tooltip style (#13194)
* Correctly log ogr2ogr generic errors (#13401)
* Remove card's hover state when hovering the dataset/node inside (#13316)
* Data Observatory analysis is not working (CartoDB/support#1239)
* Use zoomToData only if the layer is created from a dataset (#13309)
* Rename Georeference to Geocode (#13315)
* Use new header design in export as image view (#13306)
* Don't show tooltip if analysis is selected or is new (#13299)
* Fix logo alignment in small viewports (#13302)
* Nothing else should be interactive when a dropdown is open (#13283)
* Fix hover in widgets (#13293)
* Fix autostyling with category widget (using a numeric field) [Support #611](https://github.com/CartoDB/support/issues/611)
* Fix grammar errors in analysis description (#13258)
* Fix hubspot dependency for static views (#13261)
* Fix icons not showing (#13276)
* Redesign add buttons (#13215)
* Onboarding: center bounding box automatically when new datasets are added (#13245)
* Stop building static pages on dev (#13188)
* Documentation, changed some UI text from the onboarding animation (collaboration project with Design to change terminology)
* Fix like buttons (#13231)
* Wayfinding: fix dialog footer (#13223)
* Wayfinding: widget view (#13202)
* Wayfinding: layer list (#13208)
* Wayfinding: edit feature (#13203)
* Wayfinding: modals breadcrumbs (#13205)
* Improve wayfinding in layer view (#13185)
* Fix bug in add layer showing my datasets disabled (CartoDB/support#1184)
* Grunt: Run carto-node before browserify (#13187)
* Enable data tab if layer needs geocoding
* Fix bug in redirection after analysis is completed (CartoDB/support#1183)
* Hide Salesforce Connector Form (CartoDB/tech-ops#324)
* Disable "Your datasets" tab and add tooltip if user doesn't have any datasets (#13104)
* Fix Mapcard preview in Public Map (#13166)
* Add hover state to nav tabs (#13158)
* Change how redirection works after a successful import (CartoDB/support#1128)
* Fix organization templates generation (#13150)
* Fix dataset export modal (CartoDB/support#1168)
* Add hover to UI Elements (#13074)
* By value color input filters columns of type date (#7873)
* Fixes image export in editor (#13089)
* Fix incorrect "back to dashboard" link in dataset view (#13111)
* Improve the discoverability of the table view switch (#13050)
* Change Basemap layer style (#13091)
* Rename point/polygon count to feature count (#13066)
* Fix broken table (similar to ghost table) when renaming a visualization, only changing capitalization (#13421)
* Upgrade cartodb extension to 0.20.0 (#13065)
* Fix for torque category legends (CartoDB/support#1120)
* Upgrade cartodb extension to 0.20.0 (#13065)
* Remove back arrow and add a tooltip to editor logo (#13067)
+ Track user events (#13051)
* Fix dashboard redirections (#12775)
* Fix Dropbox reconnection on token expiration (#13410)
* Fix upload dataset drag and drop (CartoDB/support#1072)
* Fix legends request order with slow internet connection (#12733)
* Documentation, fixed spelling and grammar in en.json
* Update charlock_holmes gem to 0.7.5 to fix C++11 related problems.
* Don't show basemap's labels layer in layer list (#13000)
* Fallback to `username` when `name` is empty in share map view
* Fix bounding box not updating with gmaps basemaps
* Fix support for organization assets on org import (CartoDB/cartodb-central#1981)
* Supporting text-placement for labels (CartoDB/support#13015)
* Google oauth now works without JS (#12977)
* Add "less or equal than" and "greater or equal than" to filter by value analysis
* Update styles for oauth buttons (#13412, #13439)
* Improve SQL limit platforms notification (#12597)
* Fix infinite loop for failed sql api requests.
* Show map options when selecting a map in search view
* Remove cumulative option when torque category (#12924)
* Protects against frozen string manipulation in buggy ruby version `2.2.4p230`
* Auto-select best geometry for DO (#12623)
* Notification for error tiles (#cartodb.js/1717)
* Make sure widget's source id is a string, reject it otherwise (#12878)
* Clean permissions ACL on group deletion (CartoDB/support/issues/1057)
* Safe check for destination DB on user import (CartoDB/cartodb-central/issues/1945)
* Improve legends for torque (CartoDB/support#979)
* CSV export allowed without geometries (#12888)
* Do not check shared entities in force deletion (#13352)
* User destroy order should be Central, local (#CartoDB/cartodb-central/issues/1929)
* Delete all external sources within one transaction (#13129).
* NoMethodError: undefined method `has_feature_flag?` for nil:NilClass at visualizations controller (#13145).
* Fix handling of imports with long file names and existing tables with almost the same name (#12732)
* Update widgets although source layer is not visible (support/#1135)
* Update cartodb.js version
* Don't allow csv export for polygon or line (#9855)
* Fix a problem with Unifont Medium font (#support/1002, #support/989)
* Hide the_geom_webmercator column from dataset view (#11045)
* Reload vis if needed when feature is save (#11125)
* Popups improvements (#11430, #10993)
* Added scroll to metadata in the embed view (#12501)
* Lazy select to fix missing values due to 40 per page items limitation in requests
* Fix min/max parameters in filter analysis (#11658)
* Fix some styles for datasets view for IE11.
* Fix image export when logo is disabled.
* Fix infowindow break word (CartoDB/support#965)
* Fix for permissions ACL referencing deleted user (CartoDB/support#1036)
* Update cartodb.js version
* Fix extraneous labels layer.
* Fix timeseries glitches (#12217)
* Rename 'Select a text' placeholder to 'Select a value' in Filter analysis (#11861)
* Highlight new column name (#12662)
* Add drag icon to each item in the widget list (#12692)
* Cancel feature edition when widget edition is selected (#12781)
* Rename 'SHARE' button to 'PUBLISH' and 'Not published yet' to 'Unpublished map' (#12730)
* Move Analysis cancel/delete button to the controls zone (#11414)
* Improved user migrator rakes (#12920)
* Rename SIZE/COLOR input label to COLOR in polygons style (#12768)
* Enhancements on 'Join columns for 2nd layer' analysis texts (#12418)
* Rename FILL input label to SIZE/COLOR (#12564)
* Refactor geometry buttons styles to ease breakpoints logic (#11542)
* Fix some issues related to feature edition view (#12716)
* Fix analysis onboarding lunch template (#12743)
* Ignore special LIKE characters in grantable searches (#13378)
* Allow any text in Maps, Layers and Widgets names (#12322)
* Fix overwrite strategy for users with hyphen in their username (#13365)
* Change edition mode when user edits widget (#12636)
* Disable editing the "Others" icon in UI (#12683)
* Improved date format in histograms (#12719)
* Improved tests. Introduced headless chrome for our spec runners (#12657)
* Fix popup order selection (#12694)
* Fix histogram range sliders stick on buckets (#12661)
* Fix Time Series resize when switching to advanced mode (#12124)
* Fix adding/removing widgets when having Time Series (#12123, #12402, #12655)
* Enhancements on superadmin imports & exports endpoints (#12254)
* Don't offer new DO UI unless user has DO credits (#12648)
* Fix problem with visualization search when a visualization is shared with a user from multiple entities (Support #1451)
* Change position and size of legend icons (#12619)
* Fix Time series width on mobile viewport (#12609)
* Fix random timeout in specs (#12625)
* Prevent a markdown with 'mailto' to open a new browser tab (#12628)
* Slider initialization waits for it to be attached to the DOM
* Fix timeseries animation for pixel styles (#12571)
* Change request order in user-actions (#12548)
* Implement responsive behaviour for time series (#12470)
* Fix broken join from second column on IE11 (#support/875)
* Fix ghost node problem (#11397)
* Break down deep-insights-integrations class (#11581)
* Optimize shared entities check (#13353)
* Fix CORS for local images in legends (#12647)
* Fix torque categories layer rendering (#cartodb.js/1698)
* Don't provide quantification option when layer is animated (#10947)
* Remove tracking of liked map events (#12404)
* Display dashboard notifications for open-source instances (#12421)
* Remove unsupported CartoCSS rules for vector rendering (#12410)
* Force parameter `vector` for vector rendering (#12478).
* Fixed typo in content_no_datasets.jst.ejs and en.json (Docs)
* Fixed typo in grunt usage docs (#12907)
* Fixing problem parsing formula widget creation (#support/843)
* Don't try to lowercase null values in custom-list-collection object (support/#744)
* Fixes named map creation for datasets imports on users with Google Maps (CartoDB/cartodb/pull/12519).
* Tap on iOS10 mobile embed doesn't jump to page bottom (#cartodb.js/1652)
* Don't try to lowercase null values in custom-list-collection object (#support/744)
* Validate widget form when widget type changes (#11536)
* Updated text of widget tooltips (#11467)
* Fixes gravatar enabled check (support#840)
* Fixed error where analysis overlay/infobox wasn't shown when hiding a layer (#11767)
* Size of 'Add analysis' button reduced (#11580)
* Fixed arrow keys exceeding min/max values in number editor (#12212)
* Better handling and reporting of "table with no map associated" error in map privacy changes (#12137).
* Improve formula widget form (#12242)
* Do not show unpublished visualizations in /explore (#12772)
* Fixed alignment problems after CartoAssets update (#12234)
* Fixed error instantiating the log of a data import if user doesn't exist (#12555)
* Fixed layer counter (#12236)
* Fixed problem when icon upload fails (#11980)
* Boolean fields are visible in the filter by column value analysis (#11546)
* Fixed legend's color mismatch with empty values (#11632)
* Fixed overlay for legends view (#11825)
* Fix error when revoking a Dropbox token that was revoked from Dropbox side (#12359)
* Dropbox searches now don't have limit of number of files (#12521)
* Fix error when a Dropbox folder has an extension matching valid extensions.
* Fixes login redirect loop with other user urls (#12553).
* Fixed UI when editing merge analysis (#10850)
* Fixed viewer invitations (#12514)
* Fixed uninitialized constant in Carto::Visualization when a viewer shares a visualization (#12129).
* Fix template generation without center at state (#12453).
* Fix regenerate all api keys in an organization (#12218)
* Refactor:
  * ::User <-> CartoDB::Visualization::Member dependency: #12116, #12221
  * Removed CartoDB::Visualization::Member outside old models: #12185, #12267, #12844, #12864.
  * Removed Visualization::Member usage from CommonDataService (#12459, #12488). Includes performance improvements on user signup.
* Refactor Layer model (#10934) and UserTable (#11589, #11700, #11737).
  * Removed CartoDB::Visualization::Member and CartoDB::Visualization::Collection from controllers: #12185, #12267, #12485.
  * Visualization::Member like and notification actions into Carto::Visualization (#12309)
  * Layer model (#10934) and UserTable (#11589, #11700, #11737).
* [WIP] Update to Rails 4
  * Update `rails-sequel` (#12118)
  * Changes compatible with Rails 3 (#12117)
* Make scrollwheel zoom on by default (#12214)
* Fix SAML login error with uppercased emails (#12367)
* You can configure your API key for the search bar, powered by Mapzen, with `geocoder.mapzen.search_bar_api_key` (#12296).
* You can configure your Access token for the search bar, powered by Mapbox, with `geocoder.mapbox.search_bar_api_key` (#13425).
* Fix viewer handling by visualizations controller (#12379).
* Add last name field to users (#12174)
* Fix error where a sync of a big dataset without geometry would be deleted from dashboard (#12162)
* `create_dev_user` rake no longer tries to auto-create the database, `cartodb:db:setup` should be run first (#12187).
* Fix EUMAPI response as per documentation (#12233)
* Export/import visualization password and locked (Support #1544)
* Fix dimension check and support for SVG without extension and XML header (#12374).
* Builder embed doesn't need user DB connection anymore (#12473).
* Visualization models no longer raise an error checking `password_valid?` (#12270).
* Fix `BUILDER_ENABLED` parameter in `create_dev_user` rake (#12189)
* User organization or user key for google maps (#12232)
* Configurable pg_dump/restore bin path (#12297)
* Redesigned LEARN MORE buttons behaviour (#12135)
* Fixed password protected embed maps (#13448)
* "vector" key in vizjson is skipped in embeds if user has "vector_vs_raster" feature flag enabled.
* Allow whitespace as layer name at vizJSONv3 (#12526)
* Inline editor saves on blur, discard changes on 'ESC' (#11567)
* Updated look and feel of sync interval dialog (#12145)
* Organization owner can skip domain whitelisting on user creation (#12452).
* Fixed 'not a function' bug related to a tooltip (#12279)
* Disable edit geometry for Layers with aggregated styles (#11714)
* Retrieve google static api url from backend to allow using both client_id and api_key (#12301, #12318)
* Fix vector problem with lines
* Fixed "see all formats" url, from the Connect Dataset module, to open in new windown and changed the url.
* Added a data attribute for Backbone views that points to the module that implements it (Leapfrog #12341)
* Change category widget color to blue when filtered. (#12409)
* Add geometry validation for polygons and lines in edit feature form (#12397)
* Fix permission model and added tests (#12393)
* Country dropdown should be mandatory in postal code georeference (#12420)
* Removed useless log traces (#12536)
* Fixed bounds and center of thumbnails after updating a map
* Fixed a bug in cartodb.js regarding the featureCount (#12490)
* Add default value to dropdowns (#12451)
* Fix connectors configuration rake when configuring an organization (#12509)
* Add tip about sanitising values in popup's InfoWindow (#11340)
* Fix a problem with responsive in deep-insights.js
* Fix 403 error in password protected embed maps (#12469)
* Fixed JS error for InfoWindows/Pop-ups (cartodb.js#1703)
* Freeze configuration hashes (#12586)
* Lowered log level from error to info for supported cartocss in vector maps (cartodb.js#1706)
* Histogram UI: Do not show "NULL ROWS" value if it is not received (#12477)
* Force raster mode in datasets preview map (#12513)
* Add assets version to TrackJS
* `rake cartodb:test:prepare` now works when the test database has not been created yet (#12776)
* Adding max items limit for form list editor (#12552)
* Improve Google Login button (cartodb-central#1808)
* Implement widget opacity in AutoStyle (#11928)
* Fix behaviour of visualizations restored from mapcaps (#12686)
* Fix histograms data range change (#12622)
* Fix exception thrown when map created without builder is used with it and visualization state data is missing (#12568)
* Enable selection of categories in non dynamic widgets [Support #890](https://github.com/CartoDB/support/issues/890)
* Square marker icon not updating with style. [Support #974](https://github.com/CartoDB/support/issues/974)
* Hide privacy button if user account type is FREE or PERSONAL (#12423)
* Fix "apply" button sizes in advanced mode (#12652)
* Axis labels changes in Time-Series (#12658)
* Fix backend tests (#13623)
* Removed unused settings in organizations (#4992)
* Increment maximum buckets in Time-Series for leap years (#12778)
* Prevent invalid geometries in BoundingBoxUtils.to_polygon, to_point (#12873)
* Show limit infobox in layers/widgets view (#12593)
* Improve tile error overlay (cartodb.js#1721)
* Fix TrackJS missing token in static pages (#12914)
* Fix missing upgrade link in static dashboard (#12929)
* Fix histogram zoom (#12945)
* Proper error message when ArcGIS server does not support query capability (#11544)
* Added TMS to layer_options (#13459)
* Fix ambiguous column call in the search tweets query (#13073)
* Fix email validator failing with empty emails (#13078)
* Be sure to delete the analysis cache tables while we're dropping a organization user (#13136)
* Fix for legends when there is only one element in the ramp (cartodb.js#1938)
* Fix SAML configuration bug that doesn't let access some properties properly (#13161)
* Improved error messages for ArcGIS MapServer imports [Support #1288](https://github.com/CartoDB/support/issues/1288)
* Treat all time series dataview timestamps as UTC (#13070)
* Fix datasets downloaded as "cartodb-query" [Support #1179](https://github.com/CartoDB/support/issues/1179)
* Enable CSV exports for polygon and line datasets (#13212)
* Change "Edit" to "Add" in panel header when adding a new geometry (#13049)
* Fetch histogram and time series totals with a new `no_filters` parameter. (#13059)
* Enable CSV exports for polygon and line datasets (#13212)
* Enable CSV exports for polygon and line datasets (#13196)
* Do not check Referrer for enabling CORS, whole domain must be enabled (#13783)
* Fix wrong padding in widgets list (#13200)
* Add fetch polyfill (#13230)
* Ensure v3 visualizations always have analyses (#13662)
* Fix asset upload with special character in local storage (#13602)
* Remove tooltip when clicking on an analysis and when adding a new geometry (#13235)
* Make all the widgets cards clickable in the Add widgets modal (#13134)
* Always use `urlTemplate` basemap attribute (deprecate `url`) (#13748)
* Make new widgets appear on top (#13244)
* Better error messages for some import errors
* Add indices to `layers` relations for performance (#13669)
* Fix imports with local storage and special characters (#13604)
* Update S3 gem to fix upload timeout problems (#13767, #13791)
* Stop trying to find visualizations without user/org id (#12538)
* Allow selecting only one bucket in animated time series [Support #1119](https://github.com/CartoDB/support/issues/1119)
* Fix missing values in sql view [Support #1210](https://github.com/CartoDB/cartodb/pull/13289)
* Correct redirection when visiting root url without subdomain (#13768)
* Fix table popups [#13304](https://github.com/CartoDB/cartodb/issues/13304)
* Fix category auto-style [#611](https://github.com/CartoDB/support/issues/611)
* Allow user exporter to be used as a db backup (#2058)
* Fix missing delete button [1223](https://github.com/CartoDB/support/issues/1233)
* Correctly log metrics events for query import type (#13652)
* Remove `sync_on_data_change` (https://github.com/CartoDB/cartodb.js/issues/1862)
* Fix duplicated modules resolution (https://github.com/CartoDB/cartodb/pull/13535)
* Use redis secondary for heavy `KEYS *` opeartion on user export (#13814)
* Fix broken import when `ogc_fid` or `gid` have nulls (https://github.com/CartoDB/support/issues/1338)
* Allow inviting viewers for org even if regular seats are full (https://github.com/CartoDB/support/issues/1373)
* Add rake to remove duplicate legends in layer
* Fix private visualization imports when user has no private tables permission (https://github.com/CartoDB/cartodb/issues/14052)
* Export and import `user`'s `client_application` and `oauth_tokens` (https://github.com/CartoDB/cartodb/pull/14060)
* Do not allow empty password in LDAP logins
* Disable syncs for locked users (https://github.com/CartoDB/cartodb/issues/13832)
* Invalidate varnish cache on api key changes
* Fix bugs in legends (https://github.com/CartoDB/support/issues/1339, )

### Internals
* Fix test error output for builder (#14158)
* Editor assets are frozen now (#14090)
* Added specs for the migrated dashboard (#14037)
* Profile and Account pages are now static and served via NGINX in production/staging enviroment (#13958)
* CARTO.js internal version is now called internal-carto.js (#13960)
* Compress and pack static pages assets for production release (#13940)
* Point docs to developer center (#13937)
* Point to new CARTO.js v4 repo (#13860)
* Account migration (#13501)
* Data Library dashboard migration (#13608)
* Improve spec bundles / process
* Replace SCSS-Lint with Stylelint (#13165)
* Use engine instead of visModel internally (#12992)
* Remove analysisCollection and refactor analyses-integration (#12947)
* Fix layer's sources in tests (analysis source required) (#12866)
* Adapt widget integration and specs to dataviews refactor (#12850)
* Optimize bundle size related to camshaft-reference (#13124)
* Integrate latest changes of carto.js (https://github.com/CartoDB/cartodb.js/issues/1936)
* Replace wax by carto-zera (https://github.com/CartoDB/cartodb.js/issues/1954)
* Avoid unnecesary grid.json requests (https://github.com/CartoDB/cartodb.js/pull/1979)
* Fix interactivity bug (https://github.com/CartoDB/support/issues/1222)
* Merge Deep-insights project in Cartodb (#13284)
* Add caching headers for emebeds
* Affected specs tasks now take into account multiple specs folders [PR #13295](https://github.com/CartoDB/cartodb/pull/13295)
* Updated to Rails 4.2.10 (#11735)

### NOTICE
This release upgrades the CartoDB PostgreSQL extension to `0.19.2`. Run the following to have it available:
```shell
cd $(git rev-parse --show-toplevel)/lib/sql
sudo make install
```

To launch the clean assets script run the following in the terminal:
```shell
./script/clean_assets
```

It will remove old assets from `public/assets/` (older than version in `package.json`)

#### Dropbox API v2 migration

Dropbox API v2 (#8303, #12300): [Dropbox deprecated API v1](https://blogs.dropbox.com/developers/2016/06/api-v1-deprecated/)
so CARTO must migrate. If you are using Dropbox integration, you must:
* Check which permission does your application has in Dropbox. If it's "Full", just upgrading CARTO is enough.
* If it's not "Full", you must:
   1. Create a new application in Dropbox, with "Full" permission.
   2. Delete existing tokens. You can do this at Rails console with `SynchronizationOauth.where(service: 'dropbox').each(&:destroy)`.
   3. Change Dropbox configuration at app_config.yml to the new application and restart server and Resque.
   4. Connect users again (at profile page).
   5. Trigger sync datasets manually.

More information at [Dropbox migration guide](https://www.dropbox.com/developers/reference/migration-guide).

4.1.x (2017-05-31)
-----------
### Security fixes
* An attacker could execute commands in the server running the queues by importing a file with a carefully crafted filename. Fixed in #11782

### Features
* Overviews are synchronized now (#12092)
* Adding tracking classes for any Backbone.Form editor (#12095)
* Using Node v6.9.2 and npm v3.10.9 (#11935).
* Updates Dataservices API client default version to `0.17.0` (#12093)
* Exposed some cartodb.js methods through map definition model (#11846)
* Dataservices configuration rake tasks (#11917)
  * `cartodb:services:set_user_quota[username,service,quota]` updated to support the `mapzen_routing` provider
  * `cartodb:services:set_org_quota[orgname,service,quota]` updated to support the `mapzen_routing` provider
  * `cartodb:services:set_user_soft_limit[username,service,quota]` new task to set user soft limits
* Color picker for codemirror component.
* Owner can delete organization account (not at SaaS, #12049).
* New dropdown for Data Observatory (#11618)
* Quota pre-check to analyses that consume quota.
* Marking 'Do not show me again' in Layer Onboarding affects every tab. (#11586)
* Adding Google-Maps basemaps (#11447)
* Improve dialog forms to render them floated. (#7786)
* Adds slider component to the forms (#11617)
* Adds export as image (#11789, #12028)
  * Exports GMaps basemaps (#11775)
  * Show error notifications (#11887)
  * Adds disclaimer (#12024)
* New organization assets (#11034):
  * REST API available at `/api/v1/organization/<org_id>/assets`
  * Has DB migration
  * Assets stored in s3 if configured, local storage is used otherwise.
    * S3: bucket must exists and its name be present as `bucket` in conf.
    * Local: automatic as long as S3 is not configured. You may configure max size in bytes for an asset or a custom subdirectory as shown below.
```yaml
  # app_config.yml example for organization assets
  assets:
    organization:
      bucket: <bucket name> # required, bucket must exist beforehand
      max_size_in_bytes: 1048576 # optional, default is 1 MB
      location: 'organization_assets' # optional subdirectory for local assets, default is 'organization_assets'
```
* Pluggable frontends (#11022):
  * Allow to override some parts of the frontend for customization
  * Changes the asset build process:
    * The core frontend is in `lib/assets/core`
    * The customizations are in `lib/assets/client`
    * The end result are in `lib/assets/`
  * You may also plug backend view templates by specifying alternative paths in `app_config.yml`:
    * Paths are inspected in the supplied order. First valid template is used. Default path is always inspected last.
```yaml
  custom_paths:
    views: [] # an array of paths were alternate view templates are located.
```
* Snapshots (backend: #10928) allow to save and share map state.
* Import API parameter: `collision_strategy`. Support for `skip` #11385.
* Allow to override S3 endpoint for visualization exports and data imports when using S3 compatible storage services (#11614)
* Icon styling through in component (#11005)
* Allow to set opacity for color ramps (#10952)
* Added Fullstory integration, can be configured in app_config
* SAML Authentication for organizations. Example:
  * Use the task at `lib/tasks/saml.rake` for configuration.
  * Subdomainless URLs:
    * Login page: http(s)://<ip-address>/user/ORGANIZATION_NAME/login.
    * `assertion_consumer_service_url`: 'https://<ip-address>/user/<org-name>/saml/finalize'. Check that your server has this URL for the service provider ACS URL.
* Autostyling (#10420)
  * Correctly handle legends (#11121)
* Updated ogr2ogr version to 2.1.2. To install or upgrade it in the system:
  * `sudo apt-get update`
  * `sudo apt-get install gdal2.1-static-bin`
* Style with icons
  * Removed Pin, and Simple icons (#11479)
  * Select an icon previously uploaded by the organization admin (#11462)
  * Sets the default initial size for icons to 20px (#11498)
* Onboarding for layer edition (#10905)
* Initial support for Rails engines with CARTO Gears.
  * Notification API (#11850)
  * Queue and Email support (#11692).
  * User login event (#12010).
  * Fixes to loading gems and autoloading of code (#12019)
* Improved empty bounds map handling (#11711).
* Updated diagnosis page versions.
* set_import_limits rake (#11756).
* Improved formula widget description field. (#11469)
* Improved empty bounds map handling (#11711).
* Updated diagnosis page versions.
* Improved formula widget description field (#11469).
* In an organization, only the owner sees the Google API keys.
* Added support for Zeus for faster testing (#11574). Check `CONTRIBUTING.md` for configuration details.
* Migrate to use GNIP v2 for twitter search connector (#10051, #11595).
* Notifications API (#11734) and administrator UI (#11729).
* Links generated at Markdown (at notifications or maps description, for example) now open in a new window (#11940).
* Migrate to use GNIP v2 for twitter search connector (#10051, #11595)
* Organization notifications (WIP) (#11734, #11780, #11734, #11821)
* Invite to georeference proactively when detecting non-georeferenced data (#11316)
* Update tangram with smooth point outline.
* Improve affordance of layer item (#11359).
* Improved performance of visualizations with reduced fetching (#12058).
* GME users can change to any basemap #11785.
* Improve affordance of layer item (#11359)
* Revamp of quota management code
    * **Removed the usage of the feature flag `new_geocoder_quota`**. The behavior is as if it was activated for all users (which's been the case for all cloud users for a long while). (#11784)
    * Fixed bug in validation of metrics before storing them. (#11784)
    * Removed deprecated methods `Geocoding.get_geocoding_calls`, `User.get_db_system_geocoding_calls`, `get_new_system_geocoding_calls`. (#11784)
    * Optimized access to redis storage (#11809)
    * Add back FREE users to overquota calculation (#11848)
* Update tangram-cartocss to use smooth point outline.
* Update cartodb.js to use multiple subdomains.
* Refactored Builder specs generation using Webpack (#11698)
* Update tangram to use subdomains.
* New dashboard notifications added (#11807).
* New 'Find Nearest' analysis (#11933).
* New 'SQL function' analysis (#12018).
* Allows to enable / disable analyses using feature flags (#12056).
* Multiple file upload through "upload file" tab (#11952)
* Change setView by flyto.
* Update tangram to fix layer geometry conditionals.
* Update tangram to fix layer geometry conditionals.
* Improve assets build process (#11962)
    * Frontend development task has changed from `grunt && grunt dev` to `grunt dev`
    * Test task remains the same, but internals changed `grunt test`
* Allow to have multiple administrators per organization (#12052, #12083)
* Allow to have multiple administrators per organization (#12052)
* Allow to have multiple administrators per organization (#12052, #12083, #12069)
* Added explanation tooltip to the categorize label on the Find Nearest analysis (#12100)
* Disable geometry edition button instead of hide in read-only layers (#11543)
* Updated copies for export image & download map (#12114)
* Added context menu to time-series widgets. (#12177)
* Add all/none buttons to multi-select component (#9502)
* New style for add analysis button (#11902)
* Fix onboarding in layers (#12192)
* Show infowindow when user reaches max layer limit (#12167)
* Format quota infowindow numbers (#11743)
* Improved analysis error tooltip (#12250)
* Enable overwrite collision_strategy in import API (#11990)
* Rollback failed user/organization imports
* Export map layers statistics
* Add hubspot_form_ids to frontend config
* Metadata only user migrations
* Add rake to fix analyses cache tables geometries
* Enable user migrations across clouds (#12795)

### Bug fixes
* Update Data Observatory Analysis UI (#9991)
* Boolean fields are visible in the filter by column value analysis (#11546)
* Fixed legend's color mismatch with empty values (#11632)
* Fixed overlay for legends view (#11825)
* Fixed UI when editing merge analysis (#10850)
* Fixed uninitialized constant in Carto::Visualization when a viewer shares a visualization (#12129).
* Revamp grunt default task to compile assets (#12325)
* Remove dashboard_migration ff from backend (#14103)
* Made checkboxes actionable clicking on its label (#11535)
* Google customers don't need quota checks for hires geocoding (support/#674)
* Fixed a problem with autostyle when styles has aggregation (#8648)
* Provide the possibility to add the current source node to the target options list in analysis forms (#12057)
* Update table view on adding or removing a feature (#11978)
* Reload vis when a row is deleted in table view (#11759)
* Fixed operator view edition (#12133)
* Fixed a problem with shared dataset's title (#12144)
* Fixed reset autostyle after clicking on more than 1 auto-style buttons without unchecking them (#11795)
* Fixed styles in numeric fields when editing a feature (#12026)
* Fixed disabling button while export image is running (#12029)
* Solved problem with file input in connect dataset dialog (cartodb/support#690)
* Fixed problem with feature flag in analyses (cartodb/support#691)
* Removed link to markdown support in organization notifications
* Fix image export in Safari and IE (#12066)
* Autostyling for google basemaps (#11838)
* Fixed problem with the textarea editor (cartodb/support#656)
* Fix estimation analysis row count (#11746)
* Autostyling for google basemaps (#11838)
* Fixed problem with the textarea editor (cartodb/support#656)
* Fixed problem with markdown in organization notifications (#12045)
* Save collapse state for layer list (#11927)
* Styling falsy categories (#11421)
* Fixed bug editing geometries from dataset view (#11855)
* Fixed pagination position in Safari browser
* Fixed problem renaming a table and breaking edition until reloaded (#11969)
* Trigger change event when item is selected for multiselect component (#11521)
* Disable export image button if not validated (#11949)
* Update hover infowindow content when fields have changed (#11921)
* Don't make several requests when basemap is changed to a plain (color) one (#11445)
* Fixed problem when provider has changed and map instantiation (#11910)
* Fixed layers order when creating a new layer dragging from a compound analysis (#11827)
* Fixed problem after filtering a widget, where style pane was not working (#11819)
* Fixed problem removing a layer within the proper layer is throwing a JS error (#11803)
* Fixed histogram filtering when there is no bucket in that range (#11798)
* Fixed problem with clipped contextual menu in widgets (#11790)
* Fixed copy for confirm analysis with quota (#11749)
* Using clean method instead of remove for context-menu-view (#11778)
* Adds https protocol to WMS Proxy URLs (#11786)
* Fixed time widget loader (#11754)
* Fixed problems related with IE11
* Fixed silent problem with jQuery selector (cartodb/deep-insights.js#527)
* Form editors remains open if a modal is open even triggering document click or ESC (#11686)
* Fixed font style for the "You have run out of quota" module (#11690)
* Ensured all analysis onboarding screens link to carto.learn guides (#11193)
* Fixed problem with Bubbles legend when a new analysis is applied (#11666)
* Fixed missing metadata option in header when dataset is sync (#11458)
* Fixed problem with dates when filtering time series widget
* Fixed problem switching between qualitative and quantitative attributes (#10654)
* Fixed problem with Google Maps API key inheritance from organizations (#11923)
* Fixed problem found in Surfaces related with map panning and widgets filtering
* Style with icons
  * Reset icon on map when you remove that custom icon
  * Made icon's clicking area larger
  * Avoid request when url is not defined
  * Fix copy when deleting icons in organization.
* Start using layers<->user_table cache in all places (#11303)
  * Run `cartodb:db:register_table_dependencies` rake to update caches for existing maps
* Categories legend are now static (#10972)
* Fixed a bug with vizjson invalidation (#11092). It was introduced in #10934
* Refactor:
  * Layer model: #10934
  * UserTable: #11589, #11700, #11737
  * Map model and controller: #12039, #12011
  * Extract visualization invalidation to a service: #12096
  * Permission: #12077
* Refactor Layer model (#10934) and UserTable (#11589, #11700, #11737).
* Correctly render map previews for maps with google basemaps (#11608)
* Do not trigger visualization hooks on state update (#11701)
* Correctly register table dependencies of torque layers (#11549)
* Validate number of organization seats in user update (#11839, #11859)
* Validate number of organization seats in user update (#11839)
* Fix bugs where legends where being hidden by reordering layers (#11088)
* Correctly ask for alternative username when signing up with Google/GitHub into an organization
* Avoid loading all rake code in resque workers (#11069)
* Fix analysis notification in running state (#11079)
* Warn about affected maps on dataset deletion (regression, fixed in #11801)
* Fix color for "Other" category (#11078)
* Validate that only one legend per type (color/size) is allowed (#11556)
* Enable more security HTTP headers (#11727 and 5e2d4f55ee3c19b3c7fc048977ca5901e28798e3)
* Clean up import directory when importing from URL (#11599)
* Custom errors for latitude/longitude out of bounds (#11060, #11048)
* Fix timeseries widget height (#11077)
* Fix a DB deadlock while simultaneously updating and deleting layers (#11568)
* Improve speed of map name availability check, improves map creation and renaming times (#11435)
* Fix redirection after logout for subdomainless URLs (#11361)
* Fix unp detecting .carto files with "rar" in the name as rar files (#11954)
* Fix scrollbar in carousel (#11061)
* Fix layer loading at embeds (#11554)
* Restrict login from organization pages to organization users, and redirect to Central otherwise
* Correctly refresh map after adding/editing map geometries (#11064)
* Fix inconsistent state after user deletion failed (#11606)
* Return embed private instead of 404 in visualization embeds where the visualization doesn't exist (#11056)
* `app_config.yml.sample` configuration for dataservices.
* Fix error loading builder in visualizations without permissions (#10996)
* Correctly update legend styles (with custom titles) (#10889, #10904)
* Hide sync options in builder table view for non-owners (#10986)
* Fix issues with edition of custom color infowindows (#10985)
* UI fixes for georeference. Changes of copy and validation warning. (#11426)
* Show layer name in legends for Torque layers (#11715)
* Color scheme is now clickable in category ramps (#11413)
* Fix responsive layout in onboarding steps (#11444)
* Speed improvements to parallel tests (#11636)
* Fix for race condition when importing files and deploying at the same time (#11653)
* Correctly create custom category legend if style has icons (#11592)
* Fixed error handling if json "errors" field contains one single string (#11752)
* Check for validation errors in EUMAPI user update endpoint (#11906)
* Fix problem with perfect-scrollbar in Edge browsers (CartoDB/perfect-scrollbar/#2)
* Skip loading common data for viewer users created via EUMAPI (#11909)
* Layer onboardings are now aware on sync'd layers and highlighted area is clicked. (#11583)
* Do not show builder activated notification for new users (#11720)
* Fixed overflow on loaders.
* Correctly delete map layers on visualization deletion (#11931)
* JOIN Analysis Fails Without Error Message (#11184)
* Fix problem with perfect-scrollbar in Edge browsers (CartoDB/perfect-scrollbar/#2)
* Correctly autostyle layers based on geometry when adding layers from modal (#11813)
* Fix problem creating analyses without Data Services API (#11745)
* Fix problem when number column is used like categories in fill component (#11736)
* Don't let user to apply icons over categories when auto-style is applied (#11761)
* Update leaflet from 0.7.x to 1.0.x
* No geometry messages are displayed after a new geometry is drawn (#11857)
* Default zoom for newly created maps without data is 3 (#11922)
* Rearrange Error tracker script order (#11872)
* Fix subdomain error not loading tiles.
* Redirect to last visited page after logging in (#11946)
* Better error handling in LDAP (#12165)
* Sanitized HTML from map and layer names.
* Merged fix subdomain error not loading tiles (CartoDB.js#1607)
* Create users from org panel with the default quota (#11837)
* Fixed way to listen Deep-insights.js map or widgets changes (#11894)
* Using latest cartodb.js and deep-insights.js to tackle map zooming problem (support#605)
* Fix organization notifications issues (#11957)
* Max tracts to 4 for isoline analysis (#11723)
* Right column validate type match in Join analysis (#11829)
* Check if analysis node is on top before fetching query data (#11874)
* Validate amount of organization seats (#12101)
* Fixed error dropping tables from ghost table manager on race condition cases (#12012)
* IE11 fix for dropdowns with scrollview (#12073)
* Better display and logging of errors when SAML authentication fails (#12151)
* Fixed problem resetting styles per node after adding a new analysis (#12085)
* Ensure Google services activation rake writes the api keys to Redis (#12209)
* Docs, fixed some minor spelling and grammar errors in the content.
* Docs, updated "More Info" url from street addresses georeference options to new, related guide.
* Organizations users now get engine_enabled from the organization by default (#12153)
* Color picker disappears in CartoCSS editor after clicking (#12097).
* Bug found in dataset view when user had Google basemaps enabled (#12155)
* Fixed incorrect analysis node being selected after deleting (#11899)
* Maps using GMaps as their basemap are now opening in editor (#12712)
* Time-series range filter is kept after refreshing (#12576)
* Avoid exporting orphan raster overviews in user migrator
* Set `soft_geocoding_limit` to default to false.
* Do not export local visualizations lacking a map
* Do not export duplicated canonical visualizations
* Add notifications to user migrator (#13844)
* Better postgres functions deprecation matching
* Export and import non-cartodb-managed named maps.
* Keep import even if it fails importing visualizations (#13903)
* Save Import when visualization import fails (#13984)
* Add rake to remove org metadata .
* Docs, fixed incorrect grammar in en.json file (customer reported).

### NOTICE
This release upgrades the CartoDB PostgreSQL extension to `0.19.0`. Run the following to have it available:
```shell
cd $(git rev-parse --show-toplevel)/lib/sql
sudo make install
```

4.0.x (2016-12-05)
------------------

### NOTICE
This release includes the new Builder, so it includes major changes. The logs only includes changes to editor.

### NOTICE
This release rebrands CartoDB as CARTO, so a few maintenance tasks have to be run:
 - `bundle exec rake carto:db:set_carto_attribution`
 - Update basemaps configuration to use CARTO as a category instead of CartoDB

### NOTICE
This release introduces a new Resque queue: `user_dbs`. It is needed for operation on user databases, i.e: linking
ghost tables, importing common data and automatic index creation.

### NOTICE
This release changes the way visualization tokens are stored, so am igration task has to be run for password
protected visualizations to keep working: `bundle exec rake cartodb:vizs:update_auth_tokens`

### NOTICE
PostgreSQL 9.5 is needed.

### NOTICE
This release upgrades the CartoDB PostgreSQL extension to `0.18.1`. Run the following to have it available:
```shell
cd $(git rev-parse --show-toplevel)/lib/sql
sudo make install
```

### Features
* Automatic creation of indexes on columns affected by a widget
* Update CartoDB PostgreSQL extension to 0.18.1:
  * Change CDB_ZoomFromScale() to use a formula and raise
    maximum overview level from 23 to 29. (0.16.4)
    [#259](https://github.com/CartoDB/cartodb-postgresql/pull/259)
  * Fix bug in overview creating causing it to fail when `x` or
    `y` columns exist with non-integer type. Prevent also
    potential integer overflows limiting maximum overview level
    to 23.
    [#258](https://github.com/CartoDB/cartodb-postgresql/pull/258) (0.16.4)
  * Add export config for cdb_analysis_catalog table (0.17.0)
  * Add some extra fields to cdb_analysis_catalog table. Track user, error_message for failures, and last entity modifying the node (0.17.0)
  * Exclude overviews from user data size (0.17.0)
  * Add cache_tables column to cdb_analysis_catalog table (0.17.1)
  * Fix: exclude NULL geometries when creating Overviews (0.18.0)
  * Function to check analysis tables limits (0.18.0)
  * Exclude analysis cache tables from the quota (0.18.0)
  * Increase analysis limit factor to 2 [#284](https://github.com/CartoDB/cartodb-postgresql/pull/284) (0.18.1)
* Viewer users for organizations.
* Oauth integration with GitHub
* Configurable [Redis timeouts: connect_timeout, read_timeout, write_timeout](https://github.com/redis/redis-rb#timeouts).
* Configurable paths for logs and configurations through environment variables. If not set, they default to `Rails.root` as usual.
  * `RAILS_CONFIG_BASE_PATH`. Example: /etc/carto
  * `RAILS_LOG_BASE_PATH`. Example: /tmp/carto
  Both are replacements for `Rails.root` and expect the same internal structure so, for example,
  if you place `app_config.yml` at `/etc/carto/config/app_config.yml`, `RAILS_CONFIG_BASE_PATH` must be `/etc/carto`.
    The same happens with logs, which are stored into `#{RAILS_LOG_BASE_PATH}/logs/filename.log`).
    This way those variables can be a drop-in replacement for `Rails.root`, guaranteeing compatibility with Rails project structure.
* Configurable path for public uploads:
  * `RAILS_PUBLIC_UPLOADS_PATH`. Example: /var/carto/assets. Defaults to `env_app_config[:importer]["uploads_path"]`
  This will store user uploaded assets at `#{RAILS_PUBLIC_UPLOADS_PATH}/uploads` (needed for backwards compatibility).
* Don't display Twitter or MailChimp if user can't import it.
* Updated ogr2ogr version to 2.1.1, configurable in `app_config.yml`. To install it in the system:
  * `sudo apt-get update`
  * `sudo apt-get install gdal2.1-static-bin`
  * edit your `config/app_config.yml` and make sure the `ogr2ogr` entry contains the following `binary: 'which ogr2ogr2.1'`. See [app_config.yml.sample](https://github.com/CartoDB/cartodb/blob/0529b291623a9d9d78c8f21ff201f9938aa51aca/config/app_config.yml.sample#L8) for an example.
* Salesforce and ArcGIS connectors can now be enabled independently of `cartodb_com_hosted` (in the `datasources` section in `app_config.yml.sample`)
* Custom labels for legends (#10763)
* Builder is enabled by default
* New option for centering the map according a layer data (#10116).

### Bug Fixes
* Incorrect error message when password validation failed
* Fix visualization not found error when exporting maps created from datasets
* Performance improvements updating visualizations
* Fixes for organization invitations
* Fix for updating tables with an `id` column
* Prefer city guessing over country guessing when possible for file imports
* Fixed an issue registering table dependencies for users with hyphens in the username
* Support for export visualizations with characters outside iso-8859-1
* Forward compatibility for infowindows at Builder
* Correctly copy map privacy from source tables
* Fix permissions in quota trigger for shared datasets. Run `bundle exec rake cartodb:db:reset_trigger_check_quota_for_user[<username>]` to fix existing users.
* Several auth_token related fixes
* Fix issue importing/duplicating maps where the original had an incomplete map.options
* New builder default geometry styles are now properly initialized at the backend upon dataset import.
* Fixed list of layers in Add basemap WMS URL tab
* This release introduces the Magic Positioner helper to render context menus in the best position inside the viewport.
* Removed non used fonts (Lato and Proxima Nova) and the font loader.
* Fixed problem generating Histogram stats in columns with only one value (#9737).
* 'Clear' button in SQL view shows up if the first SQL edition fails (#9869).
* Minimum buckets is 2 for histogram widgets (#10645).
* Fixed with category widgets and aggregation (#10773)

3.13.0 (2016-XX-XX)
-------------------
### NOTICE
For the analysis catalog feature existing users require to run `rake cartodb:db:set_user_privileges_in_cartodb_schema['$USERNAME']`.

### NOTICE
This release introduces a different method of doing cache invalidations, using Surrogate Keys instead of the older X-Cache-Channel header.
See [CartoDB Surrogate Keys](https://github.com/CartoDB/cartodb/wiki/CartoDB-Surrogate-Keys) on the wiki for more information about this change.

All invalidations done from newly created CartoDB accounts/databases from this release will invalidate using the new method.
Due to this, if you use Varnish or any alternate caching methods, you need to update to a version of the APIs which provides a Surrogate-Keys header on all the cacheable responses:
  * Windshaft-cartodb >= 2.27.0
  * CartoDB-SQL-API >= 1.26.0

After ensuring those applications are updated, you should restart Varnish (or purge all its objects) to ensure all new objects will contain
the Surrogate-Keys header, and then reload the invalidation trigger installed on the user databases to be upgraded with the Rake task: `rake cartodb:db:load_varnish_trigger`.

For backwards compatibility with unupgraded trigger versions, those API versions still emit both X-Cache-Channel and Surrogate-Key headers.
However, this will be deprecated on a future release.

### NOTICE
This release changes how visualization permissions are stored in the database. To ensure that the database state is consistent,
it is highly recommended to run the following rake task BEFORE MIGRATING the database schema: `rake cartodb:permissions:fill_missing_permissions`.

The task will report visualization that could not be automatically fixed, where multiple permissions exists for a given visualization,
which should be fixed manually.

### Features
* Update CartoDB PostgreSQL extension to 0.16.3:
  * Support for analysis catalog (0.16.0)
  * Schema quoting bugfix for overviews (0.16.3)
* Change Varnish table-related invalidations and tagging to use [Surrogate Keys](https://github.com/CartoDB/cartodb/wiki/CartoDB-Surrogate-Keys)
* Remove Varnish table invalidations from Rails and replaced them with CDB_TableMetadataTouch calls (delegating invalidation responsibility to the database)
* Adds optional strong passwords for organization signups
* Improved logging for custom installations where Rollbar is not used
* Add new function User#direct_db_connection which uses a new direct_port paramerer to be specified in database.yml to connect to the database. Usage instructions:
  * Use `port` in database.yml to specify the port through which the db is accessed for regular queries (such as pgbouncer connections)
  * Use `direct_port` in database.yml to specify the port through which the db can be directly accessed (i.e. the port in which Postgres is running)
  * This change is backwards compatible and will fallback to `port` whenever `direct_port` is not specified in the database configuration file.
* Update ogr2ogr version to 2.1, configurable in `app_config.yml`. To install it in the system, run:
  * `sudo apt-get install gdal2.1-static-bin`
* Added config option `avatars.gravatar_enabled` to disabled gravatar loading (i.e: in offline installations)
* Ghost table linking is now concurrent per user (avoids race conditions)
* Experimental support for [visualization metadata export](https://github.com/CartoDB/cartodb/pull/7114).
* Full visualization export (metadata + data). Example: `bundle exec rake cartodb:vizs:export_full_visualization['5478433b-b791-419c-91d9-d934c56f2053']` (replace the id with the visualization that you want to export).
  * New configuration parameter: `exporter.exporter_temporal_folder`. Default value: `/tmp/exporter`. See `app_config.yml.sample`.
  * Geopackage internal format.
* Full visualization export API. Needed configuration changes:
  * New Resque queue: `exports`.
  * `exporter.uploads_path`. Set it to `public/uploads` to use Rails standard upload directory or an absolute path (such as `/tmp/export/downloads`) to make cleanup easier.
  * `s3` (see `exporter.s3` at `app_config.yml.sample`).
  * Enabled `config.action_dispatch.x_sendfile_header = 'X-Accel-Redirect'` for nginx direct download if you''re not using S3. Needs [ngnix configuration](https://www.nginx.com/resources/wiki/start/topics/examples/x-accel). `uploads_path` configuration path is used.
* Update CartoDB PostgreSQL extension to 0.15.1 to support overviews.
* Disables data library when it is not configured (e.g: offline installations).
* Disables external file services when not configured (e.g: offline installations).
* Update dataservices-api client to version 0.3.0 (routing functions).
* Migration from wizard properties to style properties.

## Bug Fixes
* Sharing tables with groups fix for name collision.
* Updating CartoDB.js submodule with last changes sanitizing attribution.
* Fixes a problem with select2 arrow icon.
* Disable `PROMOTE_TO_MULTI` ogr2ogr option for CSV imports with guessing enabled to avoid MultiPoint imports. (https://github.com/CartoDB/cartodb/pull/6793)
* Source and attributions copied to visualizations when you import a dataset from the Data Library (https://github.com/CartoDB/cartodb/issues/5970).
* Improved performance of the check for multiple users editing the same visualization
* Fixes a memory leak when connecting to user databases
* Drops unused `url_options` field from visualizations table.
* Fixed error when accessing an SQL API renamed table through the editor.
* Refactored and fixed error handling for visualization overlays.
* Ignore non-downloadable GDrive files that made file listing fail (https://github.com/CartoDB/cartodb/pull/6871)
* Update CartoDB PostgreSQL extension to 0.14.3 to support `cartodb_id` text columns in the CartoDBfy process.
  * See instructions to upgrade to the latest extension version [here](https://github.com/CartoDB/cartodb-postgresql#update-cartodb-extension)
* Fix slow search of visualizations by name
* Fixed a bug where visualization with two layers using the same dataset could not be deleted
* Update and improve logging system
* Fix automatic reconnection to DB with error `result has been cleared`
* Fix broken syncs after setting sync options to "Never"
* Fix broken visualizations due to invalid permissions
* Check layer limits server-side
* Fixed error duplicating datasets from the dashboard if the owner had hyphens in the name
* Fix URL generations in some views, to correctly include the subdomain
* Make `layers.kind` not null. Run `bundle exec rake db:migrate` to update your database
* Remove unused and broken tool for migration of the visualization table
* Fix error when deleting organizational users that had created objects via SQL-API
* Change deprecated PostGIS function `ST_Force_2D` for the new `ST_Force2D`
* Fix bug in import mail notifier that prevented to obtain the name of tables created by queries or duplications
* Fix some import failures due to failling in finding suitable table names.
* Exported map files now have comprehensive names.

## Security fixes

3.12.4 (2016-03-09)
-------------------

## Bug Fixes
* Fixes in HTTP Header authentication.
* Fixes in avatar urls
* Fixes in organization sigup
* Fixes in high resolution geocoder when using google provider
* Fixed rake to setup google maps

3.12.3 (2016-02-11)
-------------------

## Features
* Group support for organizations.
* User quota slider in organizations management.
* Update navigation in public pages.
* Support for HTTP Header authentication.
* New visualization backups.
* GPX multilayer file creates a multilayer map
* Allow to create sync tables with a map if setting up onw from "connect dataset" from the Maps view

## Bug Fixes
* Now the owner of the dataset is going to receive an email when the synchronization fails hits the max allowed number [#3501](https://github.com/CartoDB/cartodb/issues/3501)
* If the dataset don't have an associated map we avoid to use the zoom property [#5447](https://github.com/CartoDB/cartodb/issues/5447)
* Display custom attribution of layers in the editor and embeds
  [#5388](https://github.com/CartoDB/cartodb/pull/5388)
* Fix for #5477 bug moving users with non-cartodbfied tables
* Added a rake task to notify trendy maps to the map owner when reach a certain mapviews
amount (500, 1000, 2000 and so on). This task takes into account the day before so it should
be exectuded daily
* Fixed negative geocoding quota in georeference modal
[#5622](https://github.com/CartoDB/cartodb/pull/5622)
* Fully removed Layer parent_id from backend and frontend as wasn't used.
* Added [#5975 Box integration](https://github.com/CartoDB/cartodb/issues/5975).
* Fixed geocoding in onpremise versions

## Security fixes
* Removing Bitly shortener.
* Several XSS fixes in organization accounts
* API fixes that allows.

3.12.2 (2016-05-15)
-------------------
* Support for HTTP Header authentication.
* Update navigation in public pages.
* New feature in organizations management: user quota slider.
* Widgets (experimental) API.
* Added `data_library` to the config. Usage instructions:
  1. Configure data-library path. You can copy `data_library` config from `config/app_config.yml.sample` into your `config/app_config.yml`.

3.12.0 (2016-01-05)
-------------------
* Ruby 2 support in CartoDB. Ruby 1.9 is now deprecated and not supported from this moment.

3.11.1 (2016-01-05)
-------------------
* Now the owner of the dataset is going to receive an email when the synchronization fails hits the max allowed number [#3501](https://github.com/CartoDB/cartodb/issues/3501)
* If the dataset don't have an associated map we avoid to use the zoom property [#5447](https://github.com/CartoDB/cartodb/issues/5447)
* Display custom attribution of layers in the editor and embeds [#5388](https://github.com/CartoDB/cartodb/pull/5388)
* Adapted Hound configuration to use default .rubocop.yml file so we can have [Rubocop](https://github.com/bbatsov/rubocop) style checks integrated at Sublime Text via [SublimeLinter](http://sublimelinter.readthedocs.org/en/latest/) + [SublimeLinter-rubocop](https://github.com/SublimeLinter/SublimeLinter-rubocop)
* Migrated `Synchronization` id field to `uuid`
* Fix for #5477 bug moving users with non-cartodbfied tables
* Added a rake task to notify trendy maps to the map owner when reach a certain mapviews amount (500, 1000, 2000 and so on). This task takes into account the day before so it should be exectuded daily
* Fixed negative geocoding quota in georeference modal [#5622](https://github.com/CartoDB/cartodb/pull/5622)
* Now create a map from a GPX multilayer file is going to create a multilayer map
* Group support for organizations. Usage instructions:
  1. Update CartoDB PostgreSQL extension to the latest version ([instructions](https://github.com/CartoDB/cartodb/blob/master/UPGRADE#L43)).
  2. Configure metadata api credentials and timeout. You can copy `org_metadata_api` config from `config/app_config.yml.sample` into your `config/app_config.yml`.
  3. Trigger existing orgs configuration: `RAILS_ENV=development bundle exec rake cartodb:db:configure_extension_org_metadata_api_endpoint`.
  4. Trigger existing org owner role assignment: `RAILS_ENV=development bundle exec rake cartodb:db:assign_org_owner_role`.
  5. Increase your database pool size to 50 (10 x # threads, see next line) at config/database.yml. Sample development configuration: config/database.yml.sample
  6. Make sure that `config.threadsafe! unless $rails_rake_task` is uncommented at `development.rb`.
  7. From now on you must run the server in multithread mode: `bundle exec thin start --threaded -p 3000 --threadpool-size 5`.
* New visualization backups feature. Upon viz deletion a special vizjson will be stored in a new DB table. Backups live for Carto::VisualizationsExportService::DAYS_TO_KEEP_BACKUP days and can be recovered with `cartodb:vizs:import_user_visualization` rake by visualization id. Needs new feature flag `visualizations_backup`. Check https://github.com/CartoDB/cartodb/issues/5710 for additional details
* Fully removed Layer parent_id from backend and frontend as wasn't used.
* Added new (optional) config parameters `unp_temporal_folder` & `uploads_path` under `importer` section to allow custom UNP and file upload paths.
* Added new (optional) config parameters `unp_temporal_folder` & `uploads_path` under `importer` section to allow custom UNP and file upload paths.
* Data-library page for common-data and accounts with data_library feature flag [#5712](https://github.com/CartoDB/cartodb/pull/5712)
* Removed config option `maps_api_cdn_template`, reusing now instead `cdn_url`
* Allow to create sync tables with a map if setting up onw from "connect dataset" from the Maps view
* Added [#5975 Box integration](https://github.com/CartoDB/cartodb/issues/5975).
* New rake to install in user or organization the geocoder extension
* Removing Bitly shortener.


3.11.0 (2015-09-09)
-------------------
* Synchronizations model now has a new field (and FK) to visualizations.id and joins to them using that instead of by matching name to canonical visualization's table name. It also gets deleted if FK dissapears.
* Code also switches to using syncrhonizations.visualization_id for linking, so in order to have back existing synchronizations, the following rake needs to be run: `bundle exec rake cartodb:populate_synchronization_visualization_ids`
* StatsD data gathering refactored. Check /lib/cartodb/stats for details
* Data library feature is not cartodb user dependent anymore. By default the username you defined in the common-data config section, will be used with your base url to query for public datasets to build your own data-library based on that user. You can define the `base_url` property and point to other domain to retreive the public datasets from that user. For example set to `https://common-data.cartodb.com` you are going to keep using the cartodb data-library. Please refer to the example configuration file (app_config.yml.sample) `common_data`section  to check how it could be configured
* New modals (removing old code & feature flag restricting access to new ones) [#5068](https://github.com/CartoDB/cartodb/pull/5068)
* Updated (most of) frontend dependencies [#5171](https://github.com/CartoDB/cartodb/pull/5171)
* Metadata is editable when datasets have a SQL Query is applied [#5195](https://github.com/CartoDB/cartodb/pull/5195)
* LDAP configuration & authentication system. If active deactivates standard CartoDB & Google authentications. See cartodb:ldap:create_ldap_configuration rake for how to create one, and source code of /app/models/carto/ldap for more details.
* Upgrade cartodb-postgresql extension to 0.9.4, which includes the new cartodbfy process. As part of this change new user tables won't have the columns `created_at` nor `updated_at`. See the [release notes](https://github.com/CartoDB/cartodb-postgresql/blob/0.9.4/NEWS.md) for more details.
* Added code coverage generation for tests suite. After a run, results will be stored at `coverage` subfolder
* Organizations can choose their authentication mechanisms.
* Fixed street addr tab for georeference modal for google maps/geocoder usage [#5281](https://github.com/CartoDB/cartodb/pull/5281)
* Privacy toggler within create dataset dialog [#5340](https://github.com/CartoDB/cartodb/pull/5340)
* Fixed maps disappearing after creation + navigation to dashboard [#5264](https://github.com/CartoDB/cartodb/issues/5264)
* Log.append now allows to disable truncating (by default active)
* Detection of lat/long columns now is done in `ogr2ogr2` rather than rails code [#5349](https://github.com/CartoDB/cartodb/pull/5349). In order to get this feature working (and some related tests), execute this to get the ogr2ogr2 package updated: `sudo apt-get update; sudo apt-get upgrade`. From this version on, the ogr2ogr2 package is mandatory. In order to install it: `sudo apt-get install ogr2ogr2-static-bin`.
* Removed Mixpanel tracking code [#5410](https://github.com/CartoDB/cartodb/pull/5410)
* Newly imported datasets now properly calculate the map bounds and zoom and store them
* Don't try to short url with bitly if credentials are not present in app_config.yml

### components versions
- [CartoDB v3.11.0](https://github.com/CartoDB/cartodb/tree/v3.11.0)
- [Windshaft-cartodb 2.12.0](https://github.com/CartoDB/Windshaft-cartodb/tree/2.12.0)
- [CartoDB-SQL-API 1.24.0](https://github.com/CartoDB/CartoDB-SQL-API/tree/1.24.1)
- [CartoDB.js 3.15.3](https://github.com/CartoDB/cartodb.js/tree/3.15.3)

3.10.3 (2015-08-13)
---
* Mailchimp decorator enables category wizard and legends [#3874](https://github.com/CartoDB/cartodb/pull/3874)
* Cache public and with link embeds in redis [#3733](https://github.com/CartoDB/cartodb/pull/3733)
* Unify caching of vizjsons and version keys [#3726](https://github.com/CartoDB/cartodb/pull/3726)
* Named maps created for all visualizations, regardless of layers privacy [#3879](https://github.com/CartoDB/cartodb/issues/3879)
* Added an [http client for ruby](https://github.com/CartoDB/cartodb/wiki/The-CartoDB-ruby-http-client) with some cool features
* SQLViews are editable when filtering [#3812](https://github.com/CartoDB/cartodb/pull/3812)
* Defaults Time Column to first date column or cartodb_id in Torque wizards [#4136](https://github.com/CartoDB/cartodb/pull/4136)
* Added more customized Google basemaps.
* New optional config option `maps_api_cdn_template` for static maps [#4153](https://github.com/CartoDB/cartodb/issues/4153)
* New `api/v2/viz/{id}/static/{width}/{height}.png` endpoint for retrieving static maps
* New twitter cards [#4153](https://github.com/CartoDB/cartodb/issues/4153)
* New facebook cards [#4280](https://github.com/CartoDB/cartodb/pull/4280)
* Improve email template [#4190](https://github.com/CartoDB/cartodb/pull/4190)
* Added `filter` option to layer_definition and named_map in vizjson [#4197](https://github.com/CartoDB/cartodb/pull/4197)
* Organization owners can reset users API keys.
* Log model improvements: Stores only upon finish (to hit way less the DB) and size constraints
* Updated cartodb.js to 3.15.1.
* [Stat loading times improves with Redis ZSCAN](https://github.com/CartoDB/cartodb/issues/3943). Redis 3.0.0+ is now required.
* Upgraded [cartodb-postgresql](https://github.com/CartoDB/cartodb-postgresql) extension to `0.8.0`. Run the following commands to get it installed in your system:
```
git submodule init && git submodule update
cd lib/sql; sudo make all install
```
* General security improvements: CookieStore now expires cookies after 7 days, always use SecureRandom for SID generation; Session management now invalidates other sessions upon password change
* Support for large (5k users) organizations.
* Added support for new basemaps with labels on top [4286](https://github.com/CartoDB/cartodb/pull/4286).
* Fixed multi-resource import (ZIP with >1 supported files, ArcGIS, etc.). Limited to 10 tables/files, except in the case of ArcGIS
* Ability to geocode tables shared with write permissions within an organization [#4509](https://github.com/CartoDB/cartodb/pull/4509)
* Layers are saved in bulk when re-ordered [#4251](https://github.com/CartoDB/cartodb/pull/4251)
* Improving test suite speed. Whenever possible, use global test users $user_1 and $user_2 (see TESTING.md for details)
* New optional config values varnish_management[:trigger_verbose] & invalidation_service[:trigger_verbose] to control output verbosity of invalidation services (set now by default to off only at testing)
* Better number normalization to support casting of currency strings [#4530](https://github.com/CartoDB/cartodb/pull/4530)
* Added in-database logging capabilities to geocodings [#4625](https://github.com/CartoDB/cartodb/pull/4625)
* New Maps without geometries no longer have zeroed-bounds
* Rake task `cartodb:redis:purge_vizjson` now also purges embeds [#4653](https://github.com/CartoDB/cartodb/pull/4653)
* Properly and fully disallowing multilogins, by killing other existing sessions upon login
* Added new Platform Limit for concurrent syncs per user. Currently 2 hours TTL, 3 syncs per user max. allowed
* Importer now tries to import shapefile zips without .prj file, by setting 4326 projection.
* Prevent geocoding and import polling requests from being queued up [#4980](https://github.com/CartoDB/cartodb/pull/4980)
* Prevent geocoding and import polling requests from being queued up [#4980](https://github.com/CartoDB/cartodb/pull/4980)
* Added new fields source, attributions, and license, to metadata modal [#5016](https://github.com/CartoDB/cartodb/pull/5016)
* Code related to pecan extracted to separate module [#4999](https://github.com/CartoDB/cartodb/pull/4999)
  * requires a `npm install` for grunt tasks
* New modals [#5068](https://github.com/CartoDB/cartodb/pull/5068)
* Now canonical tables store the bounding box at import time. It's also recalculated when `the_geom` change. This need to install the postgis extension in the metadata database

Bugfixes:
* Fixed deletion of layers upon disconnecting synced datasources [#3718](https://github.com/CartoDB/cartodb/pull/3718)
* Fixed some cache invalidation problems upon changes in privacy (embeds & vizjson) [#3755](https://github.com/CartoDB/cartodb/pull/3755)
* Fixed corner case with ghost table renames [#3762](https://github.com/CartoDB/cartodb/pull/3762)
* Added options to create dataset from query while on the map view [#3771](https://github.com/CartoDB/cartodb/pull/3771)
* Do not cache geocodes if the_geom is NULL [#3793](https://github.com/CartoDB/cartodb/pull/3793)
* Reverse order of varnish/redis invalidation [#3555](https://github.com/CartoDB/cartodb/pull/3945)

New features:
* Organization signup: [#3902](https://github.com/CartoDB/cartodb/issues/3902)
* Diagnosis page at http://localhost.lan:3000/diagnosis
* Remote/External sources now imported via a synchronization (that will sync monthly), and dissapear from the data-library section until the user unsyncs the dataset.

3.10.2 (2015-05-20)
---------
* Ongoing backend refactor and migration from Sequel to ActiveRecord.
* Frontend assets cleaning [PR 3563](https://github.com/CartoDB/cartodb/pull/3563).

#### Steps to avoid problems with submodules changes
```shell
# Before get last changes from master, let's remove the
# common submodule
git submodule deinit app/assets/stylesheets/common
# Clean tmp sass folder, avoiding possible compass problems
rm -rf tmp/sass/*
git pull origin master
git submodule sync
git submodule update --init
```

Bugfixes:
* Create import view throws uncaught error on canceling selected a file (2nd time) [#3379](https://github.com/CartoDB/cartodb/issues/3379).
* Removed old tags endpoint (https://github.com/CartoDB/cartodb/issues/3691).

3.10.1 (2015-05-05)
-------------------
* Fixes bug in the "No georeferenced data" dialog [#3449](https://github.com/CartoDB/cartodb/pull/3449)
* Adds user search/filter to the Share Dialog [3417](https://github.com/CartoDB/cartodb/pull/3417)
* Change default CartoCSS properties of polygon strokes [3375](https://github.com/CartoDB/cartodb/pull/3375)
* Fix custom image header templates [3378](https://github.com/CartoDB/cartodb/pull/3378)
* Adds field to select or type an administrative region in the georeferenciation by city name pane [3306](https://github.com/CartoDB/cartodb/pull/3306)
* Fix tooltips in the legend editor [3341](https://github.com/CartoDB/cartodb/pull/3341)
* Sort category names alphabetically in legends [3218](https://github.com/CartoDB/cartodb/pull/3218)
* Editable descriptions and tags in the maps and datasets view [3129](https://github.com/CartoDB/cartodb/pull/3129)
* Add caching of geometry types [#3157](https://github.com/CartoDB/cartodb/pull/3157)
* New public map [#3120](https://github.com/CartoDB/cartodb/issues/3120)
* Do not store session for api_key auth [#3208](https://github.com/CartoDB/cartodb/pull/3208)
* All connected services available in account page [#3025](https://github.com/CartoDB/cartodb/issues/3025)
* Fixed script to purge vizjson redis [#3354](https://github.com/CartoDB/cartodb/pull/3354)
* Fix guessing warnings when there are no rows [#3024](https://github.com/CartoDB/cartodb/pull/3363)
* Send geocoding duration metrics [#3381](https://github.com/CartoDB/cartodb/pull/3381)
* Several fixes for subdomainless configs [#3393](https://github.com/CartoDB/cartodb/pull/3393)
* Disable any kind of import guessing from create dialog [#3456](https://github.com/CartoDB/cartodb/issues/3456)
* Enable new dashboard for everyone by means of migration [#3509](https://github.com/CartoDB/cartodb/pull/3509)
* Enabled Google Maps Basemaps [#3429](https://github.com/CartoDB/cartodb/pull/3429)
* Remove need of api_key to enjoy common-data "Data library" [#3523](https://github.com/CartoDB/cartodb/pull/3523)

Bugfixes:
* Fixed interaction when there are hidden layers [#3090](https://github.com/CartoDB/cartodb/pull/3090)
* Fix http cancelled requests [#3227](https://github.com/CartoDB/cartodb/pull/3227)
* Added HTTP timeouts for all HTTP calls on imports and syncs. Connect timeout is 60 secs, data requests calculate using (user quota / 50KB/sec) estimation.
* Fix for "Cannot read property 'layers'" [#3302](https://github.com/CartoDB/cartodb/pull/3302)
* Fix for type guessing in synchronization imports [#3264](http://github.com/CartoDB/cartodb/issues/3264)
* Deleted unused endpoints for POST/DELETE api/v1/maps
* Avoid infinite recursion when renaming table [#3330](https://github.com/CartoDB/cartodb/pull/3330)
* Script to delete inconsistent vizs [#3342](https://github.com/CartoDB/cartodb/pull/3342)
* Fixed problem rendering Lato font [#3461](https://github.com/CartoDB/cartodb/issues/3461)

3.10.0 (2015-04-08)
-------------------
* Internal code refactor to allow to disable subdomain-based general application behaviour, to rely instead on URIs like 'domain.com/u/USER/...', or allow to have both systems working at the same time (subdomainless and with subdomain)
  - New Config entry: 'http_port' (see config/app_config.yml.sample for further details)
  - New Config entry: 'https_port' (see config/app_config.yml.sample for further details)
  - New Config entry: 'subdomainless_urls' (see config/app_config.yml.sample for further details)
  - More info about this feature can be read at https://github.com/CartoDB/cartodb/wiki/How-to-setup-subdomainless-URLS
* Major refactor of the `Table` class: extract the `UserTable` model from it [#2775](https://github.com/CartoDB/cartodb/pull/2775)
* Update common data metadata task [#2741](https://github.com/CartoDB/cartodb/pull/2741)
* Guessing of namedplaces on import [#2809](https://github.com/CartoDB/cartodb/pull/2809)
* Fixed Google+ disconnection in new dashboard [#2378](https://github.com/CartoDB/cartodb/issues/2378)
* Added script to purge redis vizjson cache [#2968](https://github.com/CartoDB/cartodb/pull/2968)
* Allows to generate a static map of a password protected visualization [#3028](https://github.com/CartoDB/cartodb/pull/3028)

Bugfixes:
* Removes duplicated maps in the delete warning dialog [3055](https://github.com/CartoDB/cartodb/pull/3055)
* Fix "all" infowindow field switch [3021](https://github.com/CartoDB/cartodb/pull/3021)
* Fix "create table from query or clear view" banner covers zoom overlay and search box [#2762](https://github.com/CartoDB/cartodb/pull/2762)
* Fix Changing email requires new password [#2764](https://github.com/CartoDB/cartodb/pull/2764)
* Fix "Update in multi-user account" [#2794](https://github.com/CartoDB/cartodb/pull/2794)
* Fix incorrect quota value in dropdown [#2804](https://github.com/CartoDB/cartodb/issues/2804)
* Fix Columns are no longer alphabetically ordered in the table view [#2825](https://github.com/CartoDB/cartodb/pull/2825)
* Fix user creation with org [#2831](https://github.com/CartoDB/cartodb/pull/2831)
* Fix sync tables state changes [#2838](https://github.com/CartoDB/cartodb/pull/2838)
* Add specific error for wrongly encoded CSV files [#2847](https://github.com/CartoDB/cartodb/pull/2847)
* Fixed infinite loop saving overlays #2827
* New index for visualizations.parent_id [#3017](https://github.com/CartoDB/cartodb/pull/3017)
* Fix sanitization issues in custom HTML infowindows [#3059](https://github.com/CartoDB/cartodb/pull/3059)

3.9.0 (2015-02-13)
------------------
* New user account & profile management pages, inside CartoDB Editor.
* Fixed UNIX timestamps converted to a date column loses time [#990](https://github.com/CartoDB/cartodb/issues/990)
* Fixed Column wkb_geometry appears when importing [#2107](https://github.com/CartoDB/cartodb/issues/2107). Needs updating `ogr2ogr2-static-bin` package.
* Added Hubspot for usage statistics [#2575](https://github.com/CartoDB/cartodb/pull/2575)
* Updates cartodb.js to 3.12.11
* Fixes update table as statements from the editor #2620
* Fixes the showing of map previews in the delete items dialog #2639
* New organization pages done
* Hiding SaaS links in open source edition [#2646](https://github.com/CartoDB/cartodb/pull/2646)
* Allows to remove overlays using the backspace key.
* Update favicon to retina [#2686](https://github.com/CartoDB/cartodb/issues/2686)
* Change new dashboard search behaviour [#2628](https://github.com/CartoDB/cartodb/issues/2628).

Bugfixes:
* Fix layer refresh when the method of a density visualization changes [#2673](https://github.com/CartoDB/cartodb/issues/2673)
* Fixes an error that preventing the load of WMS layers.
* Fixes an unncessary binding that made the dashboard reloading twice.
* Fix markdown from descriptions not rendered correctly in dashboard view [#2572](https://github.com/CartoDB/cartodb/issues/2572)
* Fix new dashboard URLs creation [#2662](https://github.com/CartoDB/cartodb/pull/2662)
* Redirect to list on delete table vis [#2697](https://github.com/CartoDB/cartodb/pull/2697)
* Fix account settings order [#2700](https://github.com/CartoDB/cartodb/pull/2700)
* Fix geocoding by Lon/Lat: refresh the table [#2699](https://github.com/CartoDB/cartodb/pull/2699)
* Fix multiuser quota is not well calculated in multiuser dashboard [#2722](https://github.com/CartoDB/cartodb/pull/2722)
* Fix new public pagination [#2716](https://github.com/CartoDB/cartodb/pull/2716)
* Fix contrast for nav buttons [#2696](https://github.com/CartoDB/cartodb/pull/2696)
* Fix top/bottom padding for delete dialog [#2721](https://github.com/CartoDB/cartodb/pull/2721)
* Fix filters view's search component behavior [#2708](https://github.com/CartoDB/cartodb/pull/2708)
* Fix bubble wizard legend not being updated on column change [#2747](https://github.com/CartoDB/cartodb/pull/2747)

3.8.1 (2015-02-26)
------------------
* Added config for basemaps [#1954], see
  [documentation](https://github.com/CartoDB/cartodb/wiki/How-to-configure-basemaps-in-CartoDB)
* Added oEmbed support for visualizations [#1965](https://github.com/CartoDB/cartodb/issues/1965)
* [content guessing] Prioritize ip over country guessing [#2089](https://github.com/CartoDB/cartodb/issues/2089)
* Added new import error code (6667) for detecting and reporting statement timeouts.
* Fixes creation of a visualization from a table [#2145](https://github.com/CartoDB/cartodb/issues/2145)
* Changes the way geometry types are loaded client side (performance), see PR [#2189](https://github.com/CartoDB/cartodb/pull/218)
* Cache the geometry types in table model server side (performance), see PR [#2165](https://github.com/CartoDB/cartodb/pull/2165)
* Added PlatformLimits service. Includes an importer maximum file size limit.
* Added PlatformLimits importer max resulting table row count limit.
* Fixed incompatible data for wizards [#1942](https://github.com/CartoDB/cartodb/issues/1942)
* Added map previews in the delete table dialog
* Fixed adding Mapbox basemaps.
* Captures 4XX exceptions when loading faulty map preview
* Adds static maps export dialog
* Added new public pages [#2034](https://github.com/CartoDB/cartodb/pull/2142)
* Added API keys and OAuth pages [#2142](https://github.com/CartoDB/cartodb/pull/2142)
* Replace 404 error page
* Only send JS errors+stats in production [#1987](https://github.com/CartoDB/cartodb/pull/1987)
* Read Content-Type header for downloads without extension [#2275](https://github.com/CartoDB/cartodb/issues/2275).
* Cache vizjson in redis to avoid hitting DB [#2194](https://github.com/CartoDB/cartodb/pull/2194)
* Update Browserify to latest version (9.0.3) [#2449](https://github.com/CartoDB/cartodb/pull/2449)
* Remove tmp and unused files [#2328](https://github.com/CartoDB/cartodb/pull/2328)
* Open privacy dialog directly from items [#2442](https://github.com/CartoDB/cartodb/pull/2442)
* Fixes error handling when adding an erroneous WMS URL.
* Do not send visible=false layers for static previews
* Add new fields to data_import [#2257] and the feature of being able to create and redirect to a derived visualization after importing data (via import api new param `create_vis`)
* Add loading+error state for privacy dialog [#2484](https://github.com/CartoDB/cartodb/pull/2484)
* Change visuals in share view of privacy dialog [#2492](https://github.com/CartoDB/cartodb/pull/2492)
* Added back Twitter import for new create dialog.
* Adds random quotes in the loading screens.
* Improved speed in dashboard caching frontend side [#2465](https://github.com/CartoDB/cartodb/pull/2465)
* Add user_defined_limits to DataImport, and the feature of imports to support certain user defined limits. Currently only used for `twitter_credits_limit` at importer create endpoint.
* Improve new pagination [#2529](https://github.com/CartoDB/cartodb/pull/2529)

Bugfixes:
* When being in any configuration page remove the arrow from the breadcrumb [#2312](https://github.com/CartoDB/cartodb/pull/2312)
* Pressing enter when deleting a table opens a new modal [#2126](https://github.com/CartoDB/cartodb/pull/2126)
* Deselect all doesn't work [#2341](https://github.com/CartoDB/cartodb/issues/2341)
* Fixes for new dashboard texts [#2499](https://github.com/CartoDB/cartodb/pull/2499)
* Fixes a problem generating images from private visualizations of private org users.
* Remove lighter font weights [#2513](https://github.com/CartoDB/cartodb/pull/2513)
* Fix quota usage rounding [#2561](https://github.com/CartoDB/cartodb/pull/2561)

3.8.0 (2015-01-30)
------------------
* Mailchimp user lists importer dataset.
  New Config entry-set: ['oauth']['mailchimp'] (see config/app_config.yml.sample for further details)
  Requires also a feature_flag enabled either globally or to a specific users: 'mailchimp_import'
* Added icon font source ([how to make changes](http://github.com/CartoDB/cartodb/blob/master/app/assets/fonts/icon_font/README.md))
* Integrated Olark chat within CartoDB editor
* IP guessing on import: try to georeference the imported table by IP if there's no other geocodifiable column [#1149](https://github.com/CartoDB/cartodb/issues/1149) [#1822](https://github.com/CartoDB/cartodb/pull/1822)
* Disable georeference by feature flag (georef_disabled) [#1227](https://github.com/CartoDB/cartodb/issues/1227)
* Faster excel imports [#913](https://github.com/CartoDB/cartodb/issues/913). You'll need to install `csvkit`. Either do `pip install --no-use-wheel -r python_requirements.txt` or `pip install csvkit`.
* Added `total_user_entries` to viz endpoint, to know the total amount of own visualizations/tables/both (shared don't count). If unauthenticated counts only public items.
* Added Mailchimp 'members count' info [#1701](https://github.com/CartoDB/cartodb/issues/1701)
* Added slides support for visualization
* Added guessing of types for geojson (boolean and dates) via ogr2ogr2 [#1036](https://github.com/CartoDB/cartodb/issues/1036). Update `ogr2ogr2-static-bin` package for this to work
* Fixed param `quoted_fields_guessing` on imports and syncs [#1966](https://github.com/CartoDB/cartodb/issues/1966)
* Background importer for new dashboard.

3.7.1 (2014-12-30)
------------------
* New features
  - GET /api/v1/viz/ always sorts by descending order if `order` param set, and this supports new filters: `mapviews`, `likes`, `size`, `row_count`
  - GET /api/v1/viz/ returns more totals:
        `total_likes` (visualizations count with likes, filtered to public for unauthenticated calls,
        `total_shared` (visualizations count shared to the user, 0 for unauthenticated calls)

3.7.0 (2014-12-18)
------------------
* New features
 - Improved import flow for big S3 updates (if configured). Now everything >50MB won't be uploaded synchronously to S3,
   but queued instead (new DataImport state "enqueued"), so that a new cartodb:upload_to_s3 rake (intended to be run
   from a cron) performs asynchronously this upload and then normal import flow proceeds as before.
   New Config entry: ['importer']['s3']['async_long_uploads'] (boolean)
 - GET /api/v1/viz/ now works unauthenticated too, returning only the public tables of the subdomain's cartodb user.
 - GET /api/v1/viz/ supports new 'shared' filter, with values 'yes'/'no'/'only' to return all tables/visualizations including shared, excluding shared or only if are shared.

3.6.1 (2014-12-19)
------------------
* Updates torque library with several fixes
* Adds new fonts

3.6.0 (2014-12-15)
------------------
* New features
 - First version of new dashboard
 - Added Browserify for frontend development (check [this doc](https://github.com/CartoDB/cartodb/blob/master/CONTRIBUTING.md#grunt))
 - Several improvements to raster imports

3.5.0 (2014-12-11)
------------------
* New features
  - Likes on Visualizations & Datasets lists. Also prepared backend code for inminent like button on public map pages.
 * Fixed bugs and improvements
   - fixed metadata tables being dropped if they were in more than one account #1349

3.4.1 (2014-12-01)
------------------
 * Fixed bugs and improvements
   - Modified signature of cartodb:db:load_functions rake task, to both reduce required params (added default values) and
     allowing to specify a cartodb-postgresql extension version, so existing users can keep with their versions while
     load_functions loads (optionally) a different one.

3.4.0 (2014-12-01)
------------------
* New features
  - Raster import: Drag & drop geotiff files to get them imported into cartodb. Cannot be viewed yet, but can used from PostGIS. NOTE: Raster overviews import is not yet fully working, this release handles streamlined import itself.
    This requires a rake to run to activate raster for users ("cartodb:db:grant_general_raster_permissions").

3.3.1 (2014-11-25)
------------------
 * Fixed bugs
   - Country guessing: normalize content before checking for duplicates.

3.3.0 (2014-11-24)
-------------------
 * New features
  - Shows a warning message when editing a visualization that has a Google Maps basemap.

3.2.15 (2014-11-21)
-------------------
 * Fixed bugs and improvements
   - ContentGuesser: added param for sync and import APIs, checks for different id columns, performance metrics, etc.
   - Country guessing fix: must be done with at least 2 chars.
   - Geocoding: fixed geocoder by postalcode when column type is numeric
   - #1095 Add feature button in Torque maps

3.2.14 (2014-11-17)
-------------------
 * Fixed bugs
   - Geocoding: change "Place" by "Country" in City name and Postal code options.
   - ContentGuesser: use index scan instead of seq scans in DB queries

3.2.13 (2014-11-14)
-------------------
 * Fixed bugs
   - Timeouts in internal geocoder #1152

3.2.12 (2014-11-13)
------------------
* New features
  - Country guessing on import. Figure out if any column contains country information and automatically geocode the table. Depends on the geocoder. Take a look at the entry `content_guessing:` in `config/app_config.yml.sample`
* Fixed bugs
  - Remove cumulative option for torque cat. wizard #903

3.2.11 (2014-11-11)
------------------
* New features
  - Removal of 19 unused or no longer needed gems
  - Allows to show an 'available for hire' banner in your public profile.
* Fixed bugs
  - Fixed internal geocoder for org users


3.2.10 (2014-11-07)
------------------
* New features
  - Mapviews graph for everybody.
  - New rainbow basemaps.
* Fixed bugs
  - Made lib/sql git submodule point to 0.4.1 tag
  - Batch internal geocoder update queries to avoid db timeouts

3.2.9 (2014-11-03)
------------------
* New features
  * Implemented raster import into the editor. Only table import, yet no viewer/editor.
  * Enabled ghost tables. Tables created with SQL API are visible in the editor. See [documentation](https://github.com/CartoDB/cartodb/wiki/creating-tables-though-the-SQL-API)
  * Enables fullscreen for IE11.
  * Deprecate GMaps support, substitute GMaps basemaps with equivalent ones for Leaflet instead (#1061)

3.2.8 (2014-11-03)
------------------
* New features
  * Added dynamic_cdn_enabled flag to the users.
  * Improved emails upon import completion.
* Fixed bugs
  * Added retries system to Named Maps update actions, so if hits a tiler template lock tries again.
  * Added some invalid column names to the reserved words list(s), but now upon importing or renaming columns, we rename to _xxxxx if xxxxx is a reserved word.
  * Trim columns to be able to geocode columns/strings with leading/trailing whitespaces

3.2.7 (2014-10-23)
------------------
* Public pages reviewed
* New header in public pages

3.2.6 (2014-10-22)
------------------
* New features
  * Annotation overlay.
  * Stamen basemaps.
  * Optimization: Map creation no longer performs tiler calls to set the tile style.
  * Optimization: viz.json rendering now doesn't requests for named map if needs to, using the visualization and layers to recreate required fields.
  * Twitter datasource now allows N custom GNIP configurations, per username or per organization name.
  * Optimization: Added more DB indexes based on slow queries logs.
* Fixed bugs
  * Send the visibility status of the torque layer in the vizjson
  * Importer specs back to work. If any fails please update GDAL and take a look at "Raster import support".

3.2.5 (2014-10-13)
------------------
* New features
  * ArcGIS import integration (includes new app_config.yml values)
  * Detection of imports without tables registered and marking them as failed
  * Adds property toolbar to style and control the image and text overlays.
  * CSV import type guessing (performed via OGR2OGR). Disabled by default, to enable install ogr2ogr2-static-bin package and modify configuration

3.2.4 (2014-10-06)
------------------
* New features
  * Upon table creation no tile style call performed anymore. Still done upon layer/map change, though.
  * Send an email upon completion of an import if it takes more than 5 minutes.
  * Twitter search API uses geo-enrichment if present. Also there's a customized organizations list too now.
  * The mobile editor resembles to the mobile layout of the embed maps.
  * Removed force_mobile flag from the embed maps.
* Fixed bugs
  * Geocoding a table with 0 geocodificable rows throws error

3.2.3 (2014-09-30)
------------------
* New features
  * Added ability to disable high resolution geocoding batch api by config
* Fixed bugs
  * Missing geocoding type (Admin regions, country column, polygons)

3.2.2 (2014-09-29)
------------------
* New features
  * Improved torque rendering on pause or static datasets
  * Improved mobile layout
  * Improved Geocoder UI
  * Refactor of InternalGeocoder

3.2.1 (2014-09-05)
------------------
* New common data section
* New features
  * Upgrades to 0.4.0 cartodb postgresql extension version

3.2.0 (2014-08-27)
------------------
* New Features
  * Twitter datasource, unsing Gnip Search API. Introduces new app_config.yml fields (search for 'datasource_search')

3.1.0 (2014-08-25)
------------------
* New features
  * Varnish HTTP invalidation support
  * Dynamic generation of sitemap.xml with public visualizations/tables for users
* Fixed bugs
  * public map uses CORS headers to fetch user info
  * infowindow on hover fixed on table mode
  * fixed table export dialog when SQL query without geometries is applied
  * fixed wrong replace executing SQL on multiuser accounts

* Enhancements
  * CartoDB PostgreSQL extension versioning more flexible based on semver

3.0.1 (2014-08-07)
------------------
* New Features
  * Mail notifications when sharing or unsharing objects in organizations
  * Publication system: you can now add text and images on top of your maps!
  * New basemap selector
  * Simplified share dialog
* Fixed bugs
  * Fixed write buttons are shown when watching sync tables
  * Fixed a bug that prevented choosing a different column from the default to geocode an IP address
  * Fixed some avatar tests
  * Upgrades to 0.3.4 cartodb postgresql extension version:
    * 0.3.4: fixes CDB_QueryTables function
    * 0.3.3: splits cartodbify
    * 0.3.2: makes 0.3.0dev version upgradeable

3.0.0 (2014-07-15)
------------------
* New Features
  * Multiuser support
  * Added avatar_url to ::User model
  * Added custom avatars
  * Added Permission model and permission attribute for Visualizations
  * Activated Sequel extension connection_validator.
    This requires adding to database.yml a value for 'conn_validator_timeout',
    else code will default to 900 seconds
  * Several minor improvements

* Fixed bugs
  * Security fix regarding Typhoeus library
  * Several minor bugs

* Migration Type (see UPGRADE): Mandatory migration
  * As stated by the README, PostgreSQL now MUST be at least 9.3 to avoid search_path errors
  * Cartodb postgres extension update to 0.3.0
  * Also mandatory to run:
    * rake cartodb:db:create_default_vis_permissions
    * rake cartodb:db:populate_permission_entity_id

2.14.3 (2014-06-11)
-------------------
* Fixed bugs
  * Last used colors working properly in color-picker.
  * HTML template working properly for header infowindows.
  * Make import_id visible for any kind of import error.
  * Values from unknown column type are displaying correctly.
  * Custom title within SQL and CartoCSS editor fixed.
  * allow "rectangle" option for marker-type in torque layer
  * now enqueing sync tables who are in state syncing for more than 2 hours
      (caused by pushing code while syncing a table)
  * fixed torque wizard for google maps
  * fixed infinite loop in CDB_QueryStatements (again)
  * fixed problem executing long queries from the editor
  * By default, now not verifying SSL certificates for data imports (allow customer dev. environments with https)
  * Import CSV with invalid UTF-8 characters by replacing them (instead of skipping the whole row)
  * stop sending stats from public views after some time
  * Now installing and using [Cartodb-postgres extension](https://github.com/CartoDB/cartodb-postgresql) (current 0.2.0)

* New features
  * Tumblr-widget available in dashboard where a new post is published.
  * Added a log method for db_maintenance rakes
      (logs to log/rake_db_maintenance.log).
      For now used on load_functions.
  * Added avatar_url to ::User model

* Migration Type (see UPGRADE): Mandatory migration
  * Check also [installtion steps](https://github.com/CartoDB/cartodb-postgresql#install) for cartodb postgres extension


2.14.1 (2014-05-28)
-------------------
* New features
    * Upgraded UPGRADE doc and required rakes to run
    * Added new aux method to do future code cleanups in rakes : execute_on_users_with_index
    * Added user_id to Visualization Model
    * Added specs for table model, checking the_geom conversions
    * Improve merge tables log info
    * Allows adding custom legends in Torque maps
    * SEO in public pages

* Fixed bugs
    * Converting the_geom causes drop that fails due to trigger (PR477)
    * Excel2CSV gem messes up with atypical UTF-8 characters
    * ogc_fid not being removed after import
    * Creating table from sql query actually creates two tables
    * Fixes a bug with the default values for the choropleth legends

* Migration Type (see UPGRADE): Mandatory migration
    * Also mandatory to run (in this order as fist one sets functions used by second one):
        * rake cartodb:db:reset_trigger_check_quota
        * rake cartodb:db:load_functions


2.14.0 (2014-05-20)
-------------------
* New features
  * Adds markdown support for descriptions
  * New WMS proxy server
  * SQL based table CartoDBfication
  * New rake tasks
  * Migrate user quota on cartodb extension creation from unpackaged
  * Complain if script is sourced in psql, rather than via CREATE EXTENSION

* Fixed bugs
  * Bug fixing and stabilization
  * Improve error detection in viz.json action
  * Ruby code no longer loading import files in memory, but streaming them in chunks upon: uploading to server, uploading to AS3, downloading from AS3/server
  - lib/sql modifications:
    * Remove CDB_SearchPath.sql from the set of scripts loaded directly (#466)
    * Do not call CDB_Invalidate_Varnish() if not owned by a superuser
    * Refuse to create new extension if legacy code is present on database
    * Fix extension requires directive



2.13.5 (2014-05-13)
-------------------
* New features
  * Infowindows on Hover
  * SQL functions moved to a Git submodule
  * CDB_CheckQuota improved in preparations for SQL-Based table CartoDBfier

* Fixed bugs
  * Cluster wizard font sizes are scaling very cleanly
  * Big files imports/data syncs timeout or OOMs
  * Default avatar requests not using https
  * A transparent line appears within infowindow in last Chrome version
  * Add new accepted formats in Dropbox sync
  * Change error when importing a file and there is not enough quota left
  * When a custom tooltip is applied in a layer, if you reload the browser, it doesn't appear anymore
  * If you select fields with null values, it displays neither title nor value on the new tooltip (infowindow on hover)
  * Username is not appearing in that user profile (link in description)


2.13.5 (2014-05-13)
-------------------
* New features
  * Infowindows on Hover
  * SQL functions moved to a Git submodule
  * CDB_CheckQuota improved in preparations for SQL-Based table CartoDBfier

* Fixed bugs
  * Cluster wizard font sizes are scaling very cleanly
  * Big files imports/data syncs timeout or OOMs
  * Default avatar requests not using https
  * A transparent line appears within infowindow in last Chrome version
  * Add new accepted formats in Dropbox sync
  * Change error when importing a file and there is not enough quota left
  * When a custom tooltip is applied in a layer, if you reload the browser, it doesn't appear anymore
  * If you select fields with null values, it displays neither title nor value on the new tooltip (infowindow on hover)
  * Username is not appearing in that user profile (link in description)

2.13.4 (2014-05-08)
-------------------
* Improvements
  * Indent html in the legends html editor
  * Revamp geocoreference modal window
  * Include import ID in import error popup
  * Add POI option in the geocoder dialog

* Bugfixes
  * Applying a custom pattern image for polygons, it triggers the change event twice
  * Rename sequence when renaming a table
  * In the tags selector, order them alphabetically
  * Timeout should be lifted for Georeferencing
  * Bubble Legend doesn't refresh the labels when the field is changed
  * Disallow some html keywords in infowindow and legends editor
  * Incorrect message on table syncing
  * Make links on visualization decriptions linkable
  * Named maps wrapper should throw an exception on missing internal tiler config
  * Don't fetch the_geom and the_geom_webmercator when a sql query is applied
  * When trying to change table name and have a query applied, open a dialog / tipsy
  * Geocoding by zip fixes
  * After applying a wizard to a layer, and then changing a numeric property in the
    CartoCSS, it is not changed in the wizard panel.
  * When creating a new visualization, we should add some url_options by default
  * Can't create table from scratch
  * Pagination in public pages doesn't work correctly
  * No error shown in MapView UI when sql does not select "the_geom_webmercator"
  * JS in the login view is not being initialized
  * Maki icons with 24 pixels of height is being rendered weird
  * EXPLAIN an EXPLAIN ANALYZE does not work from the UI
  * Export fails on private tables
  * Vizualization specs do not honour configuration database name
  * Importing a big shapefile fails with no error message
  * when a filter is applied sometimes the generated sql is wrong
  * HTTPS problem when exporting tables in Firefox
  * Requests to the SQL API are always done using the port 80
  * When adding an X/Y/Z layer as basemap dont check for tile 0/0/0 as it might not
    always be there
  * Change error code style when an import fails


2.13.3 (2014-04-29)
-------------------
* Improvements
  * Add 'sync now' link on the sync tables
  * Create a default options modal window
  * When a layer is selected and the user clicks on the layer name, show a tipsy telling that double click allows to rename it
  * Add button for going to public page on the "SHARE" window (embed map)
  * Possibility to filter by different values in the same column [TABLE FILTERS]
  * Mock WMS call in tests
  * Take the new icons window a bit higher when opening

* Bugs
  * use maker-fill-opacity instead marker-opacity in wizards
  * WMS base layer not working with GeoServer w/ proper projection
  * Adding an empty description to a table prevents for changing it later
  * Close infowindow when other wizard is selected
  * Equal interval is actually doing another Quantile
  * polygon-opacity:undefined when adding a pattern-fill to a polygon
  * Add a link in the public view pointing to embed map page
  * Properly report long import timeouts messages
  * Sync Tables loses CartoCSS when sync
  * line-width: 0 render lines with width > 0 in torque
  * column options show "clear view" when you have no query applied
  * change filter in frontend to use new sql api params
  * Improve sync tables exception bubbling
  * improve compass compiling in development

2.13.2 (2014-04-16)
-------------------
* Improvements
  * Fix problem when the geocoding cache API is slow
  * [Geocoder] Do not use external APIs to geocode latitude/longitude
  * Geocoding window to allow IP Address geocode
  * New icon sets on the UI
  * Embeds in public page

* Bugs
  * Refactor column type change to date
  * Equal interval is actually doing another Quantile
  * Add success message on georeference
  * master branch tests stabilization after uuids migration
  * Give (more)/better info when georeferencing with admin regions fails
  * Failing sync tables from Dropbox Public folder
  * Create a default color for null values within cloropeths visualization
  * Unselecting all the fields in the filter widget produces an ugly query
  * When being a view mode warn that you cannot operate in contextual menus
  * tags are align-center instead of align left on the public tables list
  * Avoid each_char in CSV normalization but detect wrong multilines
  * When a geocode process fails, the background geocoder (the bar at the left bottom) is still visible
  * Fix error when creating organization users
  * Incorrect map count in map page
  * Retrieve more data in the geocoding response
  * Provide a default random name for url-based imports
  * "Map doesn't exist or private" for free user with public map
  * Change privacy button for dropdown doesn't work
  * Amazon S3 throws 403 on HEAD verb
  * Setup the backend to store the visualizations params
  * _setCustomVar for public pages

2.13.1 (2014-04-11)
-------------------
* New Features
  * Add Midnight commander basemap
  * oAuth-based Google Drive and Dropbox integration

* Bugs and improvements
  * When georeferencing by lon/lat columns, convert strings to number first
  * Missing fonts in account assets
  * Map views graph display error
  * Color picker bindings still persist after it is cleaned
  * Sql query editor no longer breaks if you add '\'
  * Review last used colors functionality on color picker.
  * Proxima Nova and SEGOE UI fonts are not being loaded using IE9 in Windows 7
  * Typo on "No georeferenced data on your table" window
  * Fixed crash when user wants to delete a layer from a visualization
  * Public dashboard footer no longer gets rendered in private dashboard
  * Logged-in detection in public pages
  * "CartoDB" link points to your public profile page
  * Fix sublayer_options sharing in the public_dashboard
  * Error when creating public vizz
  * Fix line-height of the tags in the public dashboard


2.13.0 (2014-04-08)
-------------------
NOTE: This version introduces another kind of privacy setting: "Link-only".
Now visualizations and tables which are public are listed by default on user pages.
Due to this, you may want to turn all your Public tables and visualizations to
"Link-only" state. To do this, just run the following SQL query on your metadata
database:

```
UPDATE visualizations
SET privacy='link'
WHERE privacy='public';
UPDATE user_tables
SET privacy=2
WHERE privacy=1;
```

* New features
  * Public User Pages: now users have a public dashboard on their CartoDB homepage
    which will show all the public visualizations and tables on their account.
  * Add new "link-only" privacy status for tables.

* Improvements
  * New endpoint to extract user information

* Fixed bugs
  * Using CartoDB.js, if you create a layer from a viz.json url, and then try to
    hide it, its interaction still works
  * Fixes in session handling when multuple users are logged at the same time
  * Run a update to change all paid users public visualizations from public to link
  * Torque layer offsets when several layers in public page


2.12.0 (2014-04-04)
-------------------
* Improvements
  * Frontend code (JS) is now no longer compiled using the assets pipeline. You can
    use the asset_host setting on app_conflg.yml to point to assets on our own CDN
    or to your own ones if you compile them manually using Grunt.
    For more details, look at lib/build/UPGRADING.md.
  * Automate frontend unit tests

2.11.2 (2014-03-27)
-------------------
* Bugs Fixed
  * Public map is not loaded using https.
  * Public table fails on order by.
  * Clear view raises wrong sql query.
  * Ugly error on Table name change.
  * Increase map height in the public_map page.
  * Torque layer raises an exception in google maps.
  * Normal sync tables do not properly log errors.
  * All rows returned at once from queries written in the SQL pane.
  * In the layer selector, if you unselect all the layers, and then only activates one, the infowindow is neither appearing nor working.

2.11.1 (2014-03-20)
-------------------
* Improvements
  * Improved Cluster Wizard.
  * Changed behaviour in the asset manager dialog.
  * Alternative automatic geocoding from tab delimited uploads over X rows.
  * Enable mouse wheel when the map is in fullscreen mode.

* Bugs Fixed
  * Small fixes in the public map page.
  * Public pages map center does not correspond with share dialog.
  * Scrolling infowindows in the public_map page scrolls the whole map.
  * Fixed padding in the public table list.
  * Click over lock should open privacy window.
  * Importer: cannot guess content-type from http header.
  * Styles are wrongly set after renaming a freshly imported table.
  * Added a row of last colours used in the visualization (on the wizards) in the colorpicker.
  * Using a cartocss variable makes the UI to stop working. It does not apply new styles.
  * Table renaming "unlinks" tables and vis sometimes.
  * Creating a visualization from a table does not add the table.
  * When cluster wizard is applied and using a filter, a message of 'interaction is disabled' appears.
  * Small typo when free user tries to switch to private.
  * Using the new color picker in the CartoCSS editor, after choosing a default color, we should not lose the focus in the editor.
  * Table UI won't reload after successful geocoding.
  * Do not escape single quotes in category wizard.
  * Infowindow fields are renderer in reverse order.
  * Import files containing lat/lon with ',' instead of '.' break.
  * Infowindow content is not being loaded using https when embed is loaded with https.

2.11.0 (2014-03-10)
-------------------

IMPORTANT NOTE
==============
From this release, CartoDB uses UUIDs instead of IDs to reference to all objects on
the database, so that it is being able to work on distributed environments much
reliably.

Your database would need manual upgrade in order to use this CartoDB version.

We have created a script to help you migrate your database. Even this script has
been tested on production environments by us, we highly encourage
to make a FULL backup of your database before running it.
This backup should involve both PostgreSQL metadata and user data databases
and redis metadata database.

In order to run this migration you need to stop your application and make sure
that there is not any connection to your databases while you run the script.

After you run the migration script manually you will need to run the rails
migration task as usual.
This migration will detect that your database is already in the right state and will
continue normally (and won't work until you do so).

Notice that this migration is mandatory in order to use this CartoDB version
and any other future version. Also, versions starting with this one are
incompatible with the old database schema with integer based ids.

These are the steps you need to follow in order to run the manual script:
```
  $ cd <application_root>
  $ export RAILS_ENV=<rails_env>
  $ export DBNAME=<your_postgresql_database_name>
  $ export DBHOST=<your_postgresql_database_host>
  $ export DBUSER=<your_postgresql_database_user>
  $ export DBPORT=<your_postgresql_database_port>
  $ export REDIS_HOST=<your_redis_host>
  $ bundle exec ruby ./script/migrate_to_uuid.rb schema
  $ bundle exec ruby ./script/migrate_to_uuid.rb meta
  $ bundle exec ruby ./script/migrate_to_uuid.rb data
  $ bundle exec ruby ./script/migrate_to_uuid.rb clean
```

Now, back to the new features!

* New Features
  * All metadata storage is now UUID-based
  * Implement new public map page
  * Implement new georeference options
  * Implement new geocoder logic in the backend, allowing to geocode by regions
    using open data

* Bugs Fixed
  * Improvements of traces for Sync Tables
  * Fix errors when deleting user databases on distributed environemtns
  * Show in color-picker all the colors you are using in your visualization
    (colors from other layers and so on)
  * Make cartodb UI work without Google Maps JS
  * Fix error with geocoder row counts
  * Changed XYZ test preventing server issues
  * Changed color picker interaction
  * Prevent default actions from new share buttons
  * Fix several JS specs
  * Disable statsc collection in https from embed to avoid security problems
  * Adding a table to a public visualization changes the privacy of the vis
  * Full screen options are enabled by default for public visualizations
  * Empty the_geom from CSV no longer imports to "" instead of NULL
  * Trying to change a password no longer returns unauthorized
  * User destroy no longer fails when she/he has named maps
  * /api/v1/tables returns 404 when table does not exist


* Improvements
  * Integrate JavaScript error handling reporting
  * Add db migrations to alter the schemas to uuid
  * Activate fullscreen button on embeds by default
  * When adding a color, add a thumbnail close to the HEX value on the cartocss
      editor

2.10.1 (2014-03-03)
-------------------
* Improvements
  * Improved invalid WMS layers feedback.
  * Buttons for the Embeds
  * Added an alert so the user knows when a private map viz.json is used.
  * Allow CSVs with multiline inside for importing.

* Bugs Fixed
  * Legend number is null when apply filter.
  * Metatile with too many features is messing up some maps.
  * Problems importing a kml.
  * Problem with sequel and columns with same name in different schemas.
  * Changed embed to open password dialog when visualization needs password.
  * Infowindow data is cached when feature is edited.
  * SQL is being send in viz.json for torque layer with named maps.
  * 'searchControl' doesn't work using CartoDB.js and a viz.json.
  * Legends should be activated by default after applying a choropleth / category / intensity / etc... wizard.
  * named maps does not manage queries with !bbox!
  * Roo Excel import Ruby gem takes too long on big files.
  * If user types a non valid number within a number widget, a JS error appears.
  * viz.json includes wrong layer_index.
  * public map + pass protected vis is not returning named map in viz.json.
  * When discards adding a new point, a javascript exception appears.
  * Going to protected_embed_map directly throws 404.
  * OSM import via URL broken due to URL format change.
  * Private visualizations should be allowed when private tables are enabled.
  * Private map created with empty css.
  * Keep getting an error when setting new Torque CSS in dashboard.
  * Layer selector does not work in gmaps.
  * Fixed typo in api keys view.

2.10.0 (2014-02-25)
-------------------
* Improvements
  * Revamped privacy for visualizations.
  * Implement unified MAP API.
  * Named Maps Ruby API wrapper Unit/Integration tests.
  * Add Fullscreen button to iframe.

* Bugs Fixed
  * Set correct attributes service params to work with infowindows.
  * Upgraded message still present after downgrade.
  * It's impossible to move points when there's a torque layer.
  * Ordering by numeric DESC will show nulls at top.
  * viz.json includes infowindow template when there are no infowindow fields active.
  * The title of the fake share window inside of the publish modal is missing.
  * Infowindow shouldn't be enabled in Cluster wizard.
  * CSV importer failure due to missing stream.rewind.
  * Disable GDrive panel for importing new files.
  * When switching from normal layer to torque layers the normal layer is still shown.
  * Change resolution in torque layer does not work.

2.9.3 (2014-02-19)
------------------
* Improvements
  * Improved color picker.

* Bugs Fixed
  * When deleting a user from the box, his/her database should be deleted before deleting his/her metadata.
  * Map turns blank at "Publish" time.
  * Revamp option for selecting a marker image / polygon pattern fill.
  * Wrong message shown in dashboard.
  * Undefined constants in certain importer flows.
  * When edit a polygon in leaflet move the map to [-180, 180]
  * Wizards don't show anything selecteed.
  * Autoselect last uploaded asset by default in the assets modal window.

2.9.2 (2014-02-14)
------------------
* Improvements
  * Added geocodings bar to the submenu.
  * Use unique names on indexes and sequences.

* Bugs Fixed
  * Fixed encoding error on geocoder.
  * the_geom column is empty after loading a shapefile multipoint.
  * Fix error when having tables with same name on different schemas
  * XLSX file with multiline in row fields breaks importer.
  * Roo is not able to open certain XSLX.
  * Table name sanitizer failing when sanitized name already exists.
  * Fix error when changing user quotas.

2.9.1 (2014-02-07)
------------------
* Improvements
  * Use a geocoder cache.

2.9.0 (2014-01-31)
------------------
* Improvements
  * New cluster wizard.
  * Improved embed_map speed.
  * Added retina assets for mobile maps.
  * Slight reorder of label options.
  * Improved WMS error message.

* Bugs Fixed
  * Styles applied in a table do not get reflected on the wizards when creating a visualization.
  * REST API should respond with 400 when tiler style sync does not work.
  * A layer is shown on reload if it is hidden.
  * In embed page: visualizing the map in a mobile, when changes landscape mode, map has to be resized.
  * Leaflet basemap on android dissapears on zoom.
  * Conditional styles based on zoom are not updated when zooming on torque.
  * When the layer is hidden and you change wizards nothing happens.
  * No visual clue about oauth keys on small screens.
  * In embed visualization, if title or description are not shown the share button is not correctly aligned.
  * Rows not appearing in table public view.
  * Importing XLSX fails.
  * Fixed the wizard when using the torque css editor.
  * Renaming a table does not change table name in url.
  * New table shadow is on top of the column menus.
  * Error loading a multipoint shapefile.
  * Layout error on the Add baselayer modal window.
  * Removed deprecated tables endpoints.

2.8.2 (2014-01-23)
------------------
* Improvements
  * Changed the default Torque visualization parameters.
  * Added created_at to the user model.
  * Removed /api/v1/queries endpoint.
  * Run automatic geocoding after syncing a table.
  * Reduce memory footprint of importer.
  * Change settings page for an organization user (not admin).
  * Change dashboard when user is an organization user (not admin).

* Bugs Fixed
  * After a background import, the dashboard sorting method is changed.
  * PostgreSQL 9.2+ support (PGError: ERROR: column "procpid" does not exist). (#267)
  * Check table geometry type when a row is added, removed or changed.
  * Clean up old importer code.
  * The margin between oAuth and simple auth modules is too big.
  * Creating a table from scratch, then adding a row from the table with a geometry, if you go to map view, you can't apply any wizard.
  * Problem rendering some CSS gradients with last Chrome version.
  * Wizard is not refreshed with new properties when a simple wizard is applied and any CartoCSS property is changed.
  * Category colors are not re-rendered again when the previously applied column was removed.
  * Fixed enabling fonts in map view.
  * Autocomplete table_name when typing is not showing up in Codermirror editors.
  * Replaced the old table endpoint in the merge functionality.
  * Reduced default marker width and border-width.
  * Fixed geocodings API authentication.
  * Check geocoding bindings in table and map views.
  * Fixed encoding issue with xlsx files.
  * Wizard is active and bland when a new layer without any geometry is added in a visualization.
  * Table shadow does not appear correctly aligned when you are in a synced table under a visualization.
  * [Importer] Raise error if unp is not installed (#310).
  * polygon-fill is added when polygon-pattern-file is being used.

2.8.1 (2014-01-16)
------------------
* Bugs Fixed
  * Some map styles are changed after wizard refactoring.
  * Fixed duplicated notifications in the dashboard.
  * A warning message is not shown when no columns are available for applying a category wizard. It shows the wizard with the column selector empty instead.
  * Category wizard doesn't render "null" color element when there is only that value.
  * Created task to get modified layers and visualizations within a period.

2.8.0 (2014-01-14)
------------------
* Improvements
  * New organization model on CartoDB (multi-user).
  * Added new Open Sans fonts.

* Bugs Fixed
  * When hovering a table row in the dashboard, expand the title if needed.
  * User message off screen: "Start by adding rows to your table".
  * Long field type names fall off the cell border (#251).
  * If user selects an Intensity wizard, apply a determined SQL and then clear the query, the wizard previously selected is removed but the legend is ok.
  * Added total map views per visualization in the user dashboard.
  * Layout error with label text on the wizards.
  * Filters: apply filter to already filtered columns stack.
  * Updating certain properties from a wizard, shouldn't update the legend.
  * Adapted API keys and OAuth pages to the new layout (760px).
  * Points are shown when switching from chrolopleth to point wizard with line query.
  * Creating a visualization changes the current panel to wizards with wrong width.
  * Fixed space quota stat.
  * CartoDB logo flicks a lot when opening a publish dialog and moving the map.
  * Removed the edit point animation under GMaps basemap.
  * Created a table from scratch and adding coords manually shows the "Georeference" popup.
  * Null geometries are shown as "Point" on the table view.
  * the_geom_webmercator error is not always reported.
  * When pasting a URL in the 'append' window, it shouldn't offer to set it as a sync table.
  * Error changing polygon fill.
  * Fixed line edit.

2.7.0
-----
* This version is empty because a feature moved to a future release.

2.6.2 (2013-12-20)
------------------
* Improvements
  * Prepare a task to register current ghost tables in metadata
  * Put back time_slider handle for mobiles
  * Make the the_geom switch exclusive on the column join modal
  * Create a task to clean up temporary tables from failed imports and move them to the cdb_importer schema

* Fixed Bugs
  * Do not leak users during testsuite run (#244, #323)
  * SQL editor does not autocomplete table name
  * Error message for free accounts over map view quota
  * geocoder raises an exception
  * Update cdb_tablemetadata when table privacy changes
  * When syncing a table, create triggers and indexes based on those in the existing one
  * Privileges in sync tables are being dropped
  * Dashboard rendering requests /api/v1/tags twice
  * Duplicated the_geom index in new tables
  * Customize infowindow empty throws error
  * CartoDB attribution doesn't appear when there is only a torque layer in the visualization
  * Indentation doesn't work properly in codemirror
  * "Unknown" error creating table from query
  * A console.log is showed from dashboard_messages.js, remove it.
  * Row options menu doesn't appear properly in Firefox
  * Fix problem with the table header shadow
  * Twitter share text is wrong
  * Fix several jasmine failed tests
  * Fix cartodb.js test suite
  * Don't break task when adding timezones to date columns
  * Change support google mail url to exchange url
  * Imports get broken when database_host was empty

2.6.1 (2013-12-13)
------------------
* Improvements
  * Optimized map frame for mobile.
  * New sharing options on embeded maps.
  * Tag footer link in Embeds.

* Fixed Bugs
  * Clicking on a visualization should open map instead of table view.
  * Dashboard: visualizations: change viz name.
  * When browser window is resized in map tab zoom is set to 0.
  * Wrong SQL when requesting infowindow through the admin.
  * Importer leaves temporary tables in the public schema in some error conditions.
  * Funny error on points choropleth.
  * When you create a visualization from a table (within a table), search and legends aren't moved when right panel is opened and closed.
  * Changed button text when selecting file from gdrive.
  * Importing a sync table when having just one table left raises an error, but the table gets imported and not synchronised.
  * If you disable a legend and then apply another choropleth, it doesn't reenable it.
  * After changing the CartoCSS, the wizards cannot calculate the colors anymore.
  * sublayer_options does not work with torque layers.
  * When adding a new layer in a table view, it moves to a new visualization, and name + label appears stuck.
  * Fixed Dropbox picker.
  * Customize infowindow and then empty it throws an error.
  * When viewing a torque layer and adding another layer, the scrubbar stops working.
  * Clean up temporary tables when a synchronization fails.
  * Incorrect layout on the basemap modal.
  * Infowindows are using v1 queries for the SQL API in the admin.
  * Fixed jasmine tests.
  * Custom HTML legends that come from a legend with no items aren't shown.
  * Ensure the dashboard is rendered even if there are exceptions raised when rendering a specific 'table record'.

2.6.0 (2013-12-10)
------------------
* Improvements
  * Enabled HTML editor for the legends.
  * cartodb.js: improved legends API.
  * Created a function that returns the indexes created for a specific table.
  * Added the possibility to upload an import file to S3.
  * Eager load synchronizations when rendering table visualizations (dashboard).
  * Eager load row count and table size when rendering table visualizations.
  * Implemented "cancel geocoding" feature.

* Fixed Bugs
  * Several legends are rendered and they are not cleaned when it's necessary.
  * Label placement: line should be an option in the wizards (for lines).
  * Text placement from Wizard on Lines should default to *line* not *point*.
  * In the legend editor show only colors being used on CartoCSS.
  * If edits a feature from layer[1] and you changes to layer[2], the geometry editor disappear but the editing feature is still present in the map.
  * old_fields and old_template_name infowindow attributes should be removed from viz.json.
  * Missing button in the upgrade notification.
  * Individual visualization map views not incremented.
  * Filter by a word that contains a single quote (') doesn't return the expected results.
  * Duplicated 's' in the visualization title.
  * Column name sanitizer fails with duplicated column names.
  * Fix some privileges problems when granting or creating triggers.
  * In dashboard, if you filter with a tag called "DON'T TOUCH", url is not correct.
  * In dashboard visualizations, if you filter by tag that doesn't exist, 'Create first visualization' block appears.
  * Rails app should use the same time zone than the DB.
  * Old endpoint tiler is not working for some tables.
  * Nokia basemap maxZoom is 40, and it should be 21.
  * When applying a filter on an already styled map, the style gets reset and goes back to default.
  * Fix problems with users deletion.
  * Fix filters failing spec.
  * Geometry edition over GMaps is not working.
  * Do not use removed Table#set_trigger_cache_timestamp when syncing tables.
  * Sync tables may not invalidating the cache.
  * Ensure varnish caches depending on CDB_TableMetadata get cleaned up on table change.
  * HERE batch geocoding API changes.
  * Layer alias does not work on torque layers.
  * Customize infowindow empty throws error.
  * Purge varnish items with "cdb_tablemetadata" channel on table update (#308)

2.5.6 (2013-11-28)
------------------
* Improvement
  * Allow to customize the colors and its number on the choropleth legend.

* Fixed Bugs
  * Make infowindow keep state for a SQL query.
  * Custom infowindow with image is not adding correctly <img> tag.
  * Fixed redis configuration in sync tables.

2.5.5 (2013-11-27)
------------------
* Improvements
  * Move varnish triggers from user tables to CDB_TableMetadata (#241)
  * Changed empty dashboard page

2.5.4 (2013-11-26)
------------------
* Improvements
  * Implemented Torque accumulative visualization.
  * Faster CDB_TransformToWebmercator when input is already mercator.
  * Added the type of the columns shown on the column selector for the filters.
  * Added autocomplete in legends.
  * Way to Activate/deactivate automatic geocoder.
  * Running the testsuite is easier now.
  * Disabled geocoder on sync tables.
  * Enabled default max/min zoom for google basemaps.
  * Deprecated the getLayerByIndex method and added a more descriptive one.

* Fixed Bugs
  * Torque visualization doesn't work as expected for a multiday GPS track.
  * Table rename errors aren't shown in the UI.
  * Torque visualizations under IE9 + Windows 7 are not showing canvas layer.
  * Density legend is not showing the min,max values. It's showing left and right value.
  * Sanitize in-cell line breaks (<8d> unicode character) when processing CSV and Excel files.
  * When moving from CategoryLegend to CustomLegend, copy the items.
  * Removed the persist param on calls to tiles at cartodb.js
  * Deactivate zoom when not having more levels available.
  * Unix timestamp not being correctly converted to date (#290).
  * Changed ZXY url to XYZ.
  * Selecting an Intensity Wizard disables the associated legend.
  * User can't add a Mapbox basemap.
  * Clean up Importer2::Ogr2ogr spec.
  * last_visualization_created_at is causing a ton of queries.
  * Layers visibility is not working in embed map.
  * Explain that a user needs to publicly share a file in GDrive before importing.
  * Label allow-overlap changed to toggle on the Wizards.
  * Fixed broken acceptance specs.
  * Fixed typo in carto_db.rb (by @robinkraft #301).

2.5.3 (2013-11-21)
------------------
* Improvements
  * Start storing the api_key in the database.
  * Created a rake task that copies the api_key from redis to PSQL.
    * Existing installations, please run:
    ```
    $ bundle exec rake cartodb:db:copy_api_keys_from_redis
    ```
  * Improved sprite compilation time + CSS rendering
  * Created a notification model.
  * Re-enable save_metadata during user after_save.

* Fixed Bugs
  * GMaps attribution is above Legend when it is applied.
  * Date filters depend on the system timezone.
  * Query box: field suggestion menu goes out of the canvas.
  * Deactivate by default layer-selector when visualization has only one layer.
  * Deactivate by default legend when none of the layers has a legend applied.
  * Drop type guess based on column names.
  * When trying to import a file and being overquota it reports an unknown error.
  * Geocoding error on tables with cartodb_georef_status column.
  * Infowindow variables are changed after renaming the table.
  * HTTP is not added on basemap wms.
  * Error saving a cell that contains a date.
  * Views: dashboard: vizs: long description overflows.
  * Change text in filters' tooltip.
  * Pass encoding and shape_encoding as separate options to ogr2ogr.
  * Provide a missing 'down' step for some migrations.
  * Problem applying a polygon-patter-file from simple wizard and changing any value inside CartoCSS editor.
  * [regression] All importable files in a zip file should be imported.

2.5.2 (2013-11-15)
------------------
* Improvements
  * WMS / TMS basemap import
  * WMS Proxy Service implementation
  * Better integration with MapBox basemaps

* Fixed Bugs
  * Basemap 404 should throw an error.
  * CSS with exponents is not parsed correctly.
  * Google maps layers should not have max/min zoom.
  * Basemap distribution on the selector is wrong. It should have 3 columns in total.
  * Geocoding error on tables with double-quoted strings.
  * Fixed convert_to_cartodb_type spec.
  * When the geocoder process fails, the progress bar is hidden but no error message is shown up.
  * Dialog to load a marker is the same than to import a file.

2.5.1 (2013-11-14)
------------------
* Improvements
  * Legend is disabled when "torque" wizard is applied.
  * Dragging the time slider stops the animation, and when dragging ends the animation starts.

* Fixed Bugs
  * Can't open "New table dialog" when quota was full and one table was deleted.
  * If you set an invalid value in a CartoCSS property, it is displayed in the wizard.
  * New category wizard may reset previous configurations.
  * If two layers, one torque, and leaflet, data appears moved in the embed at certain zoom levels.
  * In the category wizard if the column is changed the 'Getting colors' text appears twice.
  * In a table made of points, if you apply a torque visualization and then create a visualization within that table, time slider stops working.
  * 'select fields' button within infowindow doesn't work when a visualization is created from a table.
  * In a points table, with torque wizard applied, if you want to add a new layer (not another torque table), it isn't converted to a visualization.
  * Right module links in api keys or oauth pages are broken.
  * Torque layer doesn't add CartoDB logo in the visualization.
  * It's no longer possible to remove tags from a visualization or a table.
  * Geocoding bar continues spinning after a geocoding failure.
  * Fix typo in support browsers for torque layer.
  * Add 120px more to the public iframe.
  * Fixed CartoDB test suite.
  * Map is not refreshed after editing a field on the map view.

2.5.0 (2013-11-11)
------------------
* Improvements
  * Time-animated visualization wizard (torque).
  * Adapt torque timeline to the screen in mobile.
  * Created a migration to add timezone to timestamp models columns.
  * Added database_host attribute to user model.
  * Replicate database_password to redis when creating a username.
  * viz.json includes https urls in embeds.
  * Improved privacy in torque visualizations.
  * Clean headers from tiler/varnish/nginx.
  * Created support dialog in embed page when torque layer is applied.
  * Added cartodb:test:prepare rake task and document its usage for testing.
  * User configuration change: sql_api config names normalization.
    Change the following sql_api parameters in the config/app_config.yml file in current installations:
    - sql_api_protocol -> protocol
    - sql_api_domain -> domain
    - sql_api_endpoint -> endpoint
    - sql_api_port -> port

* Fixed Bugs
  * Embed layer selector should show torque layers.
  * Trying to 'Duplicate' or 'Table from query' when tables over quota doesn't give back a reasonable error.
  * If you cancel a file upload the close button is not being shown anymore on the new table window.
  * Removed table api_keys from rails migration.
  * Revamp basemap selector.
  * Infowindows don't show any content when they contain a column name which is a reserved SQL word.
  * Reviewed table and map styles using new Safari under Mavericks system.
  * Clear filter on the filters panel layout is broken in safari + mavericks.
  * Out of sync between steps and time slider.
  * Columns with an unique value does not render anything.
  * Basemap selector dropdown lost the right border radius and has the wrong caption under the 'Add yours' button.
  * Scrubbar dissapears when going from map to table and then back to map.
  * Exporting doesn't include the subdomain.
  * Line breaks on geocoding strings cause geocoder to crash.
  * Cancelling a geocoding job is not working sometimes.
  * Numeric type is not well mapped.
  * Sublayer_options make embed fails.
  * Prevent layergroup GETs to be cached.

2.4.0 (2013-11-06)
------------------
* Improvements
  * Allow to set an image to each category, not only a color.
  * Display remote URL in synchronization options modal window.
  * Add new basemaps to the list.
  * Implement geocoding API on CartoDB.
  * Use different schema for temporal geocoding tables.
  * Improve the way we detect the date columns.
  * Implement interface to HERE geocoding API.
  * Implement CartoDB bindings to HERE interface.
  * Link the new geocoding API to the UI.
  * Change timestamps by timestamptz.

* Fixed Bugs
  * Allow image besides of color in the legends.
  * False values in color wizard are interpreted as null in the legends.
  * Add privacy explanation on the create new table window.
  * Test category wizard, checking old color wizard applied.
  * Layout error when searching tables.
  * Remove marker-allow-overlap property from choropleth points wizard.
  * Fix header visualization frontend tests.
  * Add .tsv to supported import formats.
  * Implement changes on the georeference window UI.
  * Rename a table with capital letter fails.
  * NAD83 Projection not working.
  * When changing sync table freq you need to reload in order to get the correct "next sync time".
  * Dropbox 401 gets imported on sync tables.
  * Dashboard URL with parameters makes the page to fail partially.
  * Add .txt .tsv to the list of supported extensions in the importer.
  * HTML problem with geocoding limit copy.
  * Each time you open sync "view options", the dropdown removes first option.
  * Dashboard pagination not switching page content.
  * Error while using the wizards.
  * Error on geocoder window when being over quota.
  * Make CDB_UserTables test more stable by ordering multirecord results.
  * Add "make check" rule.
  * Features/cdb transform to webmercator improvement.

2.3.2 (2013-10-30)
------------------
* Improvements
  * Color the 'empty' message in the legend title in a subtle gray
  * chrolopleth for points
  * Hookup importer checksum mechanisms with synchronizations
  * Force follow redirects in importer
  * Update run_at when changing synchronization interval of a table

* Fixed Bugs
  * Generate the_geom only from wkb_geometry for SHPs
  * Create your first table button does not work
  * If a sync table is added to a visualization, we don't provide any information about this current layer (synced table)
  * Timezone skew on sync tables display
  * Update Sync table table UI components
  * When deleting a table that is syncronized a message with a warning is displayed and is not neccesary
  * Support alternative formats for Google Fusion Tables urls
  * Show when a sync table will be synced again in the dashboard
  * Add privacy explanation on the create new table window
  * Fix visualizations list in Safari under Mavericks
  * Import successful stopped working
  * Trying to add a row after passed the quota limit returns a ugly error
  * In a synced table, when the next sync is in a hour, the a letter appear as capital.
  * Display 'Next sync will be in a few minutes' when run_at is in the past
  * If legend title is empty and you fill it, it should enable by default
  * Trivial typo within table rename (by @rfc2616)

2.3.1 (2013-10-15)
------------------
* Improvements
  * A way to change the name of the layers used in a visualization
  * Update CDB_UserTables() to return name, permissions
  * Possibility of adding a pattern image as map background.
  * Load OSM files through ogr2ogr
  * [importer] Use PROMOTE_TO_MULTI as geometry when loading files through ogr2ogr

* Fixed Bugs
  * More than one upgrade message on dashboard
  * Can't see the trial reminder when having 0 tables
  * Tiles from private tables can be seen without api_key
  * Wrong error message when being over table or disk quota
  * Changing the api key doesn't invalidate requests with the old api key
  * Hook-up importer cache mechanisms with synchronizations
  * Sync dialog is not shown when importing a csv from dropbox (private file)
  * Labels on the intensity map legend shouldn't be synced never
  * Replace 'sync' term in the legend editor with 'lock'
  * Change side of the dropbox and gdrive buttons, they will be at right, and when any file is selected, move them to left
  * Dashboard table's sync indicator is not aligned correctly.
  * '...' is missing from the Sync tables item on the table options menu
  * Change pulse animation for synced tables
  * Timezone skew on sync tables display
  * When sync table fails, error should be red or other color
  * Change new CartoDB text border opacity from embed maps
  * If the gdrive api_key is empty don't show the gdrive import tab
  * [importer] Make Content-Disposition regex more permissive
  * The "Error with sync" link in the dashboard should stop the propagation of the click
  * Google Drive API key shouldn't be needed on Development
  * Fix current front-end failed tests
  * Table names within layer selector in embed view should be the table name alias if they are available
  * Merging numeric columns throws an error

2.3.0 (2013-10-14)
------------------
* Improvements
  * Finished google drive integration on Create / add new layer modal window
  * Big CSV fixture generator
  * Prototype an EventMachine-based dispatcher to poll remote files
  * Get synctables configuration (sources, intervals, next poll) from Postgres
  * Optimize sync-tables download based on Last-Modified and ETag
  * Work on Sync tables UI changes
  * Implement synctables endpoint
  * We need a flag to know if a user can create sync tables or not
  * Configure long-running process for sync-tables
  * Implemented sync indicator in dashboard tables.
  * Implemented new 'sync table' option for new tables dialog
  * Implemented necessary changes in table view when it is sync type
  * Improve loader indicator of the assets on the assets modal window
  * Add comma separators on the row count on the dashboard
  * Add Create your own maps with CartoDB module to the embed maps
  * Improved filter queries
  * After upgrading set the plan property to the user
  * Improved names of stuff sent to mixpanel
  * Find a way to track the first time ever that people enter to their dashboard
  * Extension is being set two times in the mixpanel event for importing (success and failed)
  * Set some parameters to the user for tracking on mixpanel
  * Remove account_type parameter from the user model on mixpanel
  * Access tiler services via 'http' protocol by default.
  * Make point-stroke opacity to 1 by default and with to 2
  * when adding consequtive basemap layers the name of the custom basemap concatenates
  * Users can set more basemaps than 'basemap dropdown' supports
  * Add event for when an user visualizes the dashboard
  * Add new config parameters for GDrive keys

* Fixed Bugs
  * Design all sync tables related stuff
  * The red dot on the sync tables was supposed to be blinking
  * Make the "Create your own custom maps with CartoDB" area less high and add the top-border (similar to the header)
  * Input field errors don't appear
  * Tiles from private tables can be seen without api_key
  * Export of CSV is failing on many tables
  * On the list to "Add an existing table" the order of the tables there is wrongly sorted
  * Float values on export [again?] 16.2 => 16.199999999999999
  * Weird scrolling issue
  * Fix dashboard message animation
  * Error on over quota message
  * Fix alignement of the support text with the rest of the dashboard.
  * Double click over the legend is propagated to the map and zoom it
  * If a legend is customized and the query is changed it is overriden
  * Sql editor does not show the_geom_webmercator in autcomplete options
  * Scrub bar for radius / opacity / etc stays open in some cases
  * Add tutorials to the menu on the dashboard
  * Dashboard notification opens always
  * Account upgraded event duplicated
  * Upgraded to Windshaft-Cartodb 1.3.6
  * Changing the api key doesn't invalidate requests with the old api key
  * Looks like the import event is broken in mixpanel. No metadata
  * Import events always reported as failure
  * Dedicated badge doesn't appear in dedicated accounts
  * Support new? OSM url format
  * Add point separator on the dashboard table list (for number of rows)
  * The_geom column is being shown as 'P'
  * Add widget to ducksboard with the AVG time of response on supportbee
  * Geometry rows in the table shows only first letter
  * Review CSV export query
  * Compare strings in lowercase when doing a merge
  * A just importer csv (synced) shows "synced 18 hours ago"
  * Map is now show on sync tables
  * 'Basemap adder' dialog bugs and improvements

2.2.1 (2013-10-04)
------------------
* Fixed Bugs
  * Refreshing a table view with a query applied on the visualization view it doesn't get the table correctly rendered
  * Public table rendering nothing
  * Table view rows missing columns
  * Type being reported as an actual number in SQL API
  * Exporting POINT table with many NULL geoms as a SHP file fails
  * Single quotes aren't escaped on CartoCSS
  * Missing .prj on shp files exported by CartoDB
  * Investigate account provisioning issues
  * When there is a value with " ' " in the table and you try the category wizard it fails
  * Error adding polygon
  * Duplicated layer added to a visualization
  * Cannot export mixed geometry resultsets to shp
  * Error when not selecting the cartodb_id column
  * Green bar when applying a query is over the column submenu
  * When a query is cleared to default infowindow fields should return to selected ones
  * Spinners in color wizard are not working
  * Particular error for KML files
  * Issues on the public view
  * When having a query applied with a wizard using a foreign column, if you clear the wizard the style should be set to default
  * When not having results for a query, the clear view link is not being shown on the green bar
  * wizard styles are not preserved when changing geometry
  * Close submenu when clicking on the active column name
  * Detect when a encoding error in order to show a different message than Unknown
  * Error "cartodb_id column does not exist" when interaction is disabled
  * Detect when a SHP has more than 256 columns
  * Dashboard shows "Dedicated plan" after downgrade
  * Fix regression: assume LATIN1 for Shapefiles we can't detect the encoding
  * Fix regression: assume LATIN1 for Shapefiles we can't detect the encoding
  * Imports from URLs get created twice
  * Importing a table when you have one left raises a quota error

* Improvements
  * Use the requested string as identifier when geocoding
  * Use DBF gem to detect encoding of Shapefiles
  * Force encoding in file name
  * Implement 'overwrite' mode in importer

2.2.0 (2013-09-30)
------------------
* Fixed Bugs
  * Malformed polygons fail without warning

* Improvements
  * Ported cartodb to leaflet 0.6

2.1.5 (2013-09-25)
------------------
* Fixed Bugs
  * Geometry editing can mess up interactivity layer
  * layergroup should always return 200 when the call is jsonp
  * When there are more layers than legends applied, the layer selector can break the legends
  * Merge tables sets all values the same for every column
  * styles could be overriden in tables created before version 2.1.3.4.2
  * Problem with custom quotas in central
  * Removing a visualization from the dashboard reload the list in a weird order
  * Tables in the 'Create new visualization' window should be by updated_at
  * Contradictory messages when changing a password
  * Trying to create a table from a query fails
  * Support files with Chinese data
  * HTML template generated without the content of the title fields
  * Hide opened infowindow when hiding a layer that has an infowindow opened.
  * Fix enabled/disabled state for sync checkbox in legend editor
  * When you deselect a title from the infowindow fields pane, and then go to the infowindow custom editor, appears the title line empty
  * Problem with IE browsers in compatibility mode
  * https viz.json url redirects to http and it should not
  * if embed is https and uses google maps it is blocked by chrome
  * When entering to this view it says there is a query applied (but not)
  * After editing geometries, interactivity ceases to work
  * when execute a query without the_geom_webmercator styles are not properly reset
  * Error when trying to access the drobox uploader twice
  * Image header template fails when first field selected is null

* Improvements
  * Developer page spelling mistake exited => 'excited'
  * Add Dropbox and file-import tests
  * Unify marker-width with marker fill row on the wizards
  * Improve the way we detect the geometry column on the geojson files

2.1.4 (2013-09-18)
------------------
* Fixed Bugs
  * Disabling a layer on a visualization causes interactivity to be obtained from wrong layer
  * If you click over Select fields button in the infowindow when there isn't any field selected should open the right tab pane in infowindow panel
  * Show the blue bar on every table independently until it gets closed by the user.
  * Can't make a density map
  * change wizards according to the geometry type returned by the query
  * assert infowindow doesn't have fields which are not in the table before save
  * When having a SQL applied and clearing it the applied wizard is set to default
  * race condition when query switch from one geometry type to another
  * Not possible to parse geometry type when first rows don't have any geometry
  * When you try to filter by date (using created_at for example), it fails
  * Fix the height of the blocking message in the infowindow editor
  * If you click over Select fields button in the infowindow when there isn't any field selected should open the right tab pane in infowindow panel
  * When the geometry is a polygon instead of a multipolygon, the geometry editor fails
  * [INFOWINDOW] Column names in the title pane should be sorted like in the fields pane
  * Wrong styles when appliying and removing a filter
  * Trying to edit a feature in the map, fails saving the new geometry
  * The cell editing box is not shown in front of the row in Firefox
  * Scrolling down removes "Create table from query" string from the top of a table (in Firefox)
  * A point cannot be edited on a map
  * Wrong wizard thumbnails
  * Autocomplete openning when it shouldn't open
  * Adding a layer from a private table creates a public visualization instead of a private one
  * Only allow to change the titles of the table fields that are active.
  * [infowindow] name change pane should list the fields in the same order than field selector
  * fix available fields when table schema changes on custom infowindows

* Improvement
  * Improve infowindows editor
  * When you have a legend for a choropleth and customize the labels, they get replaced when changed
  * Change title checkbox behaviour in CartoDB application

2.1.3.6
-------
* Fixed Bugs
  * Can't filter by tag when on page >1
  * Export of CSV is failing on many tables
  * On the list to "Add an existing table" the order of the tables there is wrongly sorted
  * Float values on export [again?] 16.2 => 16.199999999999999
  * Don't allow to export to SHP when not having geometries
  * Error on over quota message
  * Fix alignement of the support text with the rest of the dashboard.

* Improvement
  * Optimize commercial website resources (PageSpeed)
  * Improve filter queries
  * Suggestion: different green color for the dashboard message
  * Improve loader indicator of the assets on the assets modal window

2.1.3.5
-------
* Fixed Bugs
  * Add good legend icon. The actual one is wrong
  * Performance problems on map views checking task
  * Problem with embed iframe when it is hidden
  * assert infowindow doesn't have fields which are not in the table before save
  * When having a SQL applied and clearing it the applied wizard is set to default
  * Add the map views checking task to central cron
  * race condition when query switch from one geometry type to another
  * Not possible to parse geometry type when first rows don't have any geometry
  * When you try to filter by date (using created_at for example), it fails
  * If you edit the infowindow HTML and refreshes the page, the HTML doesn't appear again if you activate that pane
  * Fix the color of the active/inactive tab buttons in the Infowindow editor
  * When the "title?" checkbox of a field is modified, the HTML of the Infowindow should change accordingly
  * When closing the blue bar realize of the space available
  * Scroll is appearing when having a pretty small content on the infowindow
  * When applying HTML template null values are not rendered as null (on the CartoDB editor)
  * On the header template the first value is not rendered where it should be. In terms of HTML code
  * Change labels in the intensity map legend

* Improvements
  * Updgrade codemirror
  * Title support in legends
  * Add autocomplete for column names on the HTML infowindow
  * Implement 'blocked' state in the infowindow editor.
  * Select all the used interactivity fields in the Custom HTML editor
  * Generate the infowindow's HTML template based on the selected fields
  * Make the infowindow html pane bigger
  * Add selected infowindow template to HTML editor when is activated
  * Add a div wrapper to all header infowindow templates.
  * Increase the opacity of the white layer when showing the forbidden indicator

2.1.3.4.1
---------
* Improvements:
  * Support for SHP imports in a wide range of projections and encodings
  * Specific support for Cyrillic encoding in SHP and TAB files
  * Improved encoding detection for file imports
* Bugs:
  * Removed POINT default constraint in tables created by an import

2.1.3.4
-------
* Fixed bugs
  * Don't allow to select unsupported formats from Google Drive & Dropbox & filesystem
  * GPX imports produce empty tables
  * Import .tiff files
  * After importing the vacuum full is not being made
  * Importer should not report as failures those files with unsupported formats
  * Importer should ignore unsupported files inside zip files
  * Process multipoint geometries when importing
  * CSVs with polygons don't import correctly
  * Importer failures aren't being handled
  * Import files with ' or " in the name
  * Tune encoding detection in importer
  * Link importer errors to online documentation
  * Raise UnsupportedGeometryCollection error from importer, before cartodbfication
  * CSV normalizer breaks with empty lines
  * Give preference to comma when detecting row delimiter

* Improvements
  * Import Google Docs spreadsheets

2.1.3.3
-------
* Fixed bugs
  * Remove 'support address' behaviour from here
  * Replace updated_at & trial_ends_at with the new flags

* Improvements
  * Save user IP on signup and login

2.1.3.2
-------
* Fixed bugs
  * Color map wizard behaves different than the others
  * Add marker-width to the color wizard
  * Importer is not reporting specific errors, just the generic one
  * Fix Xlsx2Csv
  * Add support for ';' as CSV separator
  * Support CSV files with ^M EOLs (Windows)
  * Support SHP / KMZ from US Drought Monitor Data
  * Fix missing method to mark an import as failed when stuck

* Improvements
  * Upgrade "Color map wizard" to "Category map"
  * Please, advise in this text for color map wizard
  * URL translator for Google Maps URLs

2.1.3.1
-------
* Fixed bugs
  * Add a loader to the thumbnails on the asset window
  * Fix padding in legend editor items
  * There is no way to add an icon for a marker using a URL
  * Not all expected keys save the state of my Legend text
  * Geolocation styles are broken


* Improvements
  * Change to "generating...." state everytime the URL on the share textinput is being generated

2.1.2
-----
- Added legends.
- Dropbox file import.
- Icon and images management. Icons and patterns can be set from the wizards
- The importer component now uses a separate database schema ('cdb_importer')
  for all imports, with the exception of OSM files. To create the schema in
  existing installations, run:
  ```
  $ bundle exec rake cartodb:db:create_importer_schema
  ```
- Added support for MapInfo files (.tab) in the importer

2.1
---
After updating to 2.1 you'll need to upgrade your system:

```
$ bundle install
$ bundle exec rake db:migrate
$ bundle exec rake cartodb:db:load_functions
$ bundle exec rake cartodb:db:migrate_to[2.1]
```

* Updated the dashboard with a visualizations page
* Changed the way the maps can be shared
* Added visualization with multilayer support
* New color wizard
* Layer selector widget
* Map view stats per visualization

2.0.15
------
* Fixed OSM imports
* General bug fixes

2.0.14
------
* Fixes error when importing OSM files
* Fix error editing color basemap
* Workaround exporting CSV with latitude or longitude column names

2.0.13
------
* Adds booleans filters feature.
* Allows adding filters from the column name tooltip.
* Fixed public table view
* Fixes some importer errors


2.0.12
------
* Adds new filter feature.
* Fixed problem some compressed imports
* Fixed some problems with xls imports

2.0.11
------
* Imports now never get stuck on the UI
* Imports will populate created_at and updated_at fields as strings
  as a fallback if dates cannot be parsed.
* Conversion of a numeric column to date is properly handled,
  by nullifying data in the column.
* Vizjson now works with and without SSL
* Fixed various errors when changing column types using the UI
* Invalidates varnish cache after column modifications using the UI
* Fixed error when trying to import urls with query string parameters
* Added function CDB_UserTables to get user tables list
* Added function CDB_ColumnType to get a user table column type

2.0.8 (25/03/13)
-----
You'll have to run database migrations and reload sql functions after
upgrating (yep, again, sorry):

bundle exec rake db:migrate
bundle exec rake cartodb:db:load_functions

* Huge importer refactor. Now import jobs shouldn't get stuck.
* Excludes some system tables from user quota calculation.
* Script url is only formed with table name and not id.
* Fixed problem importing files with accents in the name.

2.0.6 (15/03/13)
-----
* If the the_geom value is null, it appears as null in the table and not as GeoJSON.
* Table hover styles fixed.
* Embeding map with an script is possible now (iframe still supported).
* Brand new share window.
* Enable/disable scroll wheel zoom in the embeded maps.
* Revamped visualization wizard's selector.
* Added new cool wizard for point maps: Intensity.
* New upgrade window.
* when converting a column from string type to number type, figures using
  decimal comma and point as grouping separator (e.g. 1.234.567,1234), are
  appropriately casted to floats using a decimal point separator
  (e.g. 1234567.1234)

2.0.5 (05/03/13)
-----
* Add new quantification methods, CDB_JenksBins etc.
* Modal confirmation when deletes a row.
* Modal confirmation when deletes a feature in the map.
* Edit geometry window confirmation doesn't stop edition, it is just an advice.

2.0.4 (19/02/13)
-----
You'll need to run database migrations and reload sql functions after upgrating:

bundle exec rake db:migrate
bundle exec rake cartodb:db:load_functions

* Adds a track_updates trigger to keep track of the last time any table is modified
* Persisted updated_at on vizjson, this saves a lot of traffic to the tiler if Varnish crashes or is not running
* Fixes a importer bug when decoding content-disposition http header
* Fixes a bug that causes VACUUM FULL to be run more than once after table creation
* Added 'loading state' for infowindows.
* Replaced submodule URL's with read-only ones
* Adds new merge option: spatial merge.
* Edit fields from the map.

2.0.3 (31/01/13)
-----
* Add cartodb:db:update_test_quota_trigger rake task.
* Added new infowindow theme: 'header with image'.
* Brand new basemap layer selector.
* Changed user quota calculation method.
* Changed default basemap to Nokia.

2.0.2 (21/01/13)
-----
* Added composite operations combo in style wizards
* The list of public tables has been moved to a new page and is now accessible from the header
* Fixed table pagination animation for new Firefox 18 version
* User deletion now removes all the user data
* Added a VACUUM FULL after table creation
* Fixed error when importing GeoJSON files with wkb_geometry columns
* Removed 20 char table limit on the importer
* Fixed error when importing shapefiles with invalid cartodb_id columns
* Fixed the incorrect "missing prj" error on the importer
* Added 'show/hide' CartoDB logo in embed maps

2.0.1 (5/12/12)
-----
* Fixing a bug when adding a XYZ url as a base layer.
* Embed maps now should work on IE10
* Fixed bugs when changing the password.
* Fixed a bug with disappearing CartoCSS/InfoWindow buttons after a failed query.
* Feature creation added.
* Fixed bugs with vizz.json invalidation.
* Fixed bugs with the geocoding dialog.
* Increased number of tables per page on the dashboard and fixed bugs on the dashboard.
* Filling empty boolean columns with null values.
* Deactivate KML and SHP when not having geometries selected.
* Fixed a bug when renaming a table.
* Adding loader events when deleting features from the map.
* Fixed a bug with the sign-in on FF 15.0.1

2.0.0 (30/11/12)
-----
* CartoDB 2.0
