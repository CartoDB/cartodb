API access control for CartoDB
===============================

There are 3 main API:

1. SQL API
2. REST API (internal use mainly)
3. Map tiles API

Currently, CartoDB has problems with a non-standard OAuth implementation and a semi-implemented API-KEY authentication method

We propose:

1. standardising the Data API (SQL + REST) on plain OAuth.
2. Reusing the API-KEY for the Map tiles API as a 'Map Key'


Standardising the Data API on plain OAuth
------------------------------------------
* Remove API-KEY access method from all API and authenticate methods (warden.rb)
* Update filter for access_token to store all keys in Redis: consumer, request & access
* Implement full OAuth checking (eg check headers and signature) in the SQL API
* Add automatic generation of OAuth access tokens on the users API page if that's all they want. (User just needs consumer and access tokens to properly sign an OAuth request).
* Update all libraries to take the real OAuth change into account

Converting the API-KEY to Map Key
----------------------------------
* Rename ApiKey model and tests to MapKey
* update provisioning in client_application.rb. 
* update views to show map key, not ApiKey
* store ApiKey and domain in redis and count tiles served by tiler
* in node mapper app check request headers Referer:http://blah/ for to ensure requst is made from a map hosted on a legit domain (or at least record it somewhere?)
* auto make a MAPKey on user creation
* update map tiles JS to use mapkey