require_relative '../../../../spec/rspec_configuration'
require_relative '../../../../spec/spec_helper'
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'
require_relative '../doubles/user'
require_relative 'acceptance_helpers'
require_relative 'cdb_importer_context'
require_relative 'no_stats_context'

describe 'KML regression tests' do
  include AcceptanceHelpers
  include_context "cdb_importer schema"
  include_context "no stats"

  before(:all) do
    @user = create_user
    @user.save
  end

  after(:all) do
    @user.destroy
  end

  it 'imports KML files' do
    filepath    = path_to('counties_ny_export.kml')
    downloader  = CartoDB::Importer2::Downloader.new(@user.id, filepath)
    runner      = CartoDB::Importer2::Runner.new({
                               pg: @user.db_service.db_configuration_for,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new(@user),
                               user: @user
                             })
    runner.run

    geometry_type_for(runner, @user).should be
  end

  it 'imports KML files from url' do
    CartoDB::Importer2::Downloader.any_instance.stubs(:validate_url!).returns(true)
    serve_file 'services/importer/spec/fixtures/one_layer.kml' do |filepath|
      downloader  = CartoDB::Importer2::Downloader.new(@user.id, filepath)
      runner      = CartoDB::Importer2::Runner.new(
        pg: @user.db_service.db_configuration_for,
        downloader: downloader,
        log: CartoDB::Importer2::Doubles::Log.new(@user),
        user: @user
      )
      runner.run

      geometry_type_for(runner, @user).should be
    end
  end

  it 'imports KMZ in a 3D projection' do
    filepath    = path_to('usdm130806.kmz')
    downloader  = CartoDB::Importer2::Downloader.new(@user.id, filepath)
    runner      = CartoDB::Importer2::Runner.new({
                               pg: @user.db_service.db_configuration_for,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new(@user),
                               user: @user
                             })
    runner.run

    geometry_type_for(runner, @user).should be
  end

  it 'imports multi-layer KMLs' do
    filepath    = path_to('multiple_layer.kml')
    downloader  = CartoDB::Importer2::Downloader.new(@user.id, filepath)
    runner      = CartoDB::Importer2::Runner.new({
                               pg: @user.db_service.db_configuration_for,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new(@user),
                               user: @user
                             })
    runner.run

    geometry_type_for(runner, @user).should be
  end

  it 'raises if KML just contains a link to the actual KML url' do
    filepath    = path_to('abandoned.kml')
    downloader  = CartoDB::Importer2::Downloader.new(@user.id, filepath)
    runner      = CartoDB::Importer2::Runner.new({
                               pg: @user.db_service.db_configuration_for,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new(@user),
                               user: @user
                             })
    runner.run

    runner.results.first.error_code.should eq 3202
  end

  it 'imports a maximum of Runner::MAX_TABLES_PER_IMPORT KMLs from a zip ok' do
    # https://developers.google.com/kml/documentation/KML_Samples.kml
    filepath    = path_to('kml_samples.zip')
    downloader  = CartoDB::Importer2::Downloader.new(@user.id, filepath)
    runner      = CartoDB::Importer2::Runner.new({
                               pg: @user.db_service.db_configuration_for,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new(@user),
                               user: @user
                             })
    runner.run

    runner.results.select(&:success?).length.should eq CartoDB::Importer2::Runner::MAX_TABLES_PER_IMPORT
    runner.results.length.should eq CartoDB::Importer2::Runner::MAX_TABLES_PER_IMPORT
    runner.results.each { |result|
      name = @user.in_database[%Q{ SELECT * FROM pg_class WHERE relname='#{result.table_name}' }].first[:relname]
      name.should eq result.table_name
    }
  end

  it 'raises exception if KML style tag dont have and ID' do
    filepath    = path_to('style_without_id.kml')
    downloader  = CartoDB::Importer2::Downloader.new(@user.id, filepath)
    runner      = CartoDB::Importer2::Runner.new({
                               pg: @user.db_service.db_configuration_for,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new(@user),
                               user: @user
                             })
    runner.run

    runner.results.first.error_code.should eq 2009
  end

end
