# encoding: utf-8
require_relative '../spec_helper'
require_relative '../../app/connectors/importer'
require_relative '../doubles/result'
require 'csv'

describe CartoDB::Connector::Importer do

  before(:all) do
    @user = create_user(:quota_in_bytes => 1000.megabyte, :table_quota => 400)
  end

  before(:each) do
    stub_named_maps_calls
  end

  after(:all) do
    @user.destroy
  end


  it 'should not fail to return a new_name when ALTERing the INDEX fails' do

    # this basically validates the empty rescue handling in rename_the_geom_index_if_exists,
    # if you remove that rescue this test will fail

    runner = mock
    log = mock
    runner.stubs(:log).returns(log)
    log.expects(:append).at_least(0)
    quota_checker = mock
    id = UUIDTools::UUID.timestamp_create.to_s
    destination_schema = 'public'

    database = mock
    database.stubs(:execute).with { |query|
      /ALTER INDEX/.match(query)
    }.raises('wadus')

    database.stubs(:execute).with { |query|
      /ALTER TABLE/.match(query)
    }.returns(nil)

    table_registrar = mock
    table_registrar.stubs(:get_valid_table_name).returns('european_countries')

    importer_table_name = "table_#{UUIDTools::UUID.timestamp_create.to_s}"
    desired_table_name = 'european_countries'

    result_mock = CartoDB::Doubles::Importer2::Result.new({table_name: importer_table_name, name: desired_table_name})

    importer = CartoDB::Connector::Importer.new(runner, table_registrar, quota_checker, database, id, destination_schema)
    new_table_name = importer.rename(result_mock, importer_table_name, desired_table_name)
    new_table_name.should_not == nil
  end

  # This test checks that the importer detects files with names that are
  # psql reserved words and knows how to rename them (appending '_t')
  it 'should allow importing tables with reserved names' do
    reserved_word = CartoDB::POSTGRESQL_RESERVED_WORDS.sample

    filepath        = "/tmp/#{reserved_word.downcase}.csv"
    expected_rename = reserved_word.downcase + '_t'

    CSV.open(filepath, 'wb') do |csv|
      csv << ['nombre', 'apellido', 'profesion']
      csv << ['Manolo', 'Escobar', 'Artista']
    end
  
    data_import = DataImport.create(
      :user_id       => @user.id,
      :data_source   => filepath,
      :updated_at    => Time.now,
      :append        => false
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!

    File.delete(filepath)

    data_import.success.should(eq(true), "File with reserved name '#{filepath}' failed to be renamed")
    data_import.table_name.should(eq(expected_rename), "Table was incorrectly renamed to '#{data_import.table_name}', should be '#{expected_rename}'")
  end

  it 'should import tables as public if privacy param is set to public' do
    @user.private_tables_enabled = false
    @user.save

    filepath = "#{Rails.root}/spec/support/data/elecciones2008.csv"

    data_import = DataImport.create(
      :user_id       => @user.id,
      :data_source   => filepath,
      :updated_at    => Time.now,
      :append        => false,
      :privacy       => (::UserTable::PRIVACY_VALUES_TO_TEXTS.invert)['public']
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!

    UserTable[id: data_import.table.id].privacy.should eq (::UserTable::PRIVACY_VALUES_TO_TEXTS.invert)['public']
  end

  it 'should import tables as private if privacy param is set to private' do
    @user.private_tables_enabled = true
    @user.save

    filepath = "#{Rails.root}/spec/support/data/elecciones2008.csv"
  
    data_import = DataImport.create(
      :user_id       => @user.id,
      :data_source   => filepath,
      :updated_at    => Time.now,
      :append        => false,
      :privacy       => (::UserTable::PRIVACY_VALUES_TO_TEXTS.invert)['private']
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!

    UserTable[id: data_import.table.id].privacy.should eq (::UserTable::PRIVACY_VALUES_TO_TEXTS.invert)['private']
  end

  it 'should import tables as private by default if user has private tables enabled' do
    @user.private_tables_enabled = true
    @user.save

    filepath = "#{Rails.root}/spec/support/data/elecciones2008.csv"
  
    data_import = DataImport.create(
      :user_id       => @user.id,
      :data_source   => filepath,
      :updated_at    => Time.now,
      :append        => false
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!

    UserTable[id: data_import.table.id].privacy.should eq (::UserTable::PRIVACY_VALUES_TO_TEXTS.invert)['private']
  end

  it 'should import tables as public by default if user doesnt have private tables enabled' do
    @user.private_tables_enabled = false
    @user.save

    filepath = "#{Rails.root}/spec/support/data/elecciones2008.csv"
  
    data_import = DataImport.create(
      :user_id       => @user.id,
      :data_source   => filepath,
      :updated_at    => Time.now,
      :append        => false
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!

    UserTable[id: data_import.table.id].privacy.should eq (::UserTable::PRIVACY_VALUES_TO_TEXTS.invert)['public']
  end

  it 'should import as public with private_tables_enabled' do 
    @user.private_tables_enabled = true
    @user.save

    filepath = "#{Rails.root}/spec/support/data/elecciones2008.csv"
  
    data_import = DataImport.create(
      :user_id       => @user.id,
      :data_source   => filepath,
      :updated_at    => Time.now,
      :append        => false,
      :privacy       => (::UserTable::PRIVACY_VALUES_TO_TEXTS.invert)['public']
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!

    data_import.success.should eq true
  end

  it 'should not import as private if private_tables_enabled is disabled' do 
    @user.private_tables_enabled = false
    @user.save

    filepath = "#{Rails.root}/spec/support/data/elecciones2008.csv"
  
    data_import = DataImport.create(
      :user_id       => @user.id,
      :data_source   => filepath,
      :updated_at    => Time.now,
      :append        => false,
      :privacy       => (::UserTable::PRIVACY_VALUES_TO_TEXTS.invert)['private']
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!

    data_import.success.should_not eq true
  end
end



