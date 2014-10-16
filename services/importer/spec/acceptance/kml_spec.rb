# encoding: utf-8
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'
require_relative 'cdb_importer_context'

include CartoDB::Importer2

describe 'KML regression tests' do
  include_context "cdb_importer schema"

  it 'imports KML files' do
    filepath    = path_to('counties_ny_export.kml')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader, Doubles::Log.new)
    runner.run

    geometry_type_for(runner).should be
  end

  it 'imports KML files from url' do
    filepath    = "https://maps.google.com/maps/ms?hl=en&ie=UTF8&t=m" +
                  "&source=embed&authuser=0&msa=0&output=kml"         + 
                  "&msid=214357343079009794152.0004d0322cc2768ca065e"
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader, Doubles::Log.new)
    runner.run

    geometry_type_for(runner).should be
  end

  it 'imports KMZ in a 3D projection' do
    filepath    = path_to('usdm130806.kmz')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader, Doubles::Log.new)
    runner.run

    geometry_type_for(runner).should be
  end

  it 'imports multi-layer KMLs' do
    filepath    = path_to('multiple_layer.kml')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader, Doubles::Log.new)
    runner.run

    geometry_type_for(runner).should be
  end

  it 'raises if KML just contains a link to the actual KML url' do
    filepath    = path_to('abandoned.kml')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader, Doubles::Log.new)
    runner.run

    runner.results.first.error_code.should eq 3202
  end

  def path_to(filepath)
    File.expand_path(
      File.join(File.dirname(__FILE__), "../fixtures/#{filepath}")
    )
  end #path_to
end # KML regression tests
 
