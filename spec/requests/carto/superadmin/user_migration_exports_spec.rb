require_relative '../../../spec_helper_min'
require_relative '../../../support/helpers'

describe Carto::Superadmin::UserMigrationExportsController do
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
      @user = FactoryGirl.create(:carto_user)
      @organization = FactoryGirl.create(:organization)
    end

    after(:all) do
      @user.destroy
      @organization.destroy
    end

    let(:export_for_user) do
      {
        user_id: @user.id
      }
    end

    let(:export_for_organization) do
      {
        organization_id: @organization.id
      }
    end

    it 'returns 401 if not authorized' do
      Resque.expects(:enqueue).with(Resque::UserMigrationJobs::Export, anything).never
      post_json(superadmin_user_migration_exports_path, export_for_user, invalid_headers) do |response|
        response.status.should eq 401
      end
    end

    it 'creates an export for user' do
      Resque.expects(:enqueue).with(Resque::UserMigrationJobs::Export, anything).once
      post_json(superadmin_user_migration_exports_path, export_for_user, superadmin_headers) do |response|
        response.status.should eq 201
        response.body[:id].should be
        response.body[:state].should eq 'pending'
        response.body[:exported_file].should be_nil
        response.body[:json_file].should be_nil
        response.body[:log].should be_nil

        export = Carto::UserMigrationExport.find(response.body[:id])
        export.state.should eq 'pending'
      end
    end

    it 'creates an export for organization' do
      Resque.expects(:enqueue).with(Resque::UserMigrationJobs::Export, anything).once
      post_json(superadmin_user_migration_exports_path, export_for_organization, superadmin_headers) do |response|
        response.status.should eq 201
        response.body[:id].should be
        response.body[:state].should eq 'pending'
        response.body[:exported_file].should be_nil
        response.body[:json_file].should be_nil
        response.body[:log].should be_nil

        export = Carto::UserMigrationExport.find(response.body[:id])
        export.state.should eq 'pending'
      end
    end

    it 'returns an error if passing both user and organization' do
      Resque.expects(:enqueue).with(Resque::UserMigrationJobs::Export, anything).never
      export_for_user_and_org = export_for_organization.merge(export_for_user)
      post_json(superadmin_user_migration_exports_path, export_for_user_and_org, superadmin_headers) do |response|
        response.status.should eq 422
        response.body[:errors].should be
      end
    end

    it 'returns an error if not passing parameters' do
      Resque.expects(:enqueue).with(Resque::UserMigrationJobs::Export, anything).never
      post_json(superadmin_user_migration_exports_path, {}, superadmin_headers) do |response|
        response.status.should eq 422
        response.body[:errors].should be
      end
    end
  end

  describe '#show' do
    before(:all) do
      @user = FactoryGirl.create(:carto_user)
      @export = Carto::UserMigrationExport.create(user: @user)
    end

    after(:all) do
      @export.destroy
      @user.destroy
    end

    it 'returns 401 if not authorized' do
      get_json(superadmin_user_migration_export_path(id: @export.id), {}, invalid_headers) do |response|
        response.status.should eq 401
      end
    end

    it 'returns the export if authorized and task is pending' do
      get_json(superadmin_user_migration_export_path(id: @export.id), {}, superadmin_headers) do |response|
        response.status.should eq 200
        response.body[:id].should eq @export.id
        response.body[:state].should eq @export.state
      end
    end

    it 'includes the exported file paths when task is complete' do
      @export.update_attributes(exported_file: 'wadus_path', json_file: 'wadus_json', state: 'complete')
      @export.log.update_attributes(entries: 'Lorem ipsum')
      get_json(superadmin_user_migration_export_path(id: @export.id), {}, superadmin_headers) do |response|
        response.status.should eq 200
        response.body[:id].should eq @export.id
        response.body[:state].should eq @export.state
        response.body[:exported_file].should eq @export.exported_file
        response.body[:json_file].should eq @export.json_file
        response.body[:log].should eq @export.log.entries
      end
    end
  end
end
