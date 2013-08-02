# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require 'minitest/ci' if ENV['JOB_NAME']

require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'

include CartoDB::Importer2

describe 'Importer regression test' do  
  before do
    @pg_options  = Factories::PGConnection.new.pg_options
  end

  folder = ENV['TEST_FILES'] || File.join(File.dirname(__FILE__), 'failing/')
  Dir[File.join(folder, '/*')].each do |file|
    it "correctly imports file #{file}" do
      filepath    = file
      downloader  = Downloader.new(File.expand_path filepath)
      runner      = Runner.new(@pg_options, downloader)
      runner.run

      runner.results.each do |result|
        result[:success].must_equal true, "---> Importer failed: \n"+runner.report
      end
      runner.db.disconnect
    end
  end
end
