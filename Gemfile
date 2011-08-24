source 'http://rubygems.org'

gem "rails", "3.0.7"

gem "pg", "0.11"
gem "sequel-rails", :git => "git://github.com/ferblape/sequel-rails.git"
gem "nofxx-georuby", :require => "geo_ruby"

gem "rails_warden", "0.5.2"
gem "oauth"
gem "oauth-plugin", ">=0.4.0.pre1"
gem "sequel_column_type_array"
gem "htmlentities"
gem "rgeo"
gem "text-hyphen", "1.2.0"
gem "aws-ses", "0.4.1", :require => "aws/ses"
gem "rgeo-geojson", :require => "rgeo/geo_json"
gem "redis"
gem "resque"
gem "yajl-ruby", :require => "yajl"
gem "cartodb-importer", :git => "git@github.com:Vizzuality/cartodb-importer.git", :tag => "v0.1.12"
gem "exception_notification"

group :development do
  gem "capistrano"
  gem "capistrano-ext"
  #gem "terminitor"
end

group :test, :development do
  gem "passenger"
  gem "ruby-debug19", :require => "ruby-debug", :platforms => :mri_19
  gem "mocha"
  gem "steak"
  gem "rspec"
  gem "rspec-rails"
  gem "rspec-core", :git => "git://github.com/dblock/rspec-core.git"
  gem "launchy"
  gem "capybara"
  gem "webrat"
  gem "capybara-zombie", :git => "https://github.com/plataformatec/capybara-zombie.git"
  gem "timecop"
  gem "email_spec"
  gem "rack-reverse-proxy", "~> 0.4.1", :require => 'rack/reverse_proxy'
  gem 'minitest', '~> 2.0.2'
end
