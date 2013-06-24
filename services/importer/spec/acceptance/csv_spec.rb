# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../runner'
require_relative '../factories/pg_connection'

include CartoDB::Importer

describe 'csv regression tests' do
  it 'imports files exported from the SQL API' do
    filepath    = path_to('ne_10m_populated_places_simple.csv')
    pg_options  = Factories::PGConnection.new.pg_options
    runner      = Runner.new(pg_options, filepath)
    runner.run

    runner.exit_code.must_equal 0
  end

  it 'imports files from Google Fusion Tables' do
    url =
      "https://www.google.com/fusiontables/exporttable" +
      "?query=select+*+from+1dimNIKKwROG1yTvJ6JlMm4-B4LxMs2YbncM4p9g"
    pg_options  = Factories::PGConnection.new.pg_options
    runner      = Runner.new(pg_options, url)
    runner.run

    puts runner.job.logger.to_s
    runner.exit_code.must_equal 0
  end

  def path_to(filepath)
    File.join(File.dirname(__FILE__), "../fixtures/#{filepath}")
  end #path_to
end # csv regression tests

