# encoding: utf-8
require 'open3'
require_relative '../lib/table_geocoder'
require_relative 'factories/pg_connection'
require 'set'
require_relative '../../../spec/rspec_configuration'

describe CartoDB::TableGeocoder do
  let(:default_params) {{
    app_id: '',
    token: '',
    mailto: '',
    usage_metrics: mock('usage_metrics')
    }}
  before do
    conn          = CartoDB::Importer2::Factories::PGConnection.new
    @db           = conn.connection
    @pg_options   = conn.pg_options
    @table_name   = "ne_10m_populated_places_simple_#{rand.to_s[2..11]}"
    @log = mock
    @log.stubs(:append)
    @log.stubs(:append_and_store)

    # Avoid issues on some machines if postgres system account can't read fixtures subfolder for the COPY
    filename = 'populated_places_short.csv'
    _stdout, stderr, _status = Open3.capture3("cp #{path_to(filename)} /tmp/#{filename}")
    raise if stderr != ''
    load_csv "/tmp/#{filename}"
  end

  after do
    @db.drop_table @table_name
  end

  describe '#run' do
    before do
      # TODO: Note the coupling of the geocoder object and the metrics
      success_rows = 10
      empty_rows = 3
      failed_rows = 4
      total = success_rows + empty_rows + failed_rows
      default_params[:usage_metrics].expects(:incr).with(:geocoder_here, :success_responses, success_rows)
      default_params[:usage_metrics].expects(:incr).with(:geocoder_here, :empty_responses, empty_rows)
      default_params[:usage_metrics].expects(:incr).with(:geocoder_here, :failed_responses, failed_rows)
      default_params[:usage_metrics].expects(:incr).with(:geocoder_here, :total_requests, total)

      @tg = CartoDB::TableGeocoder.new(default_params.merge(table_name: @table_name,
                                                            qualified_table_name: @table_name,
                                                            sequel_qualified_table_name: @table_name,
                                                            formatter:  "name, ', ', iso3",
                                                            connection: @db,
                                                            log: @log,
                                                            max_rows: 1000))
      geocoder = mock
      geocoder.stubs(:upload).returns(true)
      geocoder.stubs(:request_id).returns('111')
      geocoder.stubs(:run).returns(true)
      geocoder.stubs(:status).returns('foo')

      # TODO: Note the coupling of the geocoder object and the metrics
      geocoder.stubs(:successful_processed_rows).returns(success_rows)
      geocoder.stubs(:empty_processed_rows).returns(empty_rows)
      geocoder.stubs(:failed_processed_rows).returns(failed_rows)

      @tg.stubs(:geocoder).returns(geocoder)
      @tg.stubs(:cache_disabled?).returns(true)
      @tg.run
    end

    it "generates a csv file for uploading" do
      expected = Set.new(File.readlines(path_to('nokia_input.csv')))
      actual = Set.new(File.readlines("#{@tg.working_dir}/wadus.csv"))
      actual.should == expected
    end

    it "assigns a remote_id" do
      @tg.remote_id.should == '111'
    end

    it "holds a db connection with the specified statement timeout" do
      timeout = @tg.connection.fetch("SHOW statement_timeout").all[0][:statement_timeout]
      timeout.should == '5h'
    end
  end

  describe '#generate_csv' do
    before do
      @tg = CartoDB::TableGeocoder.new(default_params.merge(table_name: @table_name,
                                                            qualified_table_name: @table_name,
                                                            sequel_qualified_table_name: @table_name,
                                                            formatter:  "name, ', ', iso3",
                                                            connection: @db,
                                                            log: @log,
                                                            max_rows: 1000))
      @tg.send(:ensure_georef_status_colummn_valid)
    end

    it "generates a csv file with the correct format" do
      @tg.send(:mark_rows_to_geocode)
      @tg.send(:generate_csv)
      File.readlines("#{@tg.working_dir}/wadus.csv").to_set.should == File.readlines(path_to('nokia_input.csv')).to_set
    end

    it "honors max_rows" do
      max_rows = 10
      @tg.stubs(:max_rows).returns max_rows
      @tg.send(:mark_rows_to_geocode)
      @tg.send(:generate_csv)

      # Note there might be duplicate input strings but we send unique inputs to the geocoder api.
      # Also note the csv file has a header.
      File.readlines("#{@tg.working_dir}/wadus.csv").count.should <= (max_rows + 1)
    end
  end

  describe '#download_results' do
    it 'gets the geocoder results' do
      tg = CartoDB::TableGeocoder.new(table_name: 'a', connection: @db, max_rows: 1000, usage_metrics: nil, log: @log)
      geocoder = mock
      geocoder.expects(:result).times(1).returns('a')
      tg.stubs(:geocoder).returns(geocoder)
      tg.send(:download_results)
      tg.result.should == 'a'
    end
  end

  describe '#deflate_results' do
    it 'does not raise an error if no results file' do
      dir = Dir.mktmpdir
      tg = CartoDB::TableGeocoder.new(table_name: 'a',
                                      connection: @db, working_dir: dir, max_rows: 1000, usage_metrics: nil, log: @log)
      expect { tg.send(:deflate_results) }.to_not raise_error
    end

    it 'extracts nokia result files' do
      dir = Dir.mktmpdir
      `cp #{path_to('kXYkQhuDfxnUSmWFP3dmq6TzTZAzwy4x.zip')} #{dir}`
      tg = CartoDB::TableGeocoder.new(table_name: 'a',
                                      connection: @db, working_dir: dir, max_rows: 1000, usage_metrics: nil, log: @log)
      tg.send(:deflate_results)
      filename = 'result_20130919-04-55_6.2.46.1_out.txt'
      destfile = File.open(File.join(dir, filename))
      destfile.read.should eq File.open(path_to(filename)).read
    end
  end

  describe '#create_temp_table' do
    it 'raises error if no remote_id' do
      tg = CartoDB::TableGeocoder.new(table_name: 'a', connection: @db, max_rows: 1000, usage_metrics: nil, log: @log)
      expect { tg.send(:create_temp_table) }.to raise_error(Sequel::DatabaseError)
    end

    it 'creates a temporary table' do
      tg = CartoDB::TableGeocoder.new(table_name: 'a',
                                      connection: @db,
                                      remote_id: 'geo_HvyxzttLyFhaQ7JKmnrZxdCVySd8N0Ua',
                                      log: @log,
                                      schema: 'public', max_rows: 1000, usage_metrics: nil)
      tg.send(:drop_temp_table)
      tg.send(:create_temp_table)
      @db.fetch("select * from #{tg.send(:temp_table_name)}").all.should eq []
    end
  end

  describe '#import_results_to_temp_table' do
    before do
      @tg = CartoDB::TableGeocoder.new(table_name: 'a',
                                       connection: @db,
                                       log: @log,
                                       remote_id: 'temp_table', schema: 'public', max_rows: 1000, usage_metrics: nil)
      @tg.send(:create_temp_table)
    end

    after do
      @tg.send(:drop_temp_table)
    end

    it 'loads the Nokia output format to an existing temp table' do
      @tg.stubs(:deflated_results_path).returns(path_to('nokia_output.txt'))
      @tg.send(:import_results_to_temp_table)
      @db.fetch(%{
        SELECT count(*) FROM #{@tg.send(:temp_table_name)}
        WHERE displayLatitude IS NOT NULL AND displayLongitude IS NOT NULL
      }).first[:count].should eq 44
    end
  end

  describe '#ensure_georef_status_colummn_valid' do
    before do
      table_name = 'wwwwww'
      @db.run("create table #{table_name} (id integer)")
      @tg = CartoDB::TableGeocoder.new(table_name: 'wwwwww',
                                       qualified_table_name: table_name,
                                       sequel_qualified_table_name: table_name,
                                       connection: @db,
                                       remote_id: 'wadus',
                                       max_rows: 1000,
                                       log: @log,
                                       usage_metrics: nil)
    end

    after do
      @db.run("drop table wwwwww")
    end

    it 'adds a boolean cartodb_georef_status column' do
      @tg.send(:ensure_georef_status_colummn_valid)
      @db.run("select cartodb_georef_status from wwwwww").should eq nil
    end

    it 'does nothing when the column already exists' do
      @tg.expects(:cast_georef_status_column).once
      @tg.send(:ensure_georef_status_colummn_valid)
      @tg.send(:ensure_georef_status_colummn_valid)
    end

    it 'casts cartodb_georef_status to boolean if needed' do
      @db.run('alter table wwwwww add column cartodb_georef_status text')
      @tg.send(:ensure_georef_status_colummn_valid)
      sql_query = "select data_type from information_schema.columns " \
                  "where table_name = 'wwwwww' and column_name = 'cartodb_georef_status'"
      @db.fetch(sql_query)
        .first[:data_type].should eq 'boolean'
    end
  end

  it "Geocodes a table using the batch geocoder API" do
    config = YAML.load_file("#{File.dirname(__FILE__)}/../../../config/app_config.yml")["test"]["geocoder"]
    pending "This is a System E2E test that can be useful for development but not suitable for CI"
    pending "No Geocoder config found for test environment" unless config['app_id'] != ''
    config = config.inject({}) do |memo, (k, v)|
      memo[k.to_sym] = v
      memo
    end
    config[:cache] = config[:cache].inject({}) do |memo, (k, v)|
      memo[k.to_sym] = v
      memo
    end
    t = CartoDB::TableGeocoder.new(config.merge(table_name: @table_name,
                                                qualified_table_name: @table_name,
                                                sequel_qualified_table_name: @table_name,
                                                formatter:  "name, ', ', iso3",
                                                connection: @db,
                                                schema:     'public',
                                                log: @log,
                                                max_rows: 1000))
    t.geocoder.stubs("use_batch_process?").returns(true)

    @db.fetch("select count(*) from #{@table_name} where the_geom is null").first[:count].should eq 14
    t.run
    until t.geocoder.status == 'completed' do
      t.geocoder.update_status
      puts "#{t.geocoder.status} #{t.geocoder.processed_rows}/#{t.geocoder.total_rows}"
      sleep(2)
    end
    t.process_results
    t.geocoder.status.should eq 'completed'
    t.geocoder.processed_rows.to_i.should eq 0
    t.cache.hits.should eq 10
    @db.fetch("select count(*) from #{@table_name} where the_geom is null").first[:count].should eq 0
    @db.fetch("select count(*) from #{@table_name} where cartodb_georef_status is false").first[:count].should eq 0
  end

  def path_to(filepath = '')
    File.expand_path(
      File.join(File.dirname(__FILE__), "../spec/fixtures/#{filepath}")
    )
  end

  def load_csv(path)
    @db.run("CREATE TABLE #{@table_name} (the_geom geometry, cartodb_id integer, name text, iso3 text)")
    @db.run("COPY #{@table_name.lit}(cartodb_id, name, iso3) FROM '#{path}' DELIMITER ',' CSV")
  end
end
