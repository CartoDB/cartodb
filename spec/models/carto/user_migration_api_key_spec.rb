require 'spec_helper_unit'
require './services/user-mover/legacy_functions'
require_relative '../../support/factories/tables'
require_relative '../../factories/organizations_contexts'
require_relative './helpers/user_migration_helper'
require 'helpers/database_connection_helper'
require 'factories/carto_visualizations'

describe 'UserMigration' do
  include Carto::Factories::Visualizations
  include CartoDB::Factories
  include DatabaseConnectionHelper
  include UserMigrationHelper

  let(:organization_owner) { create(:carto_user) }
  let(:organization) { create(:organization, :with_owner, owner: organization_owner) }
  let(:organization_user) do
    create(:carto_user, organization_id: organization.id)
  end

  it 'exports and imports a user with raster overviews because exporting skips them' do
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
    user = build(:valid_user).save
    next unless user.in_database.table_exists?('raster_overviews')
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
    before do
      class DummyTester
        include CartoDB::DataMover::LegacyFunctions
      end
      @dummy_tester = DummyTester.new
    end

    it 'loads legacy functions' do
      CartoDB::DataMover::LegacyFunctions::LEGACY_FUNCTIONS.count.should eq 2511
    end

    it 'matches functions with attributes qualified with namespace' do
      line = '1880; 1255 5950507 FUNCTION asbinary("geometry", "pg_catalog"."text") postgres'
      @dummy_tester.remove_line?(line).should be true
      line2 = '8506; 2753 18284 OPERATOR FAMILY public btree_geography_ops postgres'
      @dummy_tester.remove_line?(line2).should be true
      line3 = '18305; 0 0 ACL public st_wkbtosql("bytea") postgres'
      @dummy_tester.remove_line?(line3).should be true
      line4 = '18333; 0 0 ACL public st_countagg("raster", integer, boolean, double precision) postgres'
      @dummy_tester.remove_line?(line4).should be false
      line5 = '541; 1259 735510 FOREIGN TABLE aggregation agg_admin1 postgres'
      @dummy_tester.remove_line?(line5).should be false
      line6 = '242; 1255 148122 FUNCTION org00000001-admin st_text(boolean)'
      @dummy_tester.remove_line?(line6).should be true
      line7 = '5003; 0 0 ACL org000001-admin FUNCTION "st_text"(boolean)'
      @dummy_tester.remove_line?(line7).should be true
    end

    it 'matches functions with attributes qualified with namespace and name' do
      line = '5785; 0 0 ACL public FUNCTION "st_asgeojson"'\
        '("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer) postgres'

      expect(@dummy_tester.remove_line?(line)).to be_true
    end

    # TODO: fix. Mocha does not provide an API to stub constants
    xit 'skips importing legacy functions using fixture' do
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
      CartoDB::DataMover::LegacyFunctions::LEGACY_FUNCTIONS = ["FUNCTION increment(integer)", "FUNCTION sumita(integer,integer)"].freeze
      user = build(:valid_user).save
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
      user = build(:valid_user).save
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
      let(:org_attributes) { organization.attributes }
      let(:owner_attributes) { organization.owner.attributes }

      # TODO: fix. Mocha does not provide an API to stub constants
      xit 'should not import acl over deprecated functions' do
        user1 = organization.users.first
        user2 = organization.users.last
        user1.in_database.execute('CREATE OR REPLACE FUNCTION st_text(boolean) RETURNS INT AS $$
        BEGIN
          RETURN 1;
        END;
        $$ LANGUAGE plpgsql;')

        user1.in_database.execute("GRANT ALL ON FUNCTION st_text TO \"#{user2.service.database_public_username}\"")

        export = Carto::UserMigrationExport.create(organization: organization, export_metadata: true)
        export.run_export
        organization.destroy_cascade

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
        organization_user = organization.users.first
        deprecated_acls_count = organization_user.in_database.execute("SELECT COUNT(*) FROM pg_proc WHERE proname = 'st_text'")

        expect(deprecated_acls_count.first['count'].to_i).to be_zero
      end
    end
  end

  describe 'with organization' do
    records =
    [
      { name: 'carto', description: 'awesome' },
      { name: 'user-mover', description: 'insanity' }
    ]

    agg_ds_config =
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
    let(:org_attributes) { organization.attributes }
    let(:owner_attributes) { organization.owner.attributes }

    shared_examples_for 'migrating metadata' do |migrate_metadata|
      before do
        @table1 = create_table(user_id: organization_user.id)
        records.each { |row| @table1.insert_row!(row) }
        create_database('test_migration', organization.owner) if migrate_metadata
        @owner_api_key = Carto::ApiKey.create_regular_key!(user: organization.owner, name: unique_name('api_key'),
                                                           grants: [{ type: "apis", apis: ["maps", "sql"] }])
        @user1_api_key = Carto::ApiKey.create_regular_key!(user: organization_user, name: unique_name('api_key'),
                                                           grants: [{ type: "apis", apis: ["maps", "sql"] }])
        organization.reload
      end

      after do
        drop_database('test_migration', organization.owner) if migrate_metadata
      end

      # TODO: fix broken spec after migrating to new CI
      xit "exports and reimports an organization #{migrate_metadata ? 'with' : 'without'} metadata" do
        export = Carto::UserMigrationExport.create(organization: organization, export_metadata: migrate_metadata)
        export.run_export

        export.state.should eq Carto::UserMigrationExport::STATE_COMPLETE

        migrate_metadata ? organization.destroy_cascade : drop_user_database(organization.owner)

        Cartodb.with_config(agg_ds_config) do
          # Do not depend on dataservices_client to be installed
          CartoDB::UserModule::DBService.any_instance.stubs(:install_geocoder_api_extension)

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
          new_organization.users.count.should eq(2)
          attributes_to_test(new_organization.owner.attributes).should eq attributes_to_test(owner_attributes)
          records.each.with_index { |row, index| @table1.record(index + 1).should include(row) }
          if migrate_metadata
            new_organization.owner.in_database(as: :superuser) do |db|
              db.exec_query("SELECT cartodb.cdb_extension_reload()")
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
      @map, @table, @table_visualization, @visualization = create_full_visualization(organization_user)

      organization_user.tables.exists?(name: @table.name).should be
      organization_user.in_database.execute("DROP TABLE #{@table.name}")
      # The table is still registered after the deletion
      organization_user.reload
      organization_user.tables.exists?(name: @table.name).should be

      export = Carto::UserMigrationExport.create(organization: organization, export_metadata: true)
      export.run_export
      export.log.collect_entries.should_not include(
        "Cannot export if tables aren't synched with db. Please run ghost tables."
      )
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
    before do
      @user = build(:valid_user)
      @user.save
      @carto_user = Carto::User.find(@user.id)
      @master_api_key = @carto_user.api_keys.master.first
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
                                                               ],
                                                               schemas: [
                                                                 {
                                                                   name: @carto_user.database_schema,
                                                                   permissions: ['create']
                                                                 }
                                                               ]
                                                             }
                                                           ])
    end

    it 'api keys are in redis and db roles are created' do
      pending('TODO: flacky spec. Pending to fix.')
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

      @carto_user.client_application.destroy
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

      puts import.log.entries if import.state != Carto::UserMigrationImport::STATE_COMPLETE
      expect(import.state).to eq(Carto::UserMigrationImport::STATE_COMPLETE)

      $users_metadata.hmget("api_keys:#{username}:#{@master_api_key.token}", 'user')[0].should eq username
      $users_metadata.hmget("api_keys:#{username}:#{@regular_api_key.token}", 'user')[0].should eq username

      user = Carto::User.find(user_attributes['id'])
      user.should be
      user.api_keys.each(&:table_permissions_from_db) # to make sure DB can be queried without exceptions
      user.api_keys.select { |a| a.type == 'master' }.first.table_permissions_from_db.count.should be > 0
    end

    it 'keeps roles for oauth api keys with schemas grants and you can drop tables after migration' do
      Cartodb::Central.stubs(:message_broker_sync_enabled?).returns(false)
      Cartodb::Central.stubs(:api_sync_enabled?).returns(false)

      oauth_app = Carto::OauthApp.create!(name: 'test',
                                          user_id: @carto_user.id,
                                          redirect_uris: ['https://example.com'],
                                          website_url: 'http://localhost',
                                          icon_url: 'https://example.com')
      oauth_app_user = oauth_app.oauth_app_users.create!(user_id: @carto_user.id)
      access_token = oauth_app_user.oauth_access_tokens.create!(scopes: ['schemas:c'])

      api_key = access_token.api_key
      with_connection_from_api_key(api_key) do |connection|
        connection.execute("create table test_table(id INT)")
        connection.execute("insert into test_table values (999)")
        connection.execute("select id from test_table") do |result|
          result[0]['id'].should eq '999'
        end
      end

      user_attributes = @carto_user.attributes
      export = Carto::UserMigrationExport.create(
        user: @carto_user,
        export_metadata: true
      )
      export.run_export

      puts export.log.entries if export.state != Carto::UserMigrationExport::STATE_COMPLETE
      expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)

      @carto_user.client_application.destroy
      @master_api_key.destroy
      @table.destroy
      @map.destroy
      @table_visualization.destroy
      @visualization.destroy

      # oauth_app must exist in the destination
      # so we remove the user_id to avoid it being cascade deleted with the user
      oauth_app.stubs(:sync_with_central?).returns(false)
      Cartodb::Central.stubs(:api_sync_enabled?).returns(true)
      oauth_app.user_id = nil
      oauth_app.save!

      @carto_user.destroy
      @regular_api_key.destroy
      drop_user_database(@user)

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

      user = Carto::User.find(user_attributes['id'])
      user.should be
      user.api_keys.each(&:table_permissions_from_db) # to make sure DB can be queried without exceptions
      user.api_keys.select { |a| a.type == 'master' }.first.table_permissions_from_db.count.should be > 0

      expect(user.oauth_app_users.count).to eq 1
      oauth_app_user = user.oauth_app_users.first
      expect(oauth_app_user.exists_ownership_role?).to be_true
      expect(oauth_app_user.oauth_access_tokens.count).to eq 1

      access_token = oauth_app_user.oauth_access_tokens.first
      api_key = access_token.api_key
      with_connection_from_api_key(api_key) do |connection|
        connection.execute("drop table test_table")
        connection.execute("select relname from pg_class where relname = 'test_table'") do |result|
          result.count eq 0
        end
        connection.execute("create table test_table(id INT)")
      end

      check_cdb_conf_query = "SELECT value->>'ownership_role_name' as c from cdb_conf where key = 'api_keys_' || '#{api_key.db_role}';"
      user.in_database(as: :superuser).execute("SELECT cartodb.cdb_extension_reload()")
      result = user.in_database(as: :superuser).execute(check_cdb_conf_query)
      expect(result.count).to eq 1
      oauth_app.destroy!
    end

    it 'api keys keeps the grants and you can drop tables after migration' do
      regular_api_key = @carto_user.api_keys.regular.first
      with_connection_from_api_key(regular_api_key) do |connection|
        connection.execute("create table test_table(id INT)")
        connection.execute("insert into test_table values (999)")
        connection.execute("select id from test_table") do |result|
          result[0]['id'].should eq '999'
        end
      end

      user_attributes = @carto_user.attributes
      export = Carto::UserMigrationExport.create(
        user: @carto_user,
        export_metadata: true
      )
      export.run_export

      puts export.log.entries if export.state != Carto::UserMigrationExport::STATE_COMPLETE
      expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)

      @carto_user.client_application.destroy
      @master_api_key.destroy
      @table.destroy
      @map.destroy
      @table_visualization.destroy
      @visualization.destroy
      @carto_user.destroy
      @regular_api_key.destroy
      drop_user_database(@user)

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

      user = Carto::User.find(user_attributes['id'])
      user.should be
      user.api_keys.each(&:table_permissions_from_db) # to make sure DB can be queried without exceptions
      user.api_keys.select { |a| a.type == 'master' }.first.table_permissions_from_db.count.should be > 0

      with_connection_from_api_key(user.api_keys.master.first) do |connection|
        connection.execute("drop table test_table")
        connection.execute("select relname from pg_class where relname = 'test_table'") do |result|
          result.count eq 0
        end
      end
    end
  end
end
