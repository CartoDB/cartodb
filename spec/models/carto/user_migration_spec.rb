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

  it 'exports and imports a user with a data import with two tables' do
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)

    user = FactoryGirl.build(:valid_user).save
    carto_user = Carto::User.find(user.id)
    user_attributes = carto_user.attributes

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
      import_metadata: true
    )
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

  it 'does not export user with a dataset that does not have a physical table (see #12588)' do
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
  end

  def drop_database(user)
    conn = user.in_database(as: :cluster_admin)
    user.db_service.drop_database_and_user(conn)
    user.db_service.drop_user(conn)
  end

  def attributes_to_test(user_attributes)
    user_attributes.keys - %w(created_at updated_at period_end_date)
  end
end
