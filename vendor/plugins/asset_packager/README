= AssetPackager

JavaScript and CSS Asset Compression for Production Rails Apps

== Description

When it comes time to deploy your new web application, instead of 
sending down a dozen JavaScript and CSS files full of formatting 
and comments, this Rails plugin makes it simple to merge and 
compress JavaScript and CSS down into one or more files, increasing 
speed and saving bandwidth.

When in development, it allows you to use your original versions 
and retain formatting and comments for readability and debugging.

This code is released under the MIT license (like Ruby). You're free 
to rip it up, enhance it, etc. And if you make any enhancements, 
I'd like to know so I can add them back in. Thanks!

* Formerly known as MergeJS.

== Credit

This Rails Plugin was inspired by Cal Henderson's article 
"Serving JavaScript Fast" on Vitamin:
http://www.thinkvitamin.com/features/webapps/serving-javascript-fast

It also uses the Ruby JavaScript Minifier created by 
Douglas Crockford.
http://www.crockford.com/javascript/jsmin.html

== Key Features

* Merges and compresses JavaScript and CSS when running in production.
* Uses uncompressed originals when running in development.
* Generates packages on demand in production

== Components

* Rake tasks for managing packages
* Helper functions for including these JavaScript and CSS files in your views.
* YAML configuration file for mapping JavaScript and CSS files to packages.
* Rake Task for auto-generating the YAML file from your existing JavaScript files.

== Updates

November '08:
* Rails 2.2 compatibility fixes
* No more mucking with internal Rails functions, which means:
  * Return to use of query-string timestamps. Greatly simplifies things.
  * Multiple asset-hosts supported
  * Filenames with "."'s in them, such as "jquery-x.x.x" are supported.
* Now compatible with any revision control system since it no longer uses revision numbers.
* Packages generated on demand in production mode. Running create_all rake task no longer necessary.

== How to Use:

1. Download and install the plugin:
   ./script/plugin install git://github.com/sbecker/asset_packager.git

2. Run the rake task "asset:packager:create_yml" to generate the /config/asset_packages.yml
file the first time. You will need to reorder files under 'base' so dependencies are loaded 
in correct order. Feel free to rename or create new file packages.

IMPORTANT: JavaScript files can break once compressed if each statement doesn't end with a semi-colon.
The minifier puts multiple statements on one line, so if the semi-colon is missing, the statement may no 
longer makes sense and cause a syntax error.

== Examples of config/asset_packages.yml

Example from a fresh rails app after running the rake task. (Stylesheets is blank because a 
default rails app has no stylesheets yet.):

--- 
javascripts: 
- base: 
  - prototype
  - effects
  - dragdrop
  - controls
  - application
stylesheets: 
- base: []

Multiple packages:

---
javascripts:
- base:
  - prototype
  - effects
  - controls
  - dragdrop
  - application
- secondary:
  - foo
  - bar
stylesheets:
- base:
  - screen
  - header
- secondary:
  - foo
  - bar

3. Run the rake task "asset:packager:build_all" to generate the compressed, merged versions
for each package. Whenever you rearrange the yaml file, you'll need to run this task again. 

Merging and compressing is expensive, so this is something we want to do once, not every time
your app starts. Thats why its a rake task. You can run this task via Capistrano when deploying
to avoid an initially slow request the first time a page is generated. 

Note: The package will be generated on the fly if it doesn't yet exist, so you don't *need* 
to run the rake task when deploying, its just recommended for speeding up initial requests.

4. Use the helper functions whenever including these files in your application. See below for examples.

5. Potential warning: css compressor function currently removes CSS comments. This might blow
away some CSS hackery. To disable comment removal, comment out /lib/synthesis/asset_package.rb line 176.

== JavaScript Examples

Example call (based on above /config/asset_packages.yml):
  <%= javascript_include_merged :base %>

In development, this generates: 
  <script type="text/javascript" src="/javascripts/prototype.js?1228027240"></script>
  <script type="text/javascript" src="/javascripts/effects.js?1228027240"></script>
  <script type="text/javascript" src="/javascripts/controls.js?1228027240"></script>
  <script type="text/javascript" src="/javascripts/dragdrop.js?1228027240"></script>
  <script type="text/javascript" src="/javascripts/application.js?1228027240"></script>

In production, this generates: 
  <script type="text/javascript" src="/javascripts/base_packaged.js?123456789"></script>

== Stylesheet Examples

Example call:
  <%= stylesheet_link_merged :base %>

In development, this generates:
  <link href="/stylesheets/screen.css?1228027240" media="screen" rel="Stylesheet" type="text/css" />
  <link href="/stylesheets/header.css?1228027240" media="screen" rel="Stylesheet" type="text/css" />

In production this generates:
  <link href="/stylesheets/base_packaged.css?1228027240" media="screen" rel="Stylesheet" type="text/css" />

== Different CSS Media

All options for stylesheet_link_tag still work, so if you want to specify a different media type:
  <%= stylesheet_link_merged :secondary, 'media' => 'print' %>

== Rake tasks

rake asset:packager:build_all        # Merge and compress assets
rake asset:packager:create_yml       # Generate asset_packages.yml from existing assets
rake asset:packager:delete_all       # Delete all asset builds

== Running the tests

This plugin has a full suite of tests. But since they
depend on rails, it has to be run in the context of a
rails app, in the vendor/plugins directory. Observe:

> rails newtestapp
> cd newtestapp
> ./script/plugin install ./script/plugin install git://github.com/sbecker/asset_packager.git
> rake test:plugins PLUGIN=asset_packager # all tests pass

== License
Copyright (c) 2006-2008 Scott Becker - http://synthesis.sbecker.net
Contact via Github for change requests, etc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.