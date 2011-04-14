source 'http://rubygems.org'
source 'http://gems.github.com'

gem 'rails', '3.0.6'
gem 'ruby-debug19', :require => 'ruby-debug', :group => [:development, :test], :platforms => :mri_19

gem 'pg', '0.10.1'
gem 'sequel-rails', :git => 'git://github.com/ferblape/sequel-rails.git'
gem 'nofxx-georuby', :require => 'geo_ruby'

gem 'warden'
gem 'rails_warden'
gem 'polyglot'
gem 'treetop'
gem 'htmlentities'
gem 'oauth'
gem 'oauth-plugin', '>=0.4.0.pre1'
gem 'sequel_column_type_array'
gem 'rgeo'
gem 'rgeo-geojson', :require => 'rgeo/geo_json'
gem 'roo'
gem 'spreadsheet'
gem 'google-spreadsheet-ruby', :require => 'google_spreadsheet'
gem "aws-ses", '0.4.1', :require => 'aws/ses'
gem 'rubyzip', :require => 'zip/zip'

group :development do
  gem 'capistrano'
  gem 'capistrano-ext'
  gem 'git-up'
  gem 'rdoc'
  gem 'passenger'
end

group :test, :development do
  gem 'mocha'
  gem 'steak'
  gem 'rspec'
  gem "rspec-rails"
  gem 'launchy'
  gem 'capybara'
  gem 'webrat'
  gem 'capybara-zombie', :git => 'https://github.com/plataformatec/capybara-zombie.git'
  gem 'timecop'
  gem 'email_spec'
end
