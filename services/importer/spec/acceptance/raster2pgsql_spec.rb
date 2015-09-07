# encoding: utf-8
require_relative '../../../../spec/rspec_configuration'
require_relative '../../lib/importer/raster2pgsql'
require_relative '../../lib/importer/downloader'
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../doubles/log'
require_relative '../doubles/user'
require_relative 'cdb_importer_context'
require_relative 'acceptance_helpers'
require_relative 'no_stats_context'

include CartoDB::Importer2

describe 'raster2pgsql acceptance tests' do
  include AcceptanceHelpers
  include_context "cdb_importer schema"
  include_context "no stats"

  before(:all) do
    @table_name = 'raster_test'
    @filepath = File.expand_path(File.join(File.dirname(__FILE__), "../fixtures/raster_simple.tif"))
  end

  # TODO: TempFile for other tests who operate with the file


  it 'tests extracting size from a tif' do
    expected_size = [2052, 1780]

    rasterizer = Raster2Pgsql.new(@table_name, @filepath, {})

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

    rasterizer = Raster2Pgsql.new(@table_name, @filepath, {})

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

    rasterizer = Raster2Pgsql.new(@table_name, @filepath, {})

    scale = rasterizer.send(:calculate_raster_scale, pixel_size)
    # 4891.480651647949  but just in case decimals change
    scale.should > 4891
    scale.should < 4892
  end

  it 'if there are some problem while importing should clean the temporary tables' do
      filepath    = path_to('raster_simple.tif')
      downloader  = CartoDB::Importer2::Downloader.new(filepath)
      log         = CartoDB::Importer2::Doubles::Log.new
      job         = Job.new({ logger: log, pg_options: @pg_options })
      runner      = CartoDB::Importer2::Runner.new({
                       pg: @pg_options,
                       downloader: downloader,
                       log: CartoDB::Importer2::Doubles::Log.new,
                       user: CartoDB::Importer2::Doubles::User.new,
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

end

