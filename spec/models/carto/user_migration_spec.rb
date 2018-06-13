require_relative '../../spec_helper_min'
require_relative '../../../app/models/carto/user_migration_import'
require_relative '../../../app/models/carto/user_migration_export'
require_relative '../../support/factories/tables'
require_relative '../../factories/organizations_contexts'
require 'factories/carto_visualizations'

describe 'UserMigration' do
  include Carto::Factories::Visualizations
  include CartoDB::Factories

  let(:records) do
    [
      { name: 'carto', description: 'awesome' },
      { name: 'user-mover', description: 'insanity' }
    ]
  end

  let(:agg_ds_config) do
    {
      aggregation_tables: {
        'host' => 'localhost',
        'port' => '5432',
        'dbname' => 'test_migration',
        'username' => 'geocoder_api',
        'password' => '',
        'tables' => {
          'admin0' => 'ne_admin0_v3',
          'admin1' => 'global_province_polygons'
        }
      },
      geocoder: {
        'api' => {
          'host' => 'localhost',
          'port' => '5432',
          'dbname' => 'test_migration',
          'user' => 'geocoder_api'
        }
      }
    }
  end

  shared_examples_for 'migrating metadata' do |migrate_metadata|

    before :each do
      @user = FactoryGirl.build(:valid_user).save
      @carto_user = Carto::User.find(@user.id)
      @user_attributes = @carto_user.attributes

      @table1 = create_table(user_id: @user.id)
      records.each { |row| @table1.insert_row!(row) }
      create_database('test_migration', @user) if migrate_metadata
    end

    after :each do
      if migrate_metadata
        @user.destroy_cascade
        drop_database('test_migration', @user)
      else
        @user.destroy
      end
    end

    it "exports and reimports a user #{migrate_metadata ? 'with' : 'without'} metadata" do
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)

      export = Carto::UserMigrationExport.create(
        user: @carto_user,
        export_metadata: migrate_metadata
      )
      export.run_export

      puts export.log.entries if export.state != Carto::UserMigrationExport::STATE_COMPLETE
      expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)

      @carto_user.client_applications.each(&:destroy)
      @table1.table_visualization.layers.each(&:destroy)
      @table1.destroy
      expect { @table1.records }.to raise_error

      migrate_metadata ? @user.destroy : drop_user_database(@user)

      Cartodb.with_config(agg_ds_config) do
        import = Carto::UserMigrationImport.create(
          exported_file: export.exported_file,
          database_host: @user_attributes['database_host'],
          org_import: false,
          json_file: export.json_file,
          import_metadata: migrate_metadata
        )
        import.run_import

        puts import.log.entries if import.state != Carto::UserMigrationImport::STATE_COMPLETE
        expect(import.state).to eq(Carto::UserMigrationImport::STATE_COMPLETE)

        @carto_user = Carto::User.find(@user_attributes['id'])

        if migrate_metadata
          attributes_to_test(@user_attributes).each do |attribute|
            expect(@carto_user.attributes[attribute]).to eq(@user_attributes[attribute])
          end
          @user.in_database(as: :superuser) do |db|
            ds_config = db.fetch("SELECT * from cdb_conf where key = 'geocoder_server_config'").first[:value]
            fdws_config = db.fetch("SELECT * from cdb_conf where key = 'fdws'").first[:value]
            expect(ds_config).to match /dbname=test_migration/
            expect(fdws_config).to match /\"dbname\":\"test_migration\"/
          end
        else
          expect(@carto_user.attributes).to eq(@user_attributes)
        end

        records.each.with_index { |row, index| @table1.record(index + 1).should include(row) }

      end
    end
  end

  it_should_behave_like 'migrating metadata', true
  it_should_behave_like 'migrating metadata', false

  describe 'failing user imports should rollback' do
    before :each do
      @user = create_user_with_visualizations
      @carto_user = Carto::User.find(@user.id)
      @user_attributes = @carto_user.attributes

      @export = Carto::UserMigrationExport.create(
        user: @carto_user,
        export_metadata: true
      )
      @export.run_export
      destroy_user
    end

    after :each do
      @carto_user.destroy
    end

    it 'import failing in import_metadata should rollback' do
      Carto::RedisExportService.any_instance.stubs(:restore_redis_from_hash_export).raises('Some exception')

      imp = import
      imp.run_import.should eq false
      imp.state.should eq 'failure'

      Carto::RedisExportService.any_instance.unstub(:restore_redis_from_hash_export)

      import.run_import.should eq true
    end

    it 'import failing in JobImport#run!' do
      CartoDB::DataMover::ImportJob.any_instance.stubs(:grant_user_role).raises('Some exception')

      imp = import
      imp.run_import.should eq false
      imp.state.should eq 'failure'

      CartoDB::DataMover::ImportJob.any_instance.unstub(:grant_user_role)

      import.run_import.should eq true
    end

    it 'import failing creating user database and roles' do
      CartoDB::DataMover::ImportJob.any_instance.stubs(:import_pgdump).raises('Some exception')

      imp = import
      imp.run_import.should eq false
      imp.state.should eq 'failure'

      CartoDB::DataMover::ImportJob.any_instance.unstub(:import_pgdump)

      import.run_import.should eq true
    end

    it 'import failing importing visualizations' do
      Carto::UserMetadataExportService.any_instance.stubs(:import_search_tweets_from_directory).raises('Some exception')

      imp = import
      imp.run_import.should eq false
      imp.state.should eq 'failure'

      Carto::UserMetadataExportService.any_instance.unstub(:import_search_tweets_from_directory)

      import.run_import.should eq true
    end

    it 'fails importing an already existing user' do
      import.run_import.should eq true
      import.run_import.should eq false
    end

    it 'should continue with rollback if data import rollback fails' do
      CartoDB::DataMover::ImportJob.any_instance.stubs(:grant_user_role).raises('Some exception')
      CartoDB::DataMover::ImportJob.any_instance.stubs(:rollback_user).raises('Some exception')
      import.run_import.should eq false
      CartoDB::DataMover::ImportJob.any_instance.unstub(:grant_user_role)
      CartoDB::DataMover::ImportJob.any_instance.unstub(:rollback_user)
      import.run_import.should eq true
    end

    it 'should not remove user if already exists while importing' do
      import.run_import.should eq true
      import.run_import.should eq false
      Carto::User.exists?(@user.id).should eq true
    end

    it 'import record should exist if import_data fails and rollbacks' do
      Carto::UserMigrationImport.any_instance.stubs(:do_import_data).raises('Some exception')

      imp = import
      imp.run_import.should eq false
      imp.state.should eq 'failure'

      Carto::UserMigrationImport.where(id: imp.id).should_not be_empty
      Carto::User.where(username: @carto_user.username).should be_empty

      Carto::UserMigrationImport.any_instance.unstub(:do_import_data)
    end

    it 'import failing importing visualizations does not remove assets' do
      Carto::UserMetadataExportService.any_instance.stubs(:import_search_tweets_from_directory).raises('Some exception')
      Asset.any_instance.stubs(:use_s3?).returns(false)
      asset = Asset.create(asset_file: Rails.root + 'spec/support/data/cartofante_blue.png', user: @user)
      local_url = CGI.unescape(asset.public_url.gsub(/(http:)?\/\/#{CartoDB.account_host}/, ''))
      imp = import

      imp.run_import.should eq false
      imp.state.should eq 'failure'
      File.exists?((asset.public_uploaded_assets_path + local_url).gsub('/uploads/uploads/', '/uploads/')).should eq true
    end
  end

  describe 'failing organization organizations should rollback' do
    include_context 'organization with users helper'
    before :all do
      owner = @carto_organization.owner
      filepath = "#{Rails.root}/services/importer/spec/fixtures/visualization_export_with_two_tables.carto"
      data_import = DataImport.create(
        user_id: owner.id,
        data_source: filepath,
        updated_at: Time.now.utc,
        append: false,
        create_visualization: true
      )
      data_import.values[:data_source] = filepath

      data_import.run_import!
      data_import.success.should eq true

      @export = Carto::UserMigrationExport.create(
        organization: @carto_organization,
        export_metadata: true
      )
      @export.run_export
      @organization.destroy_cascade
    end

    after :each do
      begin
        @organization.reload
        @organization.destroy_cascade
      rescue
      end
    end

    it 'import failing in import_metadata should rollback' do
      Carto::RedisExportService.any_instance.stubs(:restore_redis_from_hash_export).raises('Some exception')

      imp = org_import
      imp.run_import.should eq false
      imp.state.should eq 'failure'

      Carto::RedisExportService.any_instance.unstub(:restore_redis_from_hash_export)

      org_import.run_import.should eq true
    end

    it 'import failing in JobImport#run!' do
      CartoDB::DataMover::ImportJob.any_instance.stubs(:grant_user_role).raises('Some exception')

      imp = org_import
      imp.run_import.should eq false
      imp.state.should eq 'failure'

      CartoDB::DataMover::ImportJob.any_instance.unstub(:grant_user_role)

      org_import.run_import.should eq true
    end

    it 'import failing creating user database and roles' do
      CartoDB::DataMover::ImportJob.any_instance.stubs(:import_pgdump).raises('Some exception')

      imp = org_import
      imp.run_import.should eq false
      imp.state.should eq 'failure'

      CartoDB::DataMover::ImportJob.any_instance.unstub(:import_pgdump)

      org_import.run_import.should eq true
    end

    it 'import failing importing visualizations' do
      Carto::UserMetadataExportService.any_instance.stubs(:import_search_tweets_from_directory).raises('Some exception')

      imp = org_import
      imp.run_import.should eq false
      imp.state.should eq 'failure'

      Carto::UserMetadataExportService.any_instance.unstub(:import_search_tweets_from_directory)

      org_import.run_import.should eq true
    end

    it 'import failing import visualizations with metadata_only option' do
      Carto::UserMetadataExportService.any_instance.stubs(:import_search_tweets_from_directory).raises('Some exception')

      imp = org_import
      imp.import_data = false
      imp.save!
      imp.run_import.should eq false
      imp.state.should eq 'failure'
      imp.reload
    end

    it 'should fail if importing an already existing organization with metadata' do
      org_import.run_import.should eq true
      imp = org_import
      imp.run_import.should eq false
      imp.state.should eq 'failure'
    end

    it 'import record should exist if import_data fails and rollbacks' do
      Carto::UserMigrationImport.any_instance.stubs(:do_import_data).raises('Some exception')

      imp = org_import
      imp.run_import.should eq false
      imp.state.should eq 'failure'

      Carto::UserMigrationImport.where(id: imp.id).should_not be_empty
      Carto::Organization.where(id: @carto_organization.id).should be_empty

      Carto::UserMigrationImport.any_instance.unstub(:do_import_data)
    end

    it 'import failing importing visualizations does not remove assets' do
      Carto::StorageOptions::S3.stubs(:enabled?).returns(false)
      Carto::UserMetadataExportService.any_instance.stubs(:import_search_tweets_from_directory).raises('Some exception')
      asset = Carto::Asset.for_organization(
        organization: @carto_organization,
        resource: File.open(Rails.root + 'spec/support/data/cartofante_blue.png')
      )
      imp = org_import

      imp.run_import.should eq false
      imp.state.should eq 'failure'
      File.exists?(asset.storage_info[:identifier]).should eq true
    end
  end

  it 'exports and imports a user with a data import with two tables' do
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)

    user = create_user_with_visualizations

    carto_user = Carto::User.find(user.id)
    user_attributes = carto_user.attributes

    source_visualizations = carto_user.visualizations.map(&:name).sort

    export = Carto::UserMigrationExport.create(
      user: carto_user,
      export_metadata: true
    )
    export.run_export

    puts export.log.entries if export.state != Carto::UserMigrationExport::STATE_COMPLETE
    expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)

    carto_user.client_applications.each(&:destroy)
    user.destroy

    import = Carto::UserMigrationImport.create(
      exported_file: export.exported_file,
      database_host: user_attributes['database_host'],
      org_import: false,
      json_file: export.json_file,
      import_metadata: true,
      dry: false
    )
    import.stubs(:assert_organization_does_not_exist)
    import.stubs(:assert_user_does_not_exist)
    import.run_import

    puts import.log.entries if import.state != Carto::UserMigrationImport::STATE_COMPLETE
    expect(import.state).to eq(Carto::UserMigrationImport::STATE_COMPLETE)

    carto_user = Carto::User.find(user_attributes['id'])

    attributes_to_test(user_attributes).each do |attribute|
      expect(carto_user.attributes[attribute]).to eq(user_attributes[attribute])
    end
    expect(carto_user.visualizations.map(&:name).sort).to eq(source_visualizations)

    user.destroy_cascade
  end

  it 'does not export duplicated vizs' do
    user = create_user_with_visualizations
    carto_user = Carto::User.find(user.id)
    user_attributes = carto_user.attributes
    source_vis = carto_user.visualizations.where(type: Carto::Visualization::TYPE_CANONICAL).first
    carto_user.visualizations.count.should eq 3
    map, _, table_visualization, visualization = create_full_visualization(carto_user)
    table_visualization.update_column(:name, source_vis.name)
    table_visualization.update_column(:map_id, source_vis.map.id)
    table_visualization.update_column(:updated_at, source_vis.updated_at - 1.minute)
    map.destroy
    visualization.destroy

    carto_user.visualizations.count.should eq 4

    export = Carto::UserMigrationExport.create(
      user: carto_user,
      export_metadata: true
    )
    export.run_export

    puts export.log.entries if export.state != Carto::UserMigrationExport::STATE_COMPLETE
    expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)

    user.destroy_cascade

    import = Carto::UserMigrationImport.create(
      exported_file: export.exported_file,
      database_host: user_attributes['database_host'],
      org_import: false,
      json_file: export.json_file,
      import_metadata: true,
      dry: false
    )
    import.stubs(:assert_organization_does_not_exist)
    import.stubs(:assert_user_does_not_exist)
    import.run_import

    puts import.log.entries if import.state != Carto::UserMigrationImport::STATE_COMPLETE
    expect(export.state).to eq(Carto::UserMigrationImport::STATE_COMPLETE)
    imported_user = Carto::User.find(user_attributes['id'])
    imported_user.visualizations.count.should eq 3
    expect { imported_user.visualizations.find(table_visualization.id) }.to raise_error(ActiveRecord::RecordNotFound)

    user.destroy_cascade
  end

  it 'exporting and then importing to the same DB host fails but DB is not deleted (#c1945)' do
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)

    user = create_user_with_visualizations

    carto_user = Carto::User.find(user.id)
    user_attributes = carto_user.attributes

    export = Carto::UserMigrationExport.create(user: carto_user, export_metadata: false)
    export.run_export

    expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)

    import = Carto::UserMigrationImport.create(
      exported_file: export.exported_file,
      database_host: user_attributes['database_host'],
      org_import: false,
      json_file: export.json_file,
      import_metadata: false,
      dry: false
    )
    import.run_import

    expect(import.state).to eq(Carto::UserMigrationImport::STATE_FAILURE)
    expect(import.log.entries).to include('DB already exists at DB host')

    # DB exists, otherwise this would fail
    user.in_database.run("select 1;")

    user.destroy_cascade
  end

  it 'exports users with datasets without a physical table if metadata export is requested (see #13721)' do
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)

    user = FactoryGirl.build(:valid_user).save
    carto_user = Carto::User.find(user.id)

    @map, @table, @table_visualization, @visualization = create_full_visualization(carto_user)

    carto_user.tables.exists?(name: @table.name).should be
    user.in_database.execute("DROP TABLE #{@table.name}")
    # The table is still registered after the deletion
    carto_user.reload

    carto_user.tables.exists?(name: @table.name).should be

    export = Carto::UserMigrationExport.create(user: carto_user, export_metadata: true)
    export.run_export

    export.log.entries.should_not include("Cannot export if tables aren't synched with db. Please run ghost tables.")
    expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)
    export.destroy

    user.destroy
  end

  it 'does export users with a canonical viz without user table if metadata export is requested (see #12588)' do
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)

    user = FactoryGirl.build(:valid_user).save
    carto_user = Carto::User.find(user.id)

    @map, @table, @table_visualization, @visualization = create_full_visualization(carto_user)

    @table.delete
    user.in_database.execute("DROP TABLE #{@table.name}")
    # The canonical visualization is still registered after the deletion
    @table_visualization.reload
    @table_visualization.should be

    export = Carto::UserMigrationExport.create(user: carto_user, export_metadata: true)
    export.run_export

    expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)

    user.destroy
  end

  it 'exports and imports a user with raster overviews because exporting skips them' do
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
    user = FactoryGirl.build(:valid_user).save
    carto_user = Carto::User.find(user.id)
    user_attributes = carto_user.attributes
    user.in_database.execute('CREATE TABLE i_hate_raster(rast raster)')
    user.in_database.execute('INSERT INTO i_hate_raster VALUES(ST_MakeEmptyRaster(100, 100, 0, 0, 100, 100, 0, 0, 2274))')
    user.in_database.execute("UPDATE i_hate_raster SET rast = ST_AddBand(rast, 1, '32BF'::text, 0)")
    user.in_database.execute("UPDATE i_hate_raster SET rast = ST_AddBand(rast, 1, '32BF'::text, 0)")
    user.in_database.execute("SELECT AddRasterConstraints('i_hate_raster', 'rast')")
    user.in_database.execute("SELECT ST_CreateOverview('i_hate_raster'::regclass, 'rast', 2)")
    user.in_database.execute('DROP TABLE i_hate_raster')
    export = Carto::UserMigrationExport.create(user: carto_user, export_metadata: true)
    export.run_export
    user.destroy

    import = Carto::UserMigrationImport.create(
      exported_file: export.exported_file,
      database_host: user_attributes['database_host'],
      org_import: false,
      json_file: export.json_file,
      import_metadata: true,
      dry: false
    )
    import.run_import

    expect(import.state).to eq(Carto::UserMigrationImport::STATE_COMPLETE)
  end

  describe 'legacy functions' do
    before :each do
      @legacy_functions = CartoDB::DataMover::LegacyFunctions::LEGACY_FUNCTIONS
    end

    after :each do
      CartoDB::DataMover::LegacyFunctions::LEGACY_FUNCTIONS = @legacy_functions
    end

    it 'loads legacy functions' do
      CartoDB::DataMover::LegacyFunctions::LEGACY_FUNCTIONS.count.should eq 2493
    end

    it 'matches functions with attributes qualified with namespace' do
      class DummyTester
        include CartoDB::DataMover::LegacyFunctions
      end
      line = '1880; 1255 5950507 FUNCTION asbinary("geometry", "pg_catalog"."text") postgres'
      DummyTester.new.remove_line?(line).should be true
    end

    it 'skips importing legacy functions using fixture' do
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
      CartoDB::DataMover::LegacyFunctions::LEGACY_FUNCTIONS = ["FUNCTION increment(integer)", "FUNCTION sumita(integer,integer)"].freeze
      user = FactoryGirl.build(:valid_user).save
      carto_user = Carto::User.find(user.id)
      user_attributes = carto_user.attributes
      user.in_database.execute('CREATE OR REPLACE FUNCTION increment(i INT) RETURNS INT AS $$
      BEGIN
        RETURN i + 1;
      END;
      $$ LANGUAGE plpgsql;')

      user.in_database.execute('CREATE OR REPLACE FUNCTION sumita(i1 INT, i2 INT) RETURNS INT AS $$
      BEGIN
        RETURN i1 + i2;
      END;
      $$ LANGUAGE plpgsql;')

      export = Carto::UserMigrationExport.create(user: carto_user, export_metadata: true)
      export.run_export
      user.destroy

      import = Carto::UserMigrationImport.create(
        exported_file: export.exported_file,
        database_host: user_attributes['database_host'],
        org_import: false,
        json_file: export.json_file,
        import_metadata: true,
        dry: false
      )
      import.run_import

      user.in_database.execute("SELECT prosrc FROM pg_proc WHERE proname = 'increment'").should eq 0
      user.in_database.execute("SELECT prosrc FROM pg_proc WHERE proname = 'sumita'").should eq 0
      user.destroy
    end

    it 'imports functions and tables that are not on the legacy list using fixture' do
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
      user = FactoryGirl.build(:valid_user).save
      carto_user = Carto::User.find(user.id)
      user_attributes = carto_user.attributes
      user.in_database.execute('CREATE OR REPLACE FUNCTION st_text(b boolean) RETURNS INT AS $$
      BEGIN
        RETURN 1;
      END;
      $$ LANGUAGE plpgsql;')

      user.in_database.execute('CREATE OR REPLACE FUNCTION increment(i INT) RETURNS INT AS $$
      BEGIN
        RETURN i + 1;
      END;
      $$ LANGUAGE plpgsql;')

      user.in_database.execute('CREATE TABLE layer_wadus(number INT)')
      user.in_database.execute('INSERT INTO layer_wadus VALUES (\'1\')')

      export = Carto::UserMigrationExport.create(user: carto_user, export_metadata: true)
      export.run_export
      user.destroy

      import = Carto::UserMigrationImport.create(
        exported_file: export.exported_file,
        database_host: user_attributes['database_host'],
        org_import: false,
        json_file: export.json_file,
        import_metadata: true,
        dry: false
      )
      import.run_import

      user.in_database.execute("SELECT prosrc FROM pg_proc WHERE proname = 'st_text'").should eq 0
      user.in_database.execute("SELECT prosrc FROM pg_proc WHERE proname = 'increment'").should eq 1
      user.in_database.execute('select count(*) from layer_wadus').should eq 1
      user.destroy
    end

    describe 'with organization' do
      include_context 'organization with users helper'

      let(:org_attributes) { @carto_organization.attributes }
      let(:owner_attributes) { @carto_org_user_owner.attributes }

      it 'should not import acl over deprecated functions' do
        user1 = @carto_organization.users.first
        user2 = @carto_organization.users.last
        user1.in_database.execute('CREATE OR REPLACE FUNCTION st_text(b boolean) RETURNS INT AS $$
        BEGIN
          RETURN 1;
        END;
        $$ LANGUAGE plpgsql;')

        user1.in_database.execute("GRANT ALL ON FUNCTION st_text TO \"#{user2.service.database_public_username}\"")

        export = Carto::UserMigrationExport.create(organization: @carto_organization, export_metadata: true)
        export.run_export
        @organization.destroy_cascade

        import = Carto::UserMigrationImport.create(
          exported_file: export.exported_file,
          database_host: owner_attributes['database_host'],
          org_import: true,
          json_file: export.json_file,
          import_metadata: true,
          import_data: true,
          dry: false
        )
        import.run_import

        import.state.should eq 'complete'
        Organization[@organization.id].users.first.in_database.execute("SELECT prosrc FROM pg_proc WHERE proname = 'st_text'").should eq 0

      end
    end
  end

  describe 'with organization' do
    include_context 'organization with users helper'

    let(:org_attributes) { @carto_organization.attributes }
    let(:owner_attributes) { @carto_org_user_owner.attributes }

    shared_examples_for 'migrating metadata' do |migrate_metadata|
      before(:each) do
        @table1 = create_table(user_id: @carto_org_user_1.id)
        records.each { |row| @table1.insert_row!(row) }
        create_database('test_migration', @organization.owner) if migrate_metadata
        @owner_api_key = Carto::ApiKey.create_regular_key!(user: @carto_org_user_owner, name: unique_name('api_key'),
                                                           grants: [{ type: "apis", apis: ["maps", "sql"] }])
        @user1_api_key = Carto::ApiKey.create_regular_key!(user: @carto_org_user_1, name: unique_name('api_key'),
                                                           grants: [{ type: "apis", apis: ["maps", "sql"] }])
        @carto_organization.reload
      end

      after(:each) do
        drop_database('test_migration', @organization.owner) if migrate_metadata
        @owner_api_key.destroy
        @user1_api_key.destroy
      end

      it "exports and reimports an organization #{migrate_metadata ? 'with' : 'without'} metadata" do
        export = Carto::UserMigrationExport.create(organization: @carto_organization, export_metadata: migrate_metadata)
        export.run_export

        export.state.should eq Carto::UserMigrationExport::STATE_COMPLETE

        migrate_metadata ? @organization.destroy_cascade : drop_user_database(@organization.owner)

        Cartodb.with_config(agg_ds_config) do
          import = Carto::UserMigrationImport.create(
            exported_file: export.exported_file,
            database_host: owner_attributes['database_host'],
            org_import: true,
            json_file: export.json_file,
            import_metadata: migrate_metadata
          )
          import.stubs(:assert_organization_does_not_exist)
          import.stubs(:assert_user_does_not_exist)
          import.run_import

          puts import.log.entries if import.state != Carto::UserMigrationImport::STATE_COMPLETE
          import.state.should eq Carto::UserMigrationImport::STATE_COMPLETE

          new_organization = Carto::Organization.find(org_attributes['id'])
          attributes_to_test(new_organization.attributes).should eq attributes_to_test(org_attributes)
          new_organization.users.count.should eq 3
          attributes_to_test(new_organization.owner.attributes).should eq attributes_to_test(owner_attributes)
          records.each.with_index { |row, index| @table1.record(index + 1).should include(row) }
          if migrate_metadata
            new_organization.owner.in_database(as: :superuser) do |db|
              ds_config = db.exec_query("SELECT * from cdb_conf where key = 'geocoder_server_config'").first['value']
              fdws_config = db.exec_query("SELECT * from cdb_conf where key = 'fdws'").first['value']
              expect(ds_config).to match /dbname=test_migration/
              expect(fdws_config).to match /\"dbname\":\"test_migration\"/
            end
          end
        end
      end
    end

    it_should_behave_like 'migrating metadata', true
    it_should_behave_like 'migrating metadata', false

    it 'exports orgs with datasets without physical table if metadata export is requested (see #13721)' do
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_org_user_1)

      @carto_org_user_1.tables.exists?(name: @table.name).should be
      @org_user_1.in_database.execute("DROP TABLE #{@table.name}")
      # The table is still registered after the deletion
      @carto_org_user_1.reload
      @carto_org_user_1.tables.exists?(name: @table.name).should be

      export = Carto::UserMigrationExport.create(organization: @carto_organization, export_metadata: true)
      export.run_export
      export.log.entries.should_not include("Cannot export if tables aren't synched with db. Please run ghost tables.")
      expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)
      export.destroy
    end
  end

  it '#run_import does not modify database_host with dry' do
    user = create_user_with_visualizations
    carto_user = Carto::User.find(user.id)
    database_host = carto_user.database_host

    export = Carto::UserMigrationExport.create(
      user: carto_user,
      export_metadata: true
    )

    export.run_export

    drop_user_database(user)

    # Let's fake the column to check that dry doesn't fix it
    carto_user.update_column(:database_host, 'wadus')

    import = Carto::UserMigrationImport.create(
      exported_file: export.exported_file,
      database_host: database_host,
      org_import: false,
      json_file: export.json_file,
      import_metadata: false,
      dry: true
    )

    import.run_import
    import.state.should eq 'complete'

    carto_user2 = Carto::User.find(user.id)
    carto_user2.attributes.should eq carto_user.attributes
  end

  describe 'api keys import and exports' do
    before :each do
      @user = FactoryGirl.build(:valid_user)
      @user.save
      @carto_user = Carto::User.find(@user.id)
      @master_api_key = @carto_user.api_keys.create_master_key!
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user)
      @regular_api_key = Carto::ApiKey.create_regular_key!(user: @carto_user,
                                                           name: 'Some ApiKey',
                                                           grants: [
                                                             {
                                                               type: "apis",
                                                               apis: ["maps", "sql"]
                                                             },
                                                             {
                                                               type: 'database',
                                                               tables: [
                                                                 {
                                                                   schema: @carto_user.database_schema,
                                                                   name: @table.name,
                                                                   permissions: ['select']
                                                                 }
                                                               ]
                                                             }
                                                           ])
    end

    after :each do
      @user.destroy
    end

    it 'api keys are in redis and db roles are created' do
      user_attributes = @carto_user.attributes
      export = Carto::UserMigrationExport.create(
        user: @carto_user,
        export_metadata: true
      )
      export.run_export

      puts export.log.entries if export.state != Carto::UserMigrationExport::STATE_COMPLETE
      expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)

      username = @user.username
      $users_metadata.hmget("api_keys:#{username}:#{@master_api_key.token}", 'user')[0].should eq username
      $users_metadata.hmget("api_keys:#{username}:#{@regular_api_key.token}", 'user')[0].should eq username

      @carto_user.client_applications.each(&:destroy)
      @master_api_key.destroy
      @table.destroy
      @map.destroy
      @table_visualization.destroy
      @visualization.destroy
      @carto_user.destroy
      @regular_api_key.destroy
      drop_user_database(@user)

      $users_metadata.hmget("api_keys:#{username}:#{@master_api_key.token}", 'user')[0].should be nil
      $users_metadata.hmget("api_keys:#{username}:#{@regular_api_key.token}", 'user')[0].should be nil

      import = Carto::UserMigrationImport.create(
        exported_file: export.exported_file,
        database_host: user_attributes['database_host'],
        org_import: false,
        json_file: export.json_file,
        import_metadata: true,
        dry: false
      )

      import.stubs(:assert_organization_does_not_exist)
      import.stubs(:assert_user_does_not_exist)
      import.run_import

      $users_metadata.hmget("api_keys:#{username}:#{@master_api_key.token}", 'user')[0].should eq username
      $users_metadata.hmget("api_keys:#{username}:#{@regular_api_key.token}", 'user')[0].should eq username

      puts import.log.entries if import.state != Carto::UserMigrationImport::STATE_COMPLETE
      expect(import.state).to eq(Carto::UserMigrationImport::STATE_COMPLETE)

      user = Carto::User.find(user_attributes['id'])
      user.should be
      user.api_keys.each(&:table_permissions_from_db) # to make sure DB can be queried without exceptions
      user.api_keys.select { |a| a.type == 'master' }.first.table_permissions_from_db.count.should be > 0
    end
  end

  include CartoDB::DataMover::Utils
  describe 'database version' do
    before(:each) do
      @conn_mock = Object.new
      @conn_mock.stubs(:query).returns(['version' => 'PostgreSQL 9.5.2 on x86_64-pc-linux-gnu...'])
    end

    it 'should get proper database version for pg_* binaries' do
      get_database_version_for_binaries(@conn_mock).should eq '9.5'

      @conn_mock.stubs(:query).returns(['version' => 'PostgreSQL 10.1 on x86_64-pc-linux-gnu...'])
      get_database_version_for_binaries(@conn_mock).should eq '10'
    end

    it 'should get proper binary paths version for pg_dump and pg_restore' do
      get_pg_dump_bin_path(@conn_mock).should include 'pg_dump'
      get_pg_restore_bin_path(@conn_mock).should include 'pg_restore'
    end

    it 'raises exception if cannot get dump database version' do
      expect { get_dump_database_version(@conn_mock, '123') }.to raise_error
    end

    it 'retrieves dump database version from stubbed dump file name' do
      @conn_mock.stubs(:query).returns(['version' => 'PostgreSQL 10.1 on x86_64-pc-linux-gnu...'])
      status_mock = Object.new
      status_mock.stubs(:success?).returns(true)
      Open3.stubs(:capture3).returns([';     Dumped by pg_dump version: 9.5.2', '', status_mock])
      get_dump_database_version(@conn_mock, '/tmp/test.dump').should eq '9.5'
    end
  end

  describe 'export_data being false' do
    it 'exports and imports user with viz' do
      user = create_user_with_visualizations

      carto_user = Carto::User.find(user.id)
      user_attributes = carto_user.attributes

      source_visualizations = carto_user.visualizations.map(&:name).sort

      export = Carto::UserMigrationExport.create(
        user: carto_user,
        export_metadata: true,
        export_data: false
      )
      export.run_export

      puts export.log.entries if export.state != Carto::UserMigrationExport::STATE_COMPLETE
      expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)

      remove_user(carto_user)

      import = Carto::UserMigrationImport.create(
        exported_file: export.exported_file,
        database_host: user_attributes['database_host'],
        org_import: false,
        json_file: export.json_file,
        import_metadata: true,
        import_data: false,
        dry: false
      )

      import.run_import

      puts import.log.entries if import.state != Carto::UserMigrationImport::STATE_COMPLETE
      expect(import.state).to eq(Carto::UserMigrationImport::STATE_COMPLETE)

      carto_user = Carto::User.find(user_attributes['id'])

      attributes_to_test(user_attributes).each do |attribute|
        expect(carto_user.attributes[attribute]).to eq(user_attributes[attribute])
      end
      expect(carto_user.visualizations.map(&:name).sort).to eq(source_visualizations)

      Carto::GhostTablesManager.new(user.id).user_tables_synced_with_db?.should eq true

      user.destroy_cascade
    end

    it 'export and imports keeping import when import visualizations fails' do
      user = create_user_with_visualizations

      carto_user = Carto::User.find(user.id)
      user_attributes = carto_user.attributes

      export = Carto::UserMigrationExport.create(
        user: carto_user,
        export_metadata: true,
        export_data: false
      )
      export.run_export

      import = Carto::UserMigrationImport.create!(
        exported_file: export.exported_file,
        database_host: user_attributes['database_host'],
        org_import: false,
        json_file: export.json_file,
        import_metadata: true,
        import_data: false,
        dry: false
      )
      Carto::UserMetadataExportService.any_instance.stubs(:import_metadata_from_directory).raises('Something went bad')

      import.run_import

      import.reload.persisted?.should eq true

      user.destroy_cascade
    end

    it 'does not remove database when visuaization import fails' do
      user = create_user_with_visualizations

      carto_user = Carto::User.find(user.id)
      user_attributes = carto_user.attributes

      export = Carto::UserMigrationExport.create(
        user: carto_user,
        export_metadata: true,
        export_data: false
      )
      export.run_export

      puts export.log.entries if export.state != Carto::UserMigrationExport::STATE_COMPLETE
      expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)

      remove_user(carto_user)

      import = Carto::UserMigrationImport.create(
        exported_file: export.exported_file,
        database_host: user_attributes['database_host'],
        org_import: false,
        json_file: export.json_file,
        import_metadata: true,
        import_data: false,
        dry: false
      )

      Carto::UserMigrationImport.any_instance.stubs(:import_visualizations).raises('wadus')

      import.run_import

      config = CartoDB::DataMover::Config.config
      PG.connect(host: user_attributes['database_host'],
                 user: config[:dbuser],
                 dbname: user_attributes['database_name'],
                 port: config[:dbport],
                 connect_timeout: config[:connect_timeout])
    end

    describe 'with orgs' do
      include_context 'organization with users helper'
      it 'exports and imports org with users with viz' do
        CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
        export = Carto::UserMigrationExport.create(
          organization: @carto_organization,
          export_metadata: true,
          export_data: false
        )
        export.run_export

        puts export.log.entries if export.state != Carto::UserMigrationExport::STATE_COMPLETE
        expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)

        database_host = @carto_organization.owner.database_host

        @carto_organization.users.each { |u| remove_user(u) }
        @carto_organization.delete

        import = Carto::UserMigrationImport.create(
          exported_file: export.exported_file,
          database_host: database_host,
          org_import: true,
          json_file: export.json_file,
          import_metadata: true,
          import_data: false,
          dry: false
        )

        import.run_import

        puts import.log.entries if import.state != Carto::UserMigrationImport::STATE_COMPLETE
        expect(import.state).to eq(Carto::UserMigrationImport::STATE_COMPLETE)

        @carto_organization.users.each do |u|
          Carto::GhostTablesManager.new(u.id).user_tables_synced_with_db?.should eq true
        end
      end

      it 'does not drop database if visualizations import fails' do
        CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
        export = Carto::UserMigrationExport.create(
          organization: @carto_organization,
          export_metadata: true,
          export_data: false
        )
        export.run_export

        puts export.log.entries if export.state != Carto::UserMigrationExport::STATE_COMPLETE
        expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)

        database_host = @carto_organization.owner.database_host

        db_host = @carto_organization.owner.database_host
        db_name = @carto_organization.database_name

        @carto_organization.users.each { |u| remove_user(u) }
        @carto_organization.delete

        import = Carto::UserMigrationImport.create(
          exported_file: export.exported_file,
          database_host: database_host,
          org_import: true,
          json_file: export.json_file,
          import_metadata: true,
          import_data: false,
          dry: false
        )

        Carto::UserMigrationImport.any_instance.stubs(:import_visualizations).raises('wadus')

        import.run_import

        config = CartoDB::DataMover::Config.config
        PG.connect(host: db_host,
                   user: config[:dbuser],
                   dbname: db_name,
                   port: config[:dbport],
                   connect_timeout: config[:connect_timeout])
      end
    end

    def remove_user(carto_user)
      Carto::Visualization.where(user_id: carto_user.id).each do |v|
        v.overlays.each(&:delete)
        v.delete
      end
      gum = CartoDB::GeocoderUsageMetrics.new(carto_user.username)
      $users_metadata.DEL(gum.send(:user_key_prefix, :geocoder_here, :success_responses, Time.now))
      carto_user.delete
    end
  end

  def drop_user_database(user)
    conn = user.in_database(as: :cluster_admin)
    user.db_service.drop_database_and_user(conn)
    user.db_service.drop_user(conn)
  end

  def create_database(name, user)
    conn = user.in_database(as: :cluster_admin)
    sql = "CREATE DATABASE \"#{name}\"
    WITH TEMPLATE = template_postgis
    ENCODING = 'UTF8'
    CONNECTION LIMIT=-1"
    conn.run(sql) rescue conn.exec_query(sql)
  end

  def drop_database(name, user)
    conn = user.in_database(as: :cluster_admin)
    sql = "DROP DATABASE \"#{name}\""
    conn.run(sql) rescue conn.exec_query(sql)
  end

  def attributes_to_test(user_attributes)
    user_attributes.keys - %w(created_at updated_at period_end_date)
  end

  private

  def create_user_with_visualizations
    user = FactoryGirl.build(:valid_user).save

    filepath = "#{Rails.root}/services/importer/spec/fixtures/visualization_export_with_two_tables.carto"
    data_import = DataImport.create(
      user_id: user.id,
      data_source: filepath,
      updated_at: Time.now.utc,
      append: false,
      create_visualization: true
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!
    data_import.success.should eq true
    user
  end

  def org_import
    imp = Carto::UserMigrationImport.create(
      exported_file: @export.exported_file,
      database_host: @carto_organization.owner.attributes['database_host'],
      org_import: true,
      json_file: @export.json_file,
      import_metadata: true,
      dry: false
    )

    imp.stubs(:assert_organization_does_not_exist)
    imp.stubs(:assert_user_does_not_exist)
    imp
  end

  def import
    imp = Carto::UserMigrationImport.create(
      exported_file: @export.exported_file,
      database_host: @user_attributes['database_host'],
      org_import: false,
      json_file: @export.json_file,
      import_metadata: true,
      dry: false
    )
    imp.stubs(:assert_organization_does_not_exist)
    imp.stubs(:assert_user_does_not_exist)
    imp
  end

  def destroy_user
    @carto_user.client_applications.each(&:destroy)
    @user.destroy
  end
end
