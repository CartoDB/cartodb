source 'http://rubygems.org'

gem "rails",                   "3.2.2"

gem "rake",                    "0.9.2.2"
gem "pg",                      "0.11"
gem "sequel",                  "3.42.0"
gem "sequel_pg",               "1.6.3", :require => "sequel"

gem "vizzuality-sequel-rails", "0.3.6", :git => 'https://github.com/Vizzuality/sequel-rails.git'

gem "rails_warden",            "0.5.2" # Auth via the Warden Rack framework
gem "oauth",                   "0.4.5"
gem "oauth-plugin",            "0.4.0.pre4"

gem "htmlentities",            "4.3.1" # Encoding and decoding of named or numerical entities

gem "rgeo",                    "0.3.2" # Geospatial data library
gem "rgeo-geojson",            "0.2.1", :require => "rgeo/geo_json"

gem "redis",                   "2.2.2"
gem "resque",                  "1.23.0"
gem "yajl-ruby",               "1.1.0", :require => "yajl"
gem "rollbar"
gem "nokogiri",                "1.5.3"
gem "statsd-client",           "0.0.7", :require => "statsd"
gem "aws-sdk",                 "1.8.5"

gem "addressable",             "2.2.8", :require => "addressable/uri"

#gem "newrelic_rpm",            "~> 3.5.5"

gem "ejs",                     "~> 1.1.1"
#gem "turbo-sprockets-rails3",  "0.1.16"
group :assets do
  gem 'sass-rails',            "~> 3.2.3"
  gem 'uglifier',              "~> 1.3.0"
  gem 'therubyracer',          "~> 0.9.10"
  gem 'compass',               "~> 0.12.1"
  gem 'compass-rails',         "~> 1.0.1"
  gem 'chunky_png',            "~> 1.2.6"
  gem 'oily_png',              "~> 1.0.2"
  gem 'mustache-trimmer',      :git => 'https://github.com/josh/mustache-trimmer.git'
end

# Importer
gem "ruby-ole",                "1.2.11.3"
gem "rchardet19",              "1.3.5"
gem "roo",                     "1.11.2"
gem "spreadsheet",             "0.6.5.9"
gem "google-spreadsheet-ruby", "0.1.8"
gem "rubyzip",                 "0.9.9"
gem "builder",                 "3.0.0"
gem "state_machine",           "1.1.2"
gem "typhoeus",                "0.6.3"

# Service components (/services)
gem "virtus",                  git: "https://github.com/solnic/virtus.git"
gem "aequitas"
gem "uuidtools"
gem "rubyzip",                  "0.9.9"
gem "sinatra",                  "1.3.4", require: 'sinatra/base'

# TODO we should be able to remove this using the new
#      Rails routes DSL
gem "bartt-ssl_requirement",   "~>1.4.0", :require => "ssl_requirement"

gem "simplecov",               "0.7.1", :require => false, :group => :test
gem "spin",                    "0.5.3", :require => false, :group => :test

group :development, :test do
  gem "webrick",               "1.3.1"
  gem "sqlite3",               "1.3.7"
  gem "poltergeist",           ">= 1.0.0"
  gem "minitest",              "2.0.2", :require => 'minitest/unit'
  gem "selenium-webdriver",    ">= 2.5.0"

  gem "mocha",                 "0.10.5"

  gem "debugger",              "1.3.0"

  gem "steak",                 "2.0.0"
  gem "rspec-rails",           "2.10.1"
  gem "launchy",               "2.1.0"
  gem "capybara",              "1.1.2"
  gem "timecop",               "0.3.5"
  gem "email_spec",            "1.2.1"
  gem "rack",                  "1.4.1"
  gem "rack-reverse-proxy",    "0.4.4", :require => 'rack/reverse_proxy'
  gem "rack-test"
  gem "foreman",               "0.46.0"
  gem "factory_girl_rails",    "~> 4.0.0"
  gem "bogus",                 "0.0.3"

  # Guard
  gem 'rb-inotify', '~> 0.8.8', :require => false
  gem "rb-fsevent", :require => false
  gem "rb-fchange", :require => false
  gem "guard"
  gem "guard-minitest"

  # Server
  gem 'thin'
end
