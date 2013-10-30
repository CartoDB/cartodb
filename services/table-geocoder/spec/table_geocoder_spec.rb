# encoding: utf-8
require_relative '../lib/table_geocoder.rb'
require_relative '../../geocoder/lib/geocoder.rb'
require_relative 'factories/pg_connection'
require 'ruby-debug'

RSpec.configure do |config|
  config.mock_with :mocha
end

describe CartoDB::TableGeocoder do
  let(:default_params) { {app_id: '', token: '', mailto: ''} }
  before do
    conn          = CartoDB::Importer2::Factories::PGConnection.new
    @db           = conn.connection
    @pg_options   = conn.pg_options
    @table_name   = "ne_10m_populated_places_simple"
    load_sql path_to("populated_places_short.sql"), @pg_options
  end

  after do
    @db.drop_table @table_name
  end

  describe '#run' do
    before do
      @tg = CartoDB::TableGeocoder.new(default_params.merge({
        table_name: @table_name,
        formatter:  "name, ', ', sov0name",
        connection: @db,
      }))
      @tg.geocoder.stubs(:upload).returns(true)
      @tg.geocoder.stubs(:request_id).returns('111')
      @tg.run
    end

    it "generates a csv file for uploading" do
      File.open("#{@tg.working_dir}/wadus.csv").read.should == File.read(path_to('nokia_input.csv'))
    end

    it "assigns a remote_id" do
      @tg.remote_id.should == '111'
    end
  end

  describe '#download_results' do
    it 'gets the geocoder results' do
      tg = CartoDB::TableGeocoder.new(table_name: 'a', connection: 'b')
      tg.geocoder.expects(:result).times(1).returns('a')
      tg.download_results
      tg.result.should == 'a'
    end
  end

  describe '#deflate_results' do
    it 'raises an error if no results file' do
      dir = Dir.mktmpdir
      tg = CartoDB::TableGeocoder.new(table_name: 'a', connection: 'b', working_dir: dir)
      expect { tg.deflate_results }.to raise_error
    end

    it 'extracts nokia result files' do
      dir = Dir.mktmpdir
      `cp #{path_to('kXYkQhuDfxnUSmWFP3dmq6TzTZAzwy4x.zip')} #{dir}`
      tg = CartoDB::TableGeocoder.new(table_name: 'a', connection: 'b', working_dir: dir)
      tg.deflate_results
      filename = 'result_20130919-04-55_6.2.46.1_out.txt'
      destfile = File.open(File.join(dir, filename))
      destfile.read.should eq File.open(path_to(filename)).read
    end
  end

  describe '#create_temp_table' do
    it 'raises error if no remote_id' do
      tg = CartoDB::TableGeocoder.new(table_name: 'a', connection: @db)
      expect { tg.create_temp_table }.to raise_error(Sequel::DatabaseError)
    end

    it 'creates a temporary table' do
      tg = CartoDB::TableGeocoder.new(table_name: 'a', connection: @db, remote_id: 'geo_HvyxzttLyFhaQ7JKmnrZxdCVySd8N0Ua')
      tg.create_temp_table
      @db.fetch("select * from #{tg.temp_table_name}").all.should eq []
    end
  end

  describe '#temp_table_name' do
    it 'returns geo_remote_id if available' do
      tg = CartoDB::TableGeocoder.new(table_name: 'a', connection: @db, remote_id: 'doesnotexist')
      tg.temp_table_name.should eq 'geo_doesnotexist'
    end

    it 'returns an alternative name if the table exists' do
      tg = CartoDB::TableGeocoder.new(table_name: 'a', connection: @db, remote_id: 'wadus')      
      @db.run("drop table if exists geo_wadus; create table geo_wadus (id int)")
      @db.run("drop table if exists geo_wadus_1; create table geo_wadus_1 (id int)")
      tg.temp_table_name.should eq 'geo_wadus_2'
    end
  end

  describe '#import_results_to_temp_table' do
  end

  describe '#load_results_into_original_table' do
  end

  it "wadus" do
    t = CartoDB::TableGeocoder.new(
      table_name: @table_name,
      formatter:  "name, ', ', sov0name",
      connection: @db,
      app_id: 'KuYppsdXZznpffJsKT24',
      token:  'A7tBPacePg9Mj_zghvKt9Q',
      mailto: 'arango@gmail.com'
    )
    t.run
    until t.geocoder.status == 'completed' do
      t.geocoder.update_status
      puts "#{t.geocoder.status} #{t.geocoder.processed_rows}/#{t.geocoder.total_rows}"
      sleep(2)
    end
    `open #{t.working_dir}`
    t.process_results
    @tg.should == ''
  end


  def path_to(filepath = '')
    File.expand_path(
      File.join(File.dirname(__FILE__), "../spec/fixtures/#{filepath}")
    )
  end #path_to


  def load_sql(path, pg_options)
    `psql -U #{pg_options[:user]} -f #{path} #{pg_options[:database]}`
  end # create_table

end # CartoDB::Geocoder
