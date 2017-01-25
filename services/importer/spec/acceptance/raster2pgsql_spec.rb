# encoding: utf-8
require_relative '../../../../spec/rspec_configuration'
require_relative '../../lib/importer/raster2pgsql'
require_relative '../../lib/importer/downloader'
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../../../spec/spec_helper'
require_relative '../doubles/log'
require_relative 'cdb_importer_context'
require_relative 'acceptance_helpers'
require_relative 'no_stats_context'
require 'active_support'

include CartoDB::Importer2

describe 'raster2pgsql acceptance tests' do
  include AcceptanceHelpers
  include_context "cdb_importer schema"
  include_context "no stats"

  before(:all) do
    @table_name = 'raster_test'
    @filepath = File.expand_path(File.join(File.dirname(__FILE__), "../fixtures/raster_simple.tif"))
    @user = create_user
    @user.save
  end

  after(:all) do
    @user.destroy
  end

  # TODO: TempFile for other tests who operate with the file


  it 'tests extracting size from a tif' do
    expected_size = [2052, 1780]

    rasterizer = Raster2Pgsql.new(@table_name, @filepath, {}, @user.db)

    size = rasterizer.send(:extract_raster_size)
    size.should eq expected_size
  end

  it 'tests calculating overviews' do
    raster_1_size = [16200, 8100]
    expected_overviews_1 = '2,4,8,16,32,64,128'
    expected_additional_tables_1 = [ "o_2_raster_test", "o_4_raster_test", "o_8_raster_test", "o_16_raster_test", \
                                     "o_32_raster_test", "o_64_raster_test", "o_128_raster_test" ]
    raster_2_size = [1024, 32]
    expected_overviews_2 = '2,4,8'
    expected_additional_tables_2 = [ "o_2_raster_test", "o_4_raster_test", "o_8_raster_test" ]
    raster_3_size = [1620000, 810000]
    expected_overviews_3 = '2,4,8,16,32,64,128,256,512'
    expected_additional_tables_3 = [ "o_2_raster_test", "o_4_raster_test", "o_8_raster_test", "o_16_raster_test", \
                                     "o_32_raster_test", "o_64_raster_test", "o_128_raster_test", \
                                     "o_256_raster_test", "o_512_raster_test" ]

    rasterizer = Raster2Pgsql.new(@table_name, @filepath, {}, @user.db)

    overviews = rasterizer.send(:calculate_raster_overviews, raster_1_size)
    overviews.should eq expected_overviews_1
    rasterizer.additional_support_tables.should eq expected_additional_tables_1

    overviews = rasterizer.send(:calculate_raster_overviews, raster_2_size)
    overviews.should eq expected_overviews_2
    rasterizer.additional_support_tables.should eq expected_additional_tables_2

    overviews = rasterizer.send(:calculate_raster_overviews, raster_3_size)
    overviews.should eq expected_overviews_3
    rasterizer.additional_support_tables.should eq expected_additional_tables_3
  end

  it 'tests calculating raster scale' do
    pixel_size = 3667.822831377844

    rasterizer = Raster2Pgsql.new(@table_name, @filepath, {}, @user.db)

    scale = rasterizer.send(:calculate_raster_scale, pixel_size)
    expected_scale = 2445.7403258239747
    scale.should be_within(1e-6).of(expected_scale)
  end

  it 'if there are some problem while importing should clean the temporary tables' do
      filepath    = path_to('raster_simple.tif')
      downloader  = CartoDB::Importer2::Downloader.new(@user.id, filepath)
      log         = CartoDB::Importer2::Doubles::Log.new(@user)
      job         = Job.new({ logger: log, pg_options: @user.db_service.db_configuration_for })
      runner      = CartoDB::Importer2::Runner.new({
                       pg: @user.db_service.db_configuration_for,
                       downloader: downloader,
                       log: CartoDB::Importer2::Doubles::Log.new(@user),
                       user: @user,
                       job: job
                     })
      CartoDB::Importer2::Raster2Pgsql.any_instance.stubs(:exit_code).returns(256)
      CartoDB::Importer2::Raster2Pgsql.any_instance.stubs(:command_output).returns('no space left on device')

      runner.run

      table_exists = @db.execute(%Q{SELECT *
                      FROM   information_schema.tables
                      WHERE  table_schema = '#{job.schema}'
                      AND    table_name = '#{job.table_name}'})
      table_exists.should be 0

      raster_tables = @db.execute(%Q{SELECT *
                      FROM   information_schema.tables
                      WHERE  table_schema = '#{job.schema}'
                      AND    table_name LIKE 'o_%_#{job.table_name}'})
      raster_tables.should be 0
  end

  it 'keeps the original table unaltered regardless of overviews' do
    pending "Fix for multiple CI configs #7645"
    TOLERANCE = 1e-6

    filepath    = path_to('raster_simple.tif')
    downloader  = CartoDB::Importer2::Downloader.new(@user.id, filepath)
    log         = CartoDB::Importer2::Doubles::Log.new(@user)
    job         = Job.new({ logger: log, pg_options: @user.db_service.db_configuration_for.with_indifferent_access })
    runner      = CartoDB::Importer2::Runner.new({
        pg: @user.db_service.db_configuration_for,
        downloader: downloader,
        log: CartoDB::Importer2::Doubles::Log.new(@user),
        user: @user,
        job: job
      })

    runner.run

    # Values taken from `gdalinfo -stats services/importer/spec/fixtures/raster_simple.tif`
    metadata = @user.in_database.fetch(%{
        SELECT * FROM raster_columns
        WHERE r_table_schema = '#{job.schema}' AND r_table_name = '#{job.table_name}'
      }).first
    metadata[:srid].should eq 4326
    metadata[:scale_x].should be_within(TOLERANCE).of +0.148148148148133
    metadata[:scale_y].should be_within(TOLERANCE).of -0.148148148148133

    stats = @user.in_database.fetch(%{
        WITH foo AS (
          SELECT the_raster_webmercator rast FROM #{job.schema}.#{job.table_name}
        ) SELECT (stats).* FROM (SELECT ST_summarystatsagg(rast, TRUE, 1) stats FROM foo) bar;
      }).first
    stats[:count].should eq 2430 * 1215
    stats[:mean].should be_within(TOLERANCE).of 204.51453640197
    stats[:stddev].should be_within(TOLERANCE).of 11.11767348697
    stats[:min].should be_within(TOLERANCE).of 58
    stats[:max].should be_within(TOLERANCE).of 253
  end
end
