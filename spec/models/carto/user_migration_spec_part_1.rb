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
