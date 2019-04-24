source 'http://rubygems.org'

gem 'rails',                   '4.2.11'

gem 'rake',                    '0.9.2.2'

# PostgreSQL
gem 'pg',                      '0.20.0'
gem 'sequel',                  '~> 4.45.0'
gem 'sequel-rails', '~> 1.0.1'
gem 'sequel_pg',               '~> 1.12.0', require: 'sequel'

gem 'activerecord-postgresql-adapter'

gem 'protected_attributes'
gem 'responders', '~> 2.0'

gem 'rails_warden',            '0.5.8' # Auth via the Warden Rack framework
gem 'ruby-saml',               '1.4.1'
gem 'oauth',                   '0.4.7'
gem 'oauth-plugin',            git: 'https://github.com/CartoDB/oauth-plugin.git', :branch => 'cartodb'

# Redis
gem 'hiredis',                 '~> 0.6.1'
gem 'redis',                   '~> 3.3.5'

gem 'nokogiri',                '~> 1.8.2'
gem 'statsd-client',           '0.0.7', require: 'statsd'
gem 'aws-sdk-s3',              '~> 1'
gem 'ruby-prof',               '0.15.1'
gem 'request_store',           '1.1.0'

# It's used in the dataimport and arcgis.
# It's a replacement for the ruby uri that it's supposed to perform better parsing of a URI
gem 'addressable',             '~> 2.5', require: 'addressable/uri'

gem 'ejs',                     '~> 1.1.1'
gem 'execjs',                  '~> 0.4' # Required by ejs

gem 'net-ldap',                '0.16.0'
gem 'json-schema',             '2.1.9'

gem 'mime-types',              '3.1'

group :production, :staging do
  gem 'unicorn',               '4.8.2'
  gem 'unicorn-worker-killer'
  gem 'raindrops',             '0.15.0'
end

group :assets do
  gem "compass",               "1.0.3"
end

# Importer & sync tables
gem 'roo',                     '1.13.2'
gem 'state_machines-activerecord', '~> 0.5.0'
gem 'typhoeus',                '0.7.2'
gem 'charlock_holmes',         '0.7.6'
gem 'dbf',                     '2.0.6'
gem 'faraday',                 '0.9.0'
gem 'google-api-client',       '0.28.4'
gem 'dropbox_api',             '0.1.6'
gem 'instagram',               '1.1.6'
gem 'gibbon',                  '1.1.4'

# Service components (/services)
gem 'virtus',                   '1.0.5'
gem 'uuidtools',                '2.1.5'
# TODO: change to master branch when the gem is ready
gem 'cartodb-common',           :git => 'https://github.com/cartodb/cartodb-common.git', :branch => 'encryption-service'

# Markdown
gem 'redcarpet', '3.3.3'

# TODO Production gems, put them in :production group
gem 'rollbar',               '~>2.11.1'
gem 'resque',                '1.25.2'
gem 'resque-metrics',        '0.1.1'

gem 'net-telnet'

# This is weird. In ruby 2 test-unit is required. We don't know why for sure
gem 'test-unit'

# Multifactor Authentication
gem 'rotp', '~> 3.3', '>= 3.3.1'
gem 'rqrcode', '~> 0.10.1'

group :test do
  gem 'simplecov', '0.13.0', require: false
  gem 'simplecov-json'
  gem 'simplecov-rcov'
  gem 'db-query-matchers',     '0.4.0'
  gem 'rack-test',             '0.6.3',  require: 'rack/test'
  gem 'factory_girl_rails',    '~> 4.0.0'
  gem 'selenium-webdriver',    '>= 2.5.0'
  gem 'capybara',              '1.1.2'
  gem 'delorean'
  gem 'webrick',               '1.3.1'
  gem 'mocha',                 '1.1.0'
  gem 'ci_reporter',           '1.8.4'
  gem 'poltergeist',           '>= 1.0.0'
  gem 'activerecord-nulldb-adapter', '0.3.1'
  # Need to use specific branch from this fork as original gem is broken and outdated
  gem 'fake_net_ldap', git: 'https://github.com/kuldeepaggarwal/fake_net_ldap.git', :branch => 'fix-responder'
  gem 'mock_redis'
end

# Profiling
gem 'rbtrace',                 '0.4.8'
group :test, :development do
  gem 'gc_tracer',             '1.5.1'
  gem 'memory_profiler'
end

group :development, :test do
  gem 'rspec-rails',           '2.12.0'
  gem 'rb-readline'
  gem 'byebug'
  gem 'rack'
  gem 'zeus'

  # Server
  gem 'thin',                           require: false
end

# segment metrics
gem 'analytics-ruby', '~> 2.0.0', :require => 'segment/analytics'

# CARTO Gears engines
require File.dirname(__FILE__) + '/lib/carto/carto_gears_support'

Carto::CartoGearsSupport.new.gears.each do |gear|
  gear.gemspec.runtime_dependencies.each do |dependency|
    gem dependency.name, dependency.requirements_list
  end
end
