#encoding: UTF-8
require 'spec_helper'
require 'ruby-debug'
require_relative '../factories/pg_connection'

describe Geocoding do
  before(:all) do
    @user  = create_user(geocoding_quota: 200, geocoding_block_price: 1500)
  end

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)
  end

  after(:all) do
    CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
    @user.destroy
  end


  describe 'high-resolution' do
    it 'should not geocode more than 100 rows for a free user (CDB-3708)' do
      pending "$$$"
      @user.account_type.should eq "FREE"
      @user.geocoding_quota = 100
      @user.save!

      table = csv_to_table(@user, "105_unique_georeferenceable_places.csv", 105)

      geocoding = Geocoding.new kind: 'high-resolution', geometry_type: 'points'
      geocoding.formatter = "{string1}, {string2}"
      geocoding.user = @user
      geocoding.table_id = table.try(:id)
      geocoding.raise_on_save_failure = true
      geocoding.save
      geocoding.max_geocodable_rows.should eq 100

      geocoding.run!

      geocoding.real_rows.should eq 100
    end

    it "should georeference UK postcodes (CDB-4096)" do
      pending "$$$"
      User.any_instance.stubs(:geocoding_quota).returns(1000)

      table = csv_to_table(@user, "435_uk_postcodes.csv", 435)

      geocoding = Geocoding.new kind: 'high-resolution', geometry_type: 'points'
      geocoding.formatter = "{string1}"
      geocoding.user = @user
      geocoding.table_id = table.try(:id)
      geocoding.raise_on_save_failure = true
      geocoding.save

      geocoding.run!

      geocoding.state.should eq "finished"
      geocoding.processable_rows.should eq 435
      geocoding.real_rows.should eq 435
      User.any_instance.unstub(:geocoding_quota)
    end
  end

  def csv_to_table(user, filename, number_of_rows)
    db_connection = CartoDB::Factories::PGConnection.new(database: user.database_name).connection
    table = create_table(name: filename, user_id: user.id)
    load_csv(db_connection, table.name, path_to(filename))
    table.rows_counted.should eq number_of_rows
    table
  end

  def path_to(filepath = '')
    File.expand_path(
      File.join(File.dirname(__FILE__), "../fixtures/geocoding/#{ filepath }")
    )
  end #path_to

  def load_csv(db_connection, table_name, path)
    db_connection.run("ALTER TABLE #{table_name} ADD COLUMN string1 text, ADD COLUMN string2 text")
    db_connection.run("COPY #{table_name.lit}(cartodb_id, string1, string2) FROM '#{ path }' DELIMITER ',' CSV")
  end # create_table

end