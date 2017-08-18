require_relative '../../spec_helper_min'
require_relative '../../../app/models/carto/user_migration_import'
require_relative '../../../app/models/carto/user_migration_export'
require_relative '../../support/factories/tables'
require_relative '../../factories/organizations_contexts'

describe 'UserMigration' do
  include CartoDB::Factories

  let(:records) do
    [
      { name: 'carto', description: 'awesome' },
      { name: 'user-mover', description: 'insanity' }
    ]
  end

  ['without', 'with'].each do |metadata_value|
    it "exports and reimports a user #{metadata_value} metadata" do
      metadata_boolean_value = (metadata_value == 'with')
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)

      user = FactoryGirl.build(:valid_user).save
      carto_user = Carto::User.find(user.id)
      user_attributes = carto_user.attributes

      table1 = create_table(user_id: user.id)
      records.each { |row| table1.insert_row!(row) }

      export = Carto::UserMigrationExport.create(
        user: carto_user,
        export_metadata: metadata_boolean_value
      )
      export.run_export

      puts export.log.entries if export.state != Carto::UserMigrationExport::STATE_COMPLETE
      expect(export.state).to eq(Carto::UserMigrationExport::STATE_COMPLETE)

      carto_user.client_applications.each(&:destroy)
      table1.table_visualization.layers.each(&:destroy)
      table1.destroy
      expect { table1.records }.to raise_error

      if metadata_boolean_value
        user.destroy
      else
        conn = user.in_database(as: :cluster_admin)
        user.db_service.drop_database_and_user(conn)
        user.db_service.drop_user(conn)
      end

      import = Carto::UserMigrationImport.create(
        exported_file: export.exported_file,
        database_host: user_attributes['database_host'],
        org_import: false,
        json_file: export.json_file,
        import_metadata: metadata_boolean_value,
        import_type: 'user'
      )
      import.run_import

      puts import.log.entries if import.state != Carto::UserMigrationImport::STATE_COMPLETE
      expect(import.state).to eq(Carto::UserMigrationImport::STATE_COMPLETE)

      carto_user = Carto::User.find(user_attributes['id'])

      if metadata_boolean_value
        user_attributes_to_test = user_attributes.keys - %w(created_at updated_at period_end_date)

        user_attributes_to_test.each do |attribute|
          expect(carto_user.attributes[attribute]).to eq(user_attributes[attribute])
        end
      else
        expect(carto_user.attributes).to eq(user_attributes)
      end

      records.each.with_index { |row, index| table1.record(index + 1).should include(row) }

      metadata_boolean_value ? user.destroy_cascade : user.destroy
    end

  end

  describe 'with organization' do
    include_context 'organization with users helper'

    ['without', 'with'].each do |metadata_value|
      it "exports and reimports an organization #{metadata_value} metadata" do
        metadata_boolean_value = (metadata_value == 'with')

        org_attributes = @carto_organization.attributes
        owner_attributes = @carto_org_user_owner.attributes

        table1 = create_table(user_id: @carto_org_user_1.id)
        records.each { |row| table1.insert_row!(row) }

        export = Carto::UserMigrationExport.create(
            organization: @carto_organization,
            export_metadata: metadata_boolean_value
        )
        export.run_export

        puts export.log.entries if export.state != Carto::UserMigrationExport::STATE_COMPLETE
        export.state.should eq Carto::UserMigrationExport::STATE_COMPLETE

        table1.table_visualization.layers.each(&:destroy)
        table1.destroy
        expect { table1.records }.to raise_error
        @carto_org_user_2.client_applications.each(&:destroy)
        @org_user_2.destroy
        @carto_org_user_1.client_applications.each(&:destroy)
        @org_user_1.destroy
        @carto_org_user_owner.client_applications.each(&:destroy)
        @org_user_owner.destroy
        # Organization is destroyed by owner destruction

        import = Carto::UserMigrationImport.create(
          exported_file: export.exported_file,
          database_host: owner_attributes['database_host'],
          org_import: true,
          json_file: export.json_file,
          import_metadata: metadata_boolean_value,
          import_type: 'organization'
        )
        import.run_import

        puts import.log.entries if import.state != Carto::UserMigrationImport::STATE_COMPLETE
        import.state.should eq Carto::UserMigrationImport::STATE_COMPLETE

        new_organization = Carto::Organization.find(org_attributes['id'])
        new_organization.attributes.should eq org_attributes
        new_organization.users.count.should eq 3
        new_organization.owner.attributes.should eq owner_attributes
        records.each.with_index { |row, index| table1.record(index + 1).should include(row) }
      end
    end
  end
end
