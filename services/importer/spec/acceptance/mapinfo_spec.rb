# encoding: utf-8
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'
require_relative 'cdb_importer_context'

include CartoDB::Importer2

describe 'Mapinfo regression tests' do
  include_context "cdb_importer schema"

  it 'imports Mapinfo files' do
    filepath    = "http://dl.dropboxusercontent.com/u/931536/Ivanovo.zip"
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader, Doubles::Log.new)
    runner.run

    geometry_type_for(runner).should be
  end

  def path_to(filepath)
    File.expand_path(
      File.join(File.dirname(__FILE__), "../fixtures/#{filepath}")
    )
  end #path_to

end # Mapinfo regression tests
 

