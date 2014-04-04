source 'http://rubygems.org'

gem "rails",                   "3.2.2"


gem "rake",                    "0.9.2.2"
gem "pg",                      "0.13.2"
gem "sequel",                  "3.42.0"
gem "sequel_pg",               "1.6.3", require: "sequel"

gem "vizzuality-sequel-rails", "0.3.7", git: 'https://github.com/Vizzuality/sequel-rails.git'

gem "rails_warden",            "0.5.2" # Auth via the Warden Rack framework
gem "oauth",                   "0.4.5"
gem "oauth-plugin",            "0.4.0.pre4"

gem "htmlentities",            "4.3.1" # Encoding and decoding of named or numerical entities

gem "rgeo",                    "0.3.2" # Geospatial data library
gem "rgeo-geojson",            "0.2.1", require: "rgeo/geo_json"

gem "redis",                   "2.2.2"
gem "yajl-ruby",               "1.1.0", require: "yajl"
gem "nokogiri",                "1.6.0"
gem "statsd-client",           "0.0.7", require: "statsd"
gem "aws-sdk",                 "1.8.5"

gem "addressable",             "2.2.8", require: "addressable/uri"

gem "github_api",              "~> 0.10.2"

gem "ejs",                     "~> 1.1.1"

group :production, :staging do
  gem 'unicorn',               "4.8.2"
  gem 'raindrops',             "0.12.0"
end

group :assets do
  gem "compass",               "0.12.3"
end

# Importer
gem "ruby-ole",                "1.2.11.3"
gem "rchardet19",              "1.3.5"
gem "roo",                     "1.13.2"
gem "spreadsheet",             "0.6.5.9"
gem "google-spreadsheet-ruby", "0.1.8"
gem "rubyzip",                 "0.9.9"
gem "builder",                 "3.0.0"
gem "state_machine",           "1.1.2"
gem "typhoeus",                "0.6.7"
gem "charlock_holmes",         "0.6.9.4"
gem "dbf",                     "2.0.6"

# Synchronizer
gem "eventmachine",            "1.0.3"
gem "em-pg-client",            "0.2.1"

# Service components (/services)
gem "virtus",                   git: "https://github.com/solnic/virtus.git"
gem "aequitas",                 "0.0.2"
gem "uuidtools",                "2.1.3"
gem "sinatra",                  "1.3.4", require: 'sinatra/base'

# TODO we should be able to remove this using the new
#      Rails routes DSL
gem "bartt-ssl_requirement",   "~>1.4.0", require: "ssl_requirement"

# TODO Production gems, put them in :production group
gem "mixpanel",              "4.0.2"
gem "rollbar",               "0.12.12"
gem "resque",                "1.23.0"

group :development, :test do
  gem "webrick",               "1.3.1"
  gem "sqlite3",               "1.3.7"
  gem "poltergeist",           ">= 1.0.0"
  #gem "minitest",              "5.0.6", require: false
  gem "selenium-webdriver",    ">= 2.5.0"

  gem "mocha",                 "0.10.5"

  gem "debugger",              "1.6.5"

  gem "rspec-rails",           "2.10.1"
  gem "capybara",              "1.1.2"
  gem "timecop",               "0.6.3"
  gem "rack",                  "1.4.1"
  gem "rack-reverse-proxy",    "0.4.4",  require: 'rack/reverse_proxy'
  gem "rack-test",             "0.6.2",  require: 'rack/test'
  gem "foreman",               "0.46.0", require: false
  gem "factory_girl_rails",    "~> 4.0.0"

  # Guard
  gem 'rb-inotify',            "0.9.0", require: false
  gem "rb-fsevent",                     require: false
  gem "rb-fchange",                     require: false
  gem "guard",                 "1.8.1"
  #gem "guard-minitest",         "1.0.1"
  #gem "minitest-ci",            "~> 3.0.1", :require => false
  # Server
  gem 'thin',                           require: false
  gem 'parallel_tests'
end

# Load optional engines
# TODO activate when CartoDB plugins are finally included
# Dir["engines" + "/*/*.gemspec"].each do |gemspec_file|
#   dir_name = File.dirname(gemspec_file)
#   gem_name = File.basename(gemspec_file, File.extname(gemspec_file))

#   gem gem_name, :path => dir_name, :require => false
# end
