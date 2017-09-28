require_relative '../../spec_helper_min'

describe Carto::UserMigrationImport do
  describe '#import' do
    before :each do
      @import = Carto::UserMigrationImport.create(
        exported_file: :irrelevant_file,
        json_file: "irrelevant_json_file",
        database_host: :database_host,
        user_id: :irrelevant_user_id,
        organization_id: :irrelevant_organization_id,
        import_metadata: true
      )
      setup_mocks
    end

    it 'should update database host for imported user' do
      should_import_metadata_for_user(@user_mock)
      @import.org_import = false
      should_update_database_host_for_users([@user_mock])

      @import.run_import
    end

    it 'should update database host for all users in org' do
      users = create_and_add_users_to_organizaton
      should_import_metadata_for_organization(@organization_mock)
      @import.org_import = true
      should_update_database_host_for_users(users)

      @import.run_import
    end

    private

    def should_update_database_host_for_users(users)
      sequel_user_mock = Object.new
      ::User.stubs(:[]).returns(sequel_user_mock)
      sequel_user_mock.expects(:reload).times(users.length)
      users.each do |user|
        user.expects(:database_host=).with(:database_host).once
        user.expects(:save!).once
      end
    end

    def setup_mocks
      @organization_mock = Carto::Organization.new
      @import.stubs(:assert_organization_does_not_exist)
      @import.stubs(:assert_user_does_not_exist)
      @user_migration_package_mock = Object.new
      Carto::UserMigrationPackage.stubs(:for_import).returns @user_migration_package_mock
      @user_migration_package_mock.stubs(:download).with(:irrelevant_file)
      @user_migration_package_mock.stubs(:meta_dir).returns(:irrelevant_meta_dir)
      @user_migration_package_mock.stubs(:data_dir).returns :irrelevant_data_dir
      @user_mock = Carto::User.new
      @export_job_mock = Object.new
      @export_job_mock.expects(:run!).once
      @export_job_mock.expects(:terminate_connections).once
      CartoDB::DataMover::ImportJob.stubs(:new).returns @export_job_mock
      @user_migration_package_mock.stubs(:cleanup)
      @import.expects(:save!).once.returns @import

    end

    def expected_job_arguments
      {
        job_uuid: nil,
        file: "irrelevant_data_dir/irrelevant_json_file",
        data: true,
        metadata: false,
        host: :database_host,
        rollback: false,
        into_org_name: nil,
        mode: :import,
        logger: @import.log.logger,
        import_job_logger: @import.log.logger
      }
    end

    def should_import_metadata_for_user(user)
      @user_migration_package_mock.stubs(:meta_dir).returns :irrelevant_meta_dir
      Carto::UserMetadataExportService.any_instance.expects(:import_from_directory).with(:irrelevant_meta_dir)
                                      .returns user
      Carto::UserMetadataExportService.any_instance.expects(:import_metadata_from_directory)
                                      .with(user, :irrelevant_meta_dir)
    end

    def should_import_metadata_for_organization(organization)
      @user_migration_package_mock.stubs(:meta_dir).returns :irrelevant_meta_dir
      Carto::OrganizationMetadataExportService.any_instance.stubs(:import_from_directory).with(:irrelevant_meta_dir)
                                              .once.returns organization
      Carto::OrganizationMetadataExportService.any_instance.stubs(:import_metadata_from_directory)
                                              .once.with(organization, :irrelevant_meta_dir)
    end

    def create_and_add_users_to_organizaton
      user2 = Carto::User.new
      user3 = Carto::User.new
      @organization_mock.users << user2
      @organization_mock.users << user3
    end
  end
end
