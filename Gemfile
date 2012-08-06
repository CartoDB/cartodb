source 'http://rubygems.org'

gem "rails", "3.0.10"

gem "pg", "0.11"
gem "sequel", "3.29.0"
gem "sequel_pg", "1.2.0", :require=>'sequel'
gem "sequel_column_type_array", "~> 0.0.2"
#gem "sequel-rails", :git => "git://github.com/tokumine/sequel-rails.git", :tag => '0.3.6'
gem "sequel-rails-cartodb", "0.1.7", :require => "sequel-rails"
gem "rails_warden", "0.5.2"
gem "oauth", "0.4.5"
gem "oauth-plugin", "0.4.0.pre4"
gem "htmlentities"
gem "text-hyphen", "1.2.0"
gem "rgeo", "0.3.2"
gem "rgeo-geojson", "0.2.1", :require => "rgeo/geo_json"
gem "redis", "~> 2.2.2"
gem "resque", "~> 1.19.0"
gem "yajl-ruby", :require => "yajl"
gem "airbrake", '~> 3.0.4'
gem "nokogiri", '~> 1.5.2'
gem "statsd-client", :require => "statsd"

# importer
gem "ruby-ole", "~> 1.2.11.3"
gem "rchardet19", '1.3.5'
gem "roo", "~> 1.9.7"
gem "spreadsheet", "~> 0.6.5.9"
gem "google-spreadsheet-ruby", "~> 0.1.5"
gem "rubyzip", "~> 0.9.6.1"
gem "builder"
gem "state_machine", "~> 1.0"

group :development, :test do
  gem 'minitest', '~> 2.0.2', :require => 'minitest/unit'

  # this is for Ruby 1.9.2 debugging. You should upgrade to ruby 1.9.3, it's much faster in development
  if (RUBY_VERSION == "1.9.2")
    gem "ruby-debug-base19x", '~>0.11.30.pre3', :require => "ruby-debug", :platforms => :mri_19
    gem "ruby-debug19", '0.11.5', :require => "ruby-debug", :platforms => :mri_19
    gem "mocha"
  end

  ########################
  # This is for Ruby 1.9.3 debugging only. It requires that these gems are installed locally MANUALLY.
  # ONCE AGAIN: These gems are NOT on rubygems.org
  # ----------------------
  if (RUBY_VERSION == "1.9.3")
    gem "ruby-debug-base19", '0.11.26', :require => "ruby-debug", :platforms => :mri_19
    gem "ruby-debug19", '0.11.6', :require => "ruby-debug", :platforms => :mri_19
    gem "mocha", "~> 0.10.0"
  end
  ########################

  gem "steak", "2.0.0"
  gem "rspec-rails"
  gem "launchy"
  gem "capybara", "~> 1.1.1"
  gem "timecop"
  gem "email_spec"
  gem "rack-reverse-proxy", "~> 0.4.1", :require => 'rack/reverse_proxy'
  gem 'foreman'
  gem 'aws-sdk'
end



