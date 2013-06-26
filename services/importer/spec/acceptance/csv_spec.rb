# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'

include CartoDB::Importer

describe 'csv regression tests' do
  before do
    pg_options  = Factories::PGConnection.new.pg_options
    @job        = Job.new(pg_options: pg_options)
  end

  it 'imports files exported from the SQL API' do
    filepath    = path_to('ne_10m_populated_places_simple.csv')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@job, downloader)
    runner.run

    puts "\n" + runner.report
    runner.exit_code.must_equal 0
  end

  it 'imports files from Google Fusion Tables' do
    url = "https://www.google.com/fusiontables/exporttable" +
          "?query=select+*+from+1dimNIKKwROG1yTvJ6JlMm4-B4LxMs2YbncM4p9g"
    downloader  = Downloader.new(url)
    runner      = Runner.new(@job, downloader)
    runner.run

    puts "\n" + runner.report
    runner.exit_code.must_equal 0
  end

  def path_to(filepath)
    File.join(File.dirname(__FILE__), "../fixtures/#{filepath}")
  end #path_to
end # csv regression tests

