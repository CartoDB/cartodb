source 'http://rubygems.org'

gem 'rails',                   '3.2.22'

gem 'rake',                    '0.9.2.2'
gem 'pg',                      '0.15.0'
gem 'sequel',                  '3.42.0'
gem 'sequel_pg',               '1.6.3', require: 'sequel'

gem 'activerecord-postgresql-adapter'
# NOTE: Forced on purpose due to this bug https://github.com/tlconnor/activerecord-postgres-array/issues/37
gem 'activerecord-postgres-array', '0.0.9'

gem 'vizzuality-sequel-rails', '0.3.7', git: 'https://github.com/Vizzuality/sequel-rails.git'

gem 'rails_warden',            '0.5.8' # Auth via the Warden Rack framework
gem 'oauth',                   '0.4.5'
gem 'oauth-plugin',            '0.4.0.pre4'

gem 'redis',                   '3.2.1'
gem 'hiredis',                 '0.6.0'
gem 'nokogiri',                '~> 1.6.6.2'
gem 'statsd-client',           '0.0.7', require: 'statsd'
gem 'aws-sdk',                 '1.8.5'
gem 'ruby-prof',               '0.15.1'
gem 'request_store',           '1.1.0'

# It's used in the dataimport and arcgis.
# It's a replacement for the ruby uri that it's supposed to perform better parsing of a URI
gem 'addressable',             '2.3.2', require: 'addressable/uri'

gem 'ejs',                     '~> 1.1.1'
gem 'execjs',                  '~> 0.4' # Required by ejs

gem 'net-ldap',                '0.11'

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
gem 'state_machine',           '1.1.2'
gem 'typhoeus',                '0.7.2'
gem 'charlock_holmes',         '0.7.2'
gem 'dbf',                     '2.0.6'
gem 'faraday',                 '0.9.0'
gem 'retriable',               '1.4.1'  # google-api-client needs this
gem 'google-api-client',       '0.7.0'
gem 'dropbox-sdk',             '1.6.3'
gem 'instagram',               '1.1.6'
gem 'gibbon',                  '1.1.4'

# Geocoder (synchronizer doesn't needs it anymore)
gem 'eventmachine',            '1.0.4'
gem 'em-pg-client',            '0.2.1'

# Service components (/services)
gem 'virtus',                   '1.0.5'
gem 'uuidtools',                '2.1.5'

# Markdown
gem 'redcarpet', '3.3.3'

# TODO we should be able to remove this using the new
#      Rails routes DSL
gem 'bartt-ssl_requirement',   '~>1.4.0', require: 'ssl_requirement'

# TODO Production gems, put them in :production group
gem 'rollbar',               '~>2.8.3'
gem 'resque',                '1.25.2'
gem 'resque-metrics',        '0.1.1'

# This is weird. In ruby 2 test-unit is required. We don't know why for sure
gem 'test-unit'

group :test do
  gem 'simplecov',                       require: false
  gem 'simplecov-json'
  gem 'simplecov-rcov'
  gem 'db-query-matchers',     '0.4.0'
  gem 'rack-test',             '0.6.2',  require: 'rack/test'
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

  # Server
  gem 'thin',                           require: false
end

# segment metrics
gem 'analytics-ruby', '~> 2.0.0', :require => 'segment/analytics'

# Load optional engines
# TODO activate when CartoDB plugins are finally included
# Dir['engines' + '/*/*.gemspec'].each do |gemspec_file|
#   dir_name = File.dirname(gemspec_file)
#   gem_name = File.basename(gemspec_file, File.extname(gemspec_file))
#   gem gem_name, :path => dir_name, :require => false
# end
