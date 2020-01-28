require_relative '../../spec_helper_min'
require_relative '../../../app/models/carto/user_migration_import'
require_relative '../../../app/models/carto/user_migration_export'
require_relative '../../support/factories/tables'
require_relative '../../factories/organizations_contexts'
require 'helpers/database_connection_helper'
require 'factories/carto_visualizations'

describe 'UserMigration' do
  include Carto::Factories::Visualizations
  include CartoDB::Factories
  include DatabaseConnectionHelper

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
        # Do not depend on dataservices_client to be installed
        CartoDB::UserModule::DBService.any_instance.stubs(:install_geocoder_api_extension)

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
        v.user_table.delete if v.user_table # Delete user_table since it can conflict by name
        v.delete
      end
      gum = CartoDB::GeocoderUsageMetrics.new(carto_user.username)
      $users_metadata.DEL(gum.send(:user_key_prefix, :geocoder_here, :success_responses, Time.now))
      ::User[carto_user.id].client_application.oauth_tokens.each(&:destroy)
      ::User[carto_user.id].client_application.destroy
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
