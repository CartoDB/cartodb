source 'http://rubygems.org'

gem "rails", "3.2.0"

gem "rake",  "0.9.2.2"
gem "pg",                      "0.11"
gem "sequel",                  "3.37.0"
gem "sequel_pg",               "1.2.0", :require => "sequel"

# TODO remove this when everything works
# gem "sequel_column_type_array", "0.0.4"
# gem "sequel-rails", :git => "git://github.com/tokumine/sequel-rails.git", :tag => '0.3.6'
# gem "sequel-rails-cartodb", "~> 0.1.7", :require => "sequel-rails"
# gem "text-hyphen", "1.2.0"

gem "vizzuality-sequel-rails", "0.3.4"

gem "rails_warden",            "0.5.2" # Auth via the Warden Rack framework
gem "oauth",                   "0.4.5"
gem "oauth-plugin",            "0.4.0.pre4"

gem "htmlentities",            "4.3.1" # Encoding and decoding of named or numerical entities

gem "rgeo",                    "0.3.2" # Geospatial data library
gem "rgeo-geojson",            "0.2.1", :require => "rgeo/geo_json"

gem "redis",                   "2.2.2"
gem "resque",                  "1.19.0"
gem "resque-result",           "1.0.1"
gem "yajl-ruby",               "1.1.0", :require => "yajl"
gem "airbrake",                "3.0.9"
gem "nokogiri",                "1.5.3"
gem "statsd-client",           "0.0.7", :require => "statsd"

gem 'ejs'
group :assets do
  gem 'sass-rails',           '~> 3.2.3'
  gem 'uglifier',             '~> 1.0.3'
  gem 'therubyracer',         '~> 0.9.10'
  gem 'compass',              '~> 0.12.1'
  gem 'compass-rails',        '~> 1.0.1'  
end

# Importer
gem "ruby-ole",                "1.2.11.3"
gem "rchardet19",              "1.3.5"
gem "roo",                     "1.9.7"
gem "spreadsheet",             "0.6.5.9"
gem "google-spreadsheet-ruby", "0.1.8"
gem "rubyzip",                 "0.9.6.1"
gem "builder",                 "3.0.0"
gem "state_machine",           "1.1.2"

# TODO we should be able to remove this using the new
#      Rails routes DSL
gem "bartt-ssl_requirement",   "~>1.4.0", :require => "ssl_requirement"

gem "simplecov",               "0.6.4", :require => false, :group => :test
gem "spin",                    "0.5.3", :require => false, :group => :test

group :development, :test do
  gem "poltergeist",           "0.6.0"
  gem "minitest",              "2.0.2", :require => 'minitest/unit'
  gem "selenium-webdriver",    "2.5.0"

  gem "mocha",                 "0.10.5"

  # TODO fix debugger readline conflicts with resque
  # gem "debugger", "1.2.0"

  gem "steak",                 "2.0.0"
  gem "rspec-rails",           "2.10.1"
  gem "launchy",               "2.1.0"
  gem "capybara",              "1.1.2"
  gem "timecop",               "0.3.5"
  gem "email_spec",            "1.2.1"
  gem "rack-reverse-proxy",    "0.4.4", :require => 'rack/reverse_proxy'
  gem "foreman",               "0.46.0"
  gem "aws-sdk",               "1.5.2"
end
