require_relative '../../spec_helper_min'
require_relative '../../../app/models/carto/user_migration_import'
require_relative '../../../app/models/carto/user_migration_export'
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
end
