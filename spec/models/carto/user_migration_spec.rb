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

  shared_examples_for 'migrating metadata' do |migrate_metadata|
    it "exports and reimports a user #{migrate_metadata ? 'with' : 'without'} metadata" do
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)

      user = FactoryGirl.build(:valid_user).save
      carto_user = Carto::User.find(user.id)
      user_attributes = carto_user.attributes

      table1 = create_table(user_id: user.id)
      records.each { |row| table1.insert_row!(row) }

      export = Carto::UserMigrationExport.create(
        user: carto_user,
        export_metadata: migrate_metadata
      )
      export.run_export

      puts export.log.entries if export.state != Carto::UserMigrationExport::STATE_COMPLETE
      expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)

      carto_user.client_applications.each(&:destroy)
      table1.table_visualization.layers.each(&:destroy)
      table1.destroy
      expect { table1.records }.to raise_error

      migrate_metadata ? user.destroy : drop_database(user)

      import = Carto::UserMigrationImport.create(
        exported_file: export.exported_file,
        database_host: user_attributes['database_host'],
        org_import: false,
        json_file: export.json_file,
        import_metadata: migrate_metadata
      )
      import.run_import

      puts import.log.entries if import.state != Carto::UserMigrationImport::STATE_COMPLETE
      expect(import.state).to eq(Carto::UserMigrationImport::STATE_COMPLETE)

      carto_user = Carto::User.find(user_attributes['id'])

      if migrate_metadata
        attributes_to_test(user_attributes).each do |attribute|
          expect(carto_user.attributes[attribute]).to eq(user_attributes[attribute])
        end
      else
        expect(carto_user.attributes).to eq(user_attributes)
      end

      records.each.with_index { |row, index| table1.record(index + 1).should include(row) }

      migrate_metadata ? user.destroy_cascade : user.destroy
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

    it 'should fail if importing an already existing organization with metadata' do
      org_import.run_import.should eq true
      imp = org_import
      imp.run_import.should eq false
      imp.state.should eq 'failure'
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

  it 'doesn\'t export users with datasets without a physical table if metadata export is requested (see #12588)' do
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
    export.log.entries.should include("Cannot export if tables aren't synched with db. Please run ghost tables.")
    expect(export.state).to eq(Carto::UserMigrationExport::STATE_FAILURE)
    export.destroy

    export = Carto::UserMigrationExport.create(user: carto_user, export_metadata: false)
    export.run_export
    expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)
    export.destroy

    user.destroy
  end

  it 'doesn\'t export users with a canonical viz without user table if metadata export is requested (see #12588)' do
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
    export.log.entries.should include("Can't export. Vizs without user table: [\"#{@table_visualization.id}\"]")
    expect(export.state).to eq(Carto::UserMigrationExport::STATE_FAILURE)
    export.destroy

    export = Carto::UserMigrationExport.create(user: carto_user, export_metadata: false)
    export.run_export
    expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)
    export.destroy

    user.destroy
  end

  describe 'with organization' do
    include_context 'organization with users helper'

    let(:org_attributes) { @carto_organization.attributes }
    let(:owner_attributes) { @carto_org_user_owner.attributes }

    shared_examples_for 'migrating metadata' do |migrate_metadata|
      it "exports and reimports an organization #{migrate_metadata ? 'with' : 'without'} metadata" do
        table1 = create_table(user_id: @carto_org_user_1.id)
        records.each { |row| table1.insert_row!(row) }

        export = Carto::UserMigrationExport.create(organization: @carto_organization, export_metadata: migrate_metadata)
        export.run_export

        export.state.should eq Carto::UserMigrationExport::STATE_COMPLETE

        migrate_metadata ? @organization.destroy_cascade : drop_database(@organization.owner)

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
        records.each.with_index { |row, index| table1.record(index + 1).should include(row) }
      end
    end

    it_should_behave_like 'migrating metadata', true
    it_should_behave_like 'migrating metadata', false

    it 'doesn\'t export orgs with datasets without physical table if metadata export is requested (see #12588)' do
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_org_user_1)

      @carto_org_user_1.tables.exists?(name: @table.name).should be
      @org_user_1.in_database.execute("DROP TABLE #{@table.name}")
      # The table is still registered after the deletion
      @carto_org_user_1.reload
      @carto_org_user_1.tables.exists?(name: @table.name).should be

      export = Carto::UserMigrationExport.create(organization: @carto_organization, export_metadata: true)
      export.run_export
      export.log.entries.should include("Cannot export if tables aren't synched with db. Please run ghost tables.")
      expect(export.state).to eq(Carto::UserMigrationExport::STATE_FAILURE)
      export.destroy

      export = Carto::UserMigrationExport.create(organization: @carto_organization, export_metadata: false)
      export.run_export
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

    drop_database(user)

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

  def drop_database(user)
    conn = user.in_database(as: :cluster_admin)
    user.db_service.drop_database_and_user(conn)
    user.db_service.drop_user(conn)
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
