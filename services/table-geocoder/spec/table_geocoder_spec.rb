# encoding: utf-8
require_relative '../lib/table_geocoder.rb'
require_relative '../../geocoder/lib/geocoder.rb'
require_relative 'factories/pg_connection'
require 'ruby-debug'

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
    it "geocodes postgresql tables" do
      t = CartoDB::TableGeocoder.new(
        table_name: @table_name,
        formatter:  "name, sov0name",
        connection: @db,
        app_id: '',
        token:  '',
        mailto: ''
      )
      t.run
      until t.geocoder.status == 'completed' do
        t.geocoder.update_status
        puts "#{t.geocoder.status} #{t.geocoder.processed_rows}/#{t.geocoder.total_rows}"
        sleep(2)
      end
      t.download_results
      t.deflate_results
      t.create_temp_table
      t.import_results_to_temp_table
      t.load_results_into_original_table
    end
  end

  describe '#download_results' do
  end
  describe '#deflate_results' do
  end
  describe '#create_temp_table' do
  end
  describe '#import_results_to_temp_table' do
  end
  describe '#load_results_into_original_table' do
  end

  def path_to(filepath)
    File.expand_path(
      File.join(File.dirname(__FILE__), "../spec/fixtures/#{filepath}")
    )
  end #path_to


  def load_sql(path, pg_options)
    `psql -U #{pg_options[:user]} -f #{path} #{pg_options[:database]}`
  end # create_table

end # CartoDB::Geocoder
