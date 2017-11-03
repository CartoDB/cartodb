# Must be placed at the beginning
# @see https://github.com/colszowka/simplecov#getting-started
unless ENV['PARALLEL'] || ENV['NO_COVERAGE']
  if ENV['RAILS_ENV'] =~ /^test(.*)?/
    require 'simplecov'
    require 'simplecov-json'
    require 'simplecov-rcov'

    SimpleCov.formatters = [
      SimpleCov::Formatter::HTMLFormatter,
      SimpleCov::Formatter::JSONFormatter,
      SimpleCov::Formatter::RcovFormatter
    ]

    SimpleCov.start 'rails' do
      # Default is just 10 mins, else will drop "old" coverage data
      track_files "{app,lib,services}/**/*.rb"
      merge_timeout 7200
      puts ENV['TEST_ENV_NUMBER']
      command_name "specs_#{Process.pid}"
      add_filter "/spec/"
      add_filter "/lib/assets/"
      add_filter "/tmp/"
      add_filter "/db/"
    end
  end
end
