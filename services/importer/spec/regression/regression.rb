require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'
require_relative '../../../../services/importer/spec/acceptance/cdb_importer_context'

include CartoDB::Importer2

describe 'Importer regression test' do
  include_context "cdb_importer schema"

  folder = ENV['TEST_FILES'] || File.join(File.dirname(__FILE__), 'failing/')
  Dir[File.join(folder, '/*')].each do |file|
    it "correctly imports file #{file}" do
      #INFO: this test depends on 'which raster2pgsql'

      filepath    = file
      downloader  = Downloader.new(File.expand_path filepath)
      runner      = Runner.new({
                                 pg: @pg_options,
                                 downloader: downloader,
                                 log: Doubles::Log.new,
                                 user:Doubles::User.new
                               })
      runner.run

      runner.results.each do |result|
        result.success?.should be_true, "error code: #{result.error_code}, trace: #{result.log_trace}"
      end
    end
  end
end
