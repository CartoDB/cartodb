require_relative '../../../spec_helper_min'
require_relative '../../../support/helpers'

describe Carto::Superadmin::UserMigrationImportsController do
  include HelperMethods

  let(:superadmin_headers) do
    credentials = Cartodb.config[:superadmin]
    {
      'HTTP_AUTHORIZATION' => ActionController::HttpAuthentication::Basic.encode_credentials(
        credentials['username'],
        credentials['password']),
      'HTTP_ACCEPT' => "application/json"
    }
  end

  let(:invalid_headers) do
    {
      'HTTP_AUTHORIZATION' => ActionController::HttpAuthentication::Basic.encode_credentials('not', 'trusworthy'),
      'HTTP_ACCEPT' => "application/json"
    }
  end

  describe '#create' do
    before(:all) do
      @user = create(:carto_user)
      @organization = create(:organization)
    end

    after(:all) do
      @user.destroy
      @organization.destroy
    end

    let(:import_for_user) do
      {
        exported_file: 'https://carto.com/something/else',
        database_host: '127.0.0.1',
        org_import: false,
        json_file: 'id/user_id.json',
        import_metadata: false
      }
    end

    let(:import_for_organization) do
      {
        exported_file: '/path/to/nowhere',
        database_host: '127.0.0.1',
        org_import: true,
        json_file: 'my_pretty_json',
        import_metadata: false
      }
    end

    it 'returns 401 if not authorized' do
      Resque.expects(:enqueue).with(Resque::UserMigrationJobs::Import, anything).never
      post_json(superadmin_user_migration_imports_path, import_for_user, invalid_headers) do |response|
        response.status.should eq 401
      end
    end

    it 'creates an import for user' do
      Resque.expects(:enqueue).with(Resque::UserMigrationJobs::Import, anything).once
      post_json(superadmin_user_migration_imports_path, import_for_user, superadmin_headers) do |response|
        response.status.should eq 201
        response.body[:id].should be
        response.body[:state].should eq 'pending'
        response.body[:imported_file].should be_nil
        response.body[:json_file].should be_nil
        response.body[:log].should be_nil

        import = Carto::UserMigrationImport.find(response.body[:id])
        import.state.should eq 'pending'
      end
    end

    it 'creates an import for organization' do
      Resque.expects(:enqueue).with(Resque::UserMigrationJobs::Import, anything).once
      post_json(superadmin_user_migration_imports_path, import_for_organization, superadmin_headers) do |response|
        response.status.should eq 201
        response.body[:id].should be
        response.body[:state].should eq 'pending'
        response.body[:imported_file].should be_nil
        response.body[:json_file].should be_nil
        response.body[:log].should be_nil

        import = Carto::UserMigrationImport.find(response.body[:id])
        import.state.should eq 'pending'
      end
    end

    it 'returns an error if not passing parameters' do
      Resque.expects(:enqueue).with(Resque::UserMigrationJobs::Import, anything).never
      post_json(superadmin_user_migration_imports_path, {}, superadmin_headers) do |response|
        response.status.should eq 422
        response.body[:errors].should be
      end
    end
  end

  describe '#show' do
    before(:all) do
      @user = create(:carto_user)
      @import = Carto::UserMigrationImport.create(
        exported_file: 'some_url',
        database_host: 'some_ip',
        org_import: false,
        json_file: 'some_path'
      )
    end

    after(:all) do
      @import.destroy
      @user.destroy
    end

    it 'returns 401 if not authorized' do
      get_json(superadmin_user_migration_import_path(id: @import.id), {}, invalid_headers) do |response|
        response.status.should eq 401
      end
    end

    it 'returns the import if authorized and task is pending' do
      get_json(superadmin_user_migration_import_path(id: @import.id), {}, superadmin_headers) do |response|
        response.status.should eq 200
        response.body[:id].should eq @import.id
        response.body[:state].should eq @import.state
      end
    end

    it 'includes the log when task is complete' do
      @import.update_attributes(state: 'complete')
      @import.log.update_attributes(entries: 'Lorem ipsum')
      get_json(superadmin_user_migration_import_path(id: @import.id), {}, superadmin_headers) do |response|
        response.status.should eq 200
        response.body[:id].should eq @import.id
        response.body[:state].should eq @import.state
        response.body[:log].should eq @import.log.entries
      end
    end
  end
end
