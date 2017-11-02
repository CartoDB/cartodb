# encoding: utf-8
require_relative '../spec_helper'
require_relative '../../app/connectors/importer'
require_relative '../doubles/result'
require 'csv'

describe CartoDB::Connector::Importer do

  before(:all) do
    @user = create_user(quota_in_bytes: 1000.megabyte, table_quota: 400, max_layers: 4)
  end

  before(:each) do
    bypass_named_maps
  end

  after(:each) do
    if @data_import
      @data_import.table.destroy if @data_import.table.id.present?
      @data_import.destroy
    end
    @visualization.destroy if @visualization
    ::UserTable[@existing_table.id].destroy if @existing_table
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  let(:skip) { DataImport::COLLISION_STRATEGY_SKIP }

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
    table_registrar.stubs(:user).returns(@user)

    importer_table_name = "table_#{UUIDTools::UUID.timestamp_create.to_s}"
    desired_table_name = 'european_countries'

    result_mock = CartoDB::Doubles::Importer2::Result.new({table_name: importer_table_name, name: desired_table_name})

    importer = CartoDB::Connector::Importer.new(
      runner: runner,
      table_registrar: table_registrar,
      quota_checker: quota_checker,
      database: database,
      data_import_id: id,
      destination_schema: destination_schema
    )
    new_table_name = importer.rename(result_mock, importer_table_name, desired_table_name, destination_schema)
    new_table_name.should_not == nil
  end

  # This test checks that the importer detects files with names that are
  # psql reserved words and knows how to rename them (appending '_t')
  it 'should allow importing tables with reserved names' do
    reserved_word = Carto::DB::Sanitize::RESERVED_WORDS.sample

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

    @data_import = DataImport.create(
      :user_id       => @user.id,
      :data_source   => filepath,
      :updated_at    => Time.now,
      :append        => false,
      :privacy       => (::UserTable::PRIVACY_VALUES_TO_TEXTS.invert)['public']
    )
    @data_import.values[:data_source] = filepath

    @data_import.run_import!

    UserTable[id: @data_import.table.id].privacy.should eq ::UserTable::PRIVACY_VALUES_TO_TEXTS.invert['public']
  end

  it 'importing the same file twice should import the table twice renaming the second import' do
    name = 'elecciones2008'
    filepath = "#{Rails.root}/spec/support/data/#{name}.csv"

    @data_import = DataImport.create(user_id: @user.id, data_source: filepath)
    @data_import.values[:data_source] = filepath
    @data_import.run_import!

    @data_import.success.should eq true
    UserTable[id: @data_import.table.id].name.should eq name

    data_import2 = DataImport.create(user_id: @user.id, data_source: filepath)
    data_import2.values[:data_source] = filepath
    data_import2.run_import!

    data_import2.success.should eq true
    UserTable[id: data_import2.table.id].name.should eq "#{name}_1"

    data_import2.table.destroy if data_import2 && data_import2.table.id.present?
    data_import2.destroy
  end

  it 'handles import with almost identical long file names properly' do
    long_name1 = 'carto_long_filename_that_almost_matches_another_one_63chars_aaa'
    filepath1 = "#{Rails.root}/spec/support/data/#{long_name1}.csv"

    @data_import = DataImport.create(user_id: @user.id, data_source: filepath1)
    @data_import.values[:data_source] = filepath1
    @data_import.run_import!

    expect(@data_import.success).to be_true
    expect(UserTable[id: @data_import.table.id].name).to eq(long_name1)

    long_name2 = 'carto_long_filename_that_almost_matches_another_one_63chars_aab'
    filepath2 = "#{Rails.root}/spec/support/data/#{long_name2}.csv"

    data_import2 = DataImport.create(user_id: @user.id, data_source: filepath2)
    data_import2.values[:data_source] = filepath2
    data_import2.run_import!

    expect(data_import2.success).to be_true

    expected_name = 'carto_long_filename_that_almost_matches_another_one_63chars_a_1'
    expect(UserTable[id: data_import2.table.id].name).to eq(expected_name)

    data_import2.table.destroy if data_import2 && data_import2.table.id.present?
    data_import2.destroy
  end

  it 'importing the same file twice with collision strategy skip should import the table once' do
    name = 'elecciones2008'
    filepath = "#{Rails.root}/spec/support/data/#{name}.csv"

    @data_import = DataImport.create(user_id: @user.id, data_source: filepath, collision_strategy: skip)
    @data_import.values[:data_source] = filepath
    @data_import.run_import!

    UserTable[id: @data_import.table.id].name.should eq name
    @data_import.success.should eq true

    data_import2 = DataImport.create(user_id: @user.id, data_source: filepath, collision_strategy: skip)
    data_import2.values[:data_source] = filepath
    data_import2.run_import!

    data_import2.error_code = 1022
    data_import2.success.should eq true

    data_import2.tables_created_count.should eq 0
    data_import2.table_names.should eq ''
    data_import2.table_name.should be_nil

    data_import2.table.destroy if data_import2 && data_import2.table.id.present?
    data_import2.destroy
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

  it 'should import table and vis as private if privacy param is set to private' do
    @user.private_tables_enabled = true
    @user.private_maps_enabled = true
    @user.save

    filepath = "#{Rails.root}/spec/support/data/elecciones2008.csv"

    data_import = DataImport.create(
      user_id: @user.id,
      data_source: filepath,
      updated_at: Time.now.utc,
      append: false,
      privacy: (::UserTable::PRIVACY_VALUES_TO_TEXTS.invert)['private'],
      create_visualization: true
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!

    data_import.success.should eq true
    Carto::Visualization.find_by_id(data_import.visualization_id).privacy.should eq 'private'

    data_import.values[:data_source] = filepath

    data_import.run_import!

    UserTable[id: data_import.table.id].privacy.should eq (::UserTable::PRIVACY_VALUES_TO_TEXTS.invert)['private']
  end

  it 'should import vis as public if privacy param is set to private and user doesn\' have private maps' do
    @user.private_tables_enabled = true
    @user.private_maps_enabled = false
    @user.save

    filepath = "#{Rails.root}/spec/support/data/elecciones2008.csv"

    data_import = DataImport.create(
      user_id: @user.id,
      data_source: filepath,
      updated_at: Time.now.utc,
      append: false,
      privacy: ::UserTable::PRIVACY_VALUES_TO_TEXTS.invert['private'],
      create_visualization: true
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!

    data_import.success.should eq true
    Carto::Visualization.find_by_id(data_import.visualization_id).privacy.should eq 'public'

    data_import.values[:data_source] = filepath

    data_import.run_import!

    UserTable[id: data_import.table.id].privacy.should eq ::UserTable::PRIVACY_VALUES_TO_TEXTS.invert['private']
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

  it 'should import as public with private_tables enabled' do
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

  it 'should import table and vis as public with private_tables enabled' do
    @user.private_tables_enabled = true
    @user.save

    filepath = "#{Rails.root}/spec/support/data/elecciones2008.csv"

    data_import = DataImport.create(
      user_id: @user.id,
      data_source: filepath,
      updated_at: Time.now.utc,
      append: false,
      privacy: (::UserTable::PRIVACY_VALUES_TO_TEXTS.invert)['public'],
      create_visualization: true
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!

    data_import.success.should eq true
    Carto::Visualization.find_by_id(data_import.visualization_id).privacy.should eq 'public'
  end

  it 'imported visualization should have registered table dependencies' do
    filepath = "#{Rails.root}/spec/support/data/elecciones2008.csv"

    data_import = DataImport.create(
      user_id: @user.id,
      data_source: filepath,
      updated_at: Time.now.utc,
      append: false,
      create_visualization: true
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!

    data_import.success.should eq true
    visualization = Carto::Visualization.find_by_id(data_import.visualization_id)
    data_layer = visualization.data_layers.first
    data_layer.user_tables.size.should eq 1
    data_layer.user_tables.first.name.should include 'elecciones2008'
  end

  it 'imports files for Builder users' do
    old_builder_enabled = @user.builder_enabled
    @user.builder_enabled = true
    @user.save

    filepath = "#{Rails.root}/spec/support/data/elecciones2008.csv"

    data_import = DataImport.create(
      user_id: @user.id,
      data_source: filepath,
      updated_at: Time.now.utc,
      append: false,
      create_visualization: true
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!

    data_import.success.should eq true
    visualization = Carto::Visualization.find_by_id(data_import.visualization_id)
    data_layer = visualization.data_layers.first
    data_layer.user_tables.size.should eq 1
    data_layer.user_tables.first.name.should include 'elecciones2008'

    @user.builder_enabled = old_builder_enabled
    @user.save
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

    # It raises #<RuntimeError: Error: User doesn't have private tables enabled>
    expect { data_import.run_import! }.to raise_error(RuntimeError)

    data_import.success.should_not eq true
  end

  it 'should be able to handle wrong type guessing' do
    filepath = "#{Rails.root}/spec/support/data/wrong_the_geom_guessing.csv"

    data_import = DataImport.create(
      user_id:      @user.id,
      data_source:  filepath,
      updated_at:   Time.now,
      append:       false
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!

    data_import.success.should eq true
  end

  it 'should be able to import a multi file zip as a multilayer map' do
    @user.max_layers = 5
    @user.save

    filepath = "#{Rails.root}/spec/support/data/multilayer_shp.zip"

    data_import = DataImport.create(
      user_id: @user.id,
      data_source: filepath,
      updated_at: Time.now.utc,
      append: false,
      create_visualization: true
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!
    data_import.success.should eq true

    vis = Carto::Visualization.find_by_id(data_import.visualization_id)
    vis.map.data_layers.count.should eq 5
  end

  it 'should be able to handle a zip with more files max_layers' do
    @user.max_layers = 2
    @user.save

    filepath = "#{Rails.root}/spec/support/data/multilayer_shp.zip"

    data_import = DataImport.create(
      user_id: @user.id,
      data_source: filepath,
      updated_at: Time.now.utc,
      append: false,
      create_visualization: true
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!
    data_import.success.should eq true

    vis = Carto::Visualization.find_by_id(data_import.visualization_id)
    vis.map.data_layers.count.should eq @user.max_layers

    data_import.rejected_layers.split(',').count.should eq 3
  end

  describe 'visualization importing' do
    it 'imports a visualization export' do
      filepath = "#{Rails.root}/services/importer/spec/fixtures/visualization_export_with_csv_table.carto"

      @data_import = DataImport.create(
        user_id: @user.id,
        data_source: filepath,
        updated_at: Time.now.utc,
        append: false,
        create_visualization: true
      )
      @data_import.values[:data_source] = filepath

      @data_import.run_import!
      @data_import.success.should eq true

      # Fixture file checks
      @data_import.table_name.should eq 'twitter_t3chfest_reduced'
      @visualization = Carto::Visualization.find(@data_import.visualization_id)
      @visualization.name.should eq "exported map"
      @visualization.description.should eq "A map that has been exported"
      @visualization.tags.should include('exported')
      map = @visualization.map
      map.center.should eq "[39.75365697136308, -2.318115234375]"
    end

    it 'imports a visualization export when the table already exists' do
      @existing_table = create_table(name: 'twitter_t3chfest_reduced', user_id: @user.id)
      filepath = "#{Rails.root}/services/importer/spec/fixtures/visualization_export_with_csv_table.carto"

      @data_import = DataImport.create(
        user_id: @user.id,
        data_source: filepath,
        updated_at: Time.now.utc,
        append: false,
        create_visualization: true
      )
      @data_import.values[:data_source] = filepath

      @data_import.run_import!
      @data_import.success.should eq true

      # Fixture file checks
      renamed_table = 'twitter_t3chfest_reduced_1'
      @data_import.table_name.should eq renamed_table
      @visualization = Carto::Visualization.find(@data_import.visualization_id)
      @visualization.data_layers.first.options['table_name'].should eq renamed_table
    end

    it 'imports a visualization export and table is not duplicated if collision strategy is skip' do
      table_name = 'twitter_t3chfest_reduced'
      @existing_table = create_table(name: table_name, user_id: @user.id)
      filepath = "#{Rails.root}/services/importer/spec/fixtures/visualization_export_with_csv_table.carto"

      @data_import = DataImport.create(
        user_id: @user.id,
        data_source: filepath,
        updated_at: Time.now.utc,
        append: false,
        create_visualization: true,
        collision_strategy: skip
      )
      @data_import.values[:data_source] = filepath

      @data_import.run_import!
      @data_import.success.should eq true

      @data_import.tables_created_count.should eq 0
      @data_import.table_names.should be_empty
      @data_import.table_name.should be_nil

      @visualization = Carto::Visualization.find(@data_import.visualization_id)
      @visualization.data_layers.first.options['table_name'].should eq table_name

      @visualization.data_layers.count.should eq 1
      layer = @visualization.data_layers.first
      layer.user_tables.count.should eq 1
      user_table = layer.user_tables.first
      user_table.name.should eq table_name
    end

    it 'imports a visualization export but not existing tables if collision strategy is skip' do
      existing_table_name = 'guess_country'
      not_existing_table_name = 'guess_ip'
      @existing_table = create_table(name: existing_table_name, user_id: @user.id)
      filepath = "#{Rails.root}/services/importer/spec/fixtures/guess_country_ip.carto"

      @data_import = DataImport.create(
        user_id: @user.id,
        data_source: filepath,
        updated_at: Time.now.utc,
        append: false,
        create_visualization: true,
        collision_strategy: skip
      )
      @data_import.values[:data_source] = filepath

      @data_import.run_import!
      @data_import.success.should eq true

      @data_import.tables_created_count.should eq 1
      @data_import.table_names.should eq not_existing_table_name
      @data_import.table_name.should eq not_existing_table_name

      expected_table_names = [existing_table_name, not_existing_table_name]
      @visualization = Carto::Visualization.find(@data_import.visualization_id)
      layer_table_names = @visualization.data_layers.map { |l| l.options['table_name'] }.sort
      layer_table_names.should eq expected_table_names

      @visualization.data_layers.count.should eq 2

      expected_table_names.each do |table_name|
        layer = @visualization.data_layers.find { |l| l.user_tables.first.name == table_name }
        layer.should_not be_nil
        layer.user_tables.count.should eq 1
      end
      @data_import.tables.map(&:destroy)
    end

    it 'imports a visualization export with two data layers' do
      filepath = "#{Rails.root}/services/importer/spec/fixtures/visualization_export_with_two_tables.carto"

      @data_import = DataImport.create(
        user_id: @user.id,
        data_source: filepath,
        updated_at: Time.now.utc,
        append: false,
        create_visualization: true
      )
      @data_import.values[:data_source] = filepath

      @data_import.run_import!
      @data_import.success.should eq true

      # Fixture file checks
      @data_import.table_names.should eq "guess_country twitter_t3chfest_reduced"
      @visualization = Carto::Visualization.find(@data_import.visualization_id)
      @visualization.name.should eq "map with two layers"
      @visualization.layers.count.should eq 3 # basemap + 2 data layers
      layers = @visualization.layers
      layers[0].options['name'].should eq "CartoDB World Eco"
      layer1 = @visualization.layers[1]
      layer1.options['type'].should eq "CartoDB"
      layer1.options['table_name'].should eq "guess_country"
      layer1.user_tables.count.should eq 1
      layer2 = @visualization.layers[2]
      layer2.options['type'].should eq "CartoDB"
      layer2.options['table_name'].should eq "twitter_t3chfest_reduced"
      layer2.user_tables.count.should eq 1
      @data_import.tables.map(&:destroy)
    end

    it 'imports a visualization export without data' do
      filepath = "#{Rails.root}/services/importer/spec/fixtures/visualization_export_without_tables.carto"

      @data_import = DataImport.create(
        user_id: @user.id,
        data_source: filepath,
        updated_at: Time.now.utc,
        append: false,
        create_visualization: true
      )
      @data_import.values[:data_source] = filepath

      @data_import.run_import!
      @data_import.success.should eq true

      # Fixture file checks
      @visualization = Carto::Visualization.find(@data_import.visualization_id)
      @visualization.name.should eq "map with two layers"
      layers = @visualization.layers
      @visualization.layers.count.should eq 3 # basemap + 2 data layers
      layers[0].options['name'].should eq "CartoDB World Eco"
      layer1 = @visualization.layers[1]
      layer1.options['type'].should eq "CartoDB"
      layer1.options['table_name'].should eq "guess_country"
      layer2 = @visualization.layers[2]
      layer2.options['type'].should eq "CartoDB"
      layer2.options['table_name'].should eq "twitter_t3chfest_reduced"
      @data_import.tables.map(&:destroy)
    end

    it 'registers table dependencies for .carto import' do
      filepath = "#{Rails.root}/services/importer/spec/fixtures/visualization_export_with_csv_table.carto"

      @data_import = DataImport.create(
        user_id: @user.id,
        data_source: filepath,
        updated_at: Time.now.utc,
        append: false,
        create_visualization: true
      )
      @data_import.values[:data_source] = filepath

      @data_import.run_import!
      @data_import.success.should eq true

      # Fixture file checks
      @data_import.table_name.should eq 'twitter_t3chfest_reduced'
      @visualization = Carto::Visualization.find(@data_import.visualization_id)
      layer = @visualization.data_layers.first
      layer.user_tables.count.should eq 1
      user_table = layer.user_tables.first
      user_table.name.should eq 'twitter_t3chfest_reduced'

      canonical_layer = user_table.visualization.data_layers.first
      canonical_layer.user_tables.count.should eq 1
    end
  end
end
