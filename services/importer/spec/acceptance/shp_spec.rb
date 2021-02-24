require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../../../spec/spec_helper'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'
require_relative '../doubles/user'
require_relative 'acceptance_helpers'
require_relative 'cdb_importer_context'
require_relative 'no_stats_context'

include CartoDB::Importer2

describe 'SHP regression tests' do
  include AcceptanceHelpers
  include_context 'cdb_importer schema'
  include_context "no stats"

  before(:all) do
    @user = create_user
    @user.save
  end

  after(:all) do
    @user.destroy
  end

  it 'imports SHP files' do
    filepath    = path_to('TM_WORLD_BORDERS_SIMPL-0.3.zip')
    downloader  = Downloader.new(@user.id, filepath)
    runner      = Runner.new({
                               pg: @user.db_service.db_configuration_for,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new(@user),
                               user: @user
                             })
    runner.run

    geometry_type_for(runner, @user).should eq "MULTIPOLYGON"
    job = runner.send(:job)
    job.db.fetch(%Q{SELECT * FROM #{job.schema}.#{job.table_name}}).count
  end

  it 'imports shp files without .prj' do
    filepath    = path_to('shp_no_prj.zip')
    downloader  = Downloader.new(@user.id, filepath)
    runner      = Runner.new({
                               pg: @user.db_service.db_configuration_for,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new(@user),
                               user: @user
                             })
    runner.run

    geometry_type_for(runner, @user).should eq "MULTIPOLYGON"
    job = runner.send(:job)
    job.db.fetch(%Q{SELECT * FROM #{job.schema}.#{job.table_name}}).count
  end

  it 'generates proper error for invalid geometries' do
    filepath    = path_to('invalid_geom.zip')
    downloader  = Downloader.new(@user.id, filepath)
    runner      = Runner.new(pg: @user.db_service.db_configuration_for,
                             downloader: downloader,
                             log: CartoDB::Importer2::Doubles::Log.new(@user),
                             user: @user)
    runner.run

    expect(runner.results.first.error_code).to eq(2014)
  end
end
