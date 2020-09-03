require_relative '../../spec_helper'

require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../services/data-repository/repository'
require_relative '../../../app/models/synchronization/member'
require 'helpers/unique_names_helper'
require 'helpers/file_server_helper'

include UniqueNamesHelper
include CartoDB

describe Synchronization::Member do
  describe 'Basic actions' do
    it 'assigns an id by default' do
      member = Synchronization::Member.new
      member.should be_an_instance_of Synchronization::Member
      member.id.should_not be_nil
    end

    it 'persists attributes to the repository' do
      attributes  = random_attributes
      member      = Synchronization::Member.new(attributes)
      member.store

      member      = Synchronization::Member.new(id: member.id)
      member.name.should be_nil

      member.fetch
      member.name             .should == attributes.fetch(:name)
    end

    it 'fetches attributes from the repository' do
      attributes  = random_attributes
      member      = Synchronization::Member.new(attributes).store
      member      = Synchronization::Member.new(id: member.id)
      member.name = 'changed'
      member.fetch
      member.name.should == attributes.fetch(:name)
    end

    it 'deletes this member from the repository' do
      member      = Synchronization::Member.new(random_attributes).store
      member.fetch
      member.name.should_not be_nil

      member.delete

      member.name.should be_nil
      lambda { member.fetch }.should raise_error KeyError
    end
  end

  describe "synchronizations" do
    before(:all) do
      @user1 = create_user(sync_tables_enabled: true)
      @user2 = create_user(sync_tables_enabled: true)
    end

    before(:each) do
      bypass_named_maps
      ::Hubspot::EventsAPI.any_instance.stubs(:enabled?).returns(false)
    end

    after(:all) do
      @user1.destroy
      @user2.destroy
    end

    describe 'external sources' do
      it "Authorizes to sync always if from an external source" do
        member = Synchronization::Member.new(random_attributes(user_id: @user1.id)).store
        member.fetch

        member.expects(:from_external_source?).returns(true)

        @user1.sync_tables_enabled = true
        @user2.sync_tables_enabled = true

        member.authorize?(@user1).should eq true
        member.authorize?(@user2).should eq false

        @user1.sync_tables_enabled = false
        @user2.sync_tables_enabled = false

        member.authorize?(@user1).should eq true
      end
    end

    describe "synchronization" do
      it 'fails if user is inactive' do
        url = 'https://wadus.com/guess_country.csv'

        path = fake_data_path('guess_country.csv')
        stub_download(url: url, filepath: path, content_disposition: false)

        attrs = random_attributes(user_id: @user1.id).merge(service_item_id: url, url: url, name: 'guess_country')
        member = Synchronization::Member.new(attrs).store

        DataImport.create(
          user_id: @user1.id,
          data_source: fake_data_path('guess_country.csv'),
          synchronization_id: member.id,
          service_name: 'public_url',
          service_item_id: url,
          updated_at: Time.now
        ).run_import!
        @user1.state = Carto::User::STATE_LOCKED
        @user1.save

        Rails.logger.expects(:error).once

        member.fetch.run

        member.log.entries.should match /Can't run a synchronization for inactive user/
        expect(member.state).to eq 'failure'

        @user1.state = Carto::User::STATE_ACTIVE
        @user1.sync_tables_enabled = true
        @user1.save
        @user1.reload
      end

      it 'fails to overwrite tables with views by replacement' do
        url = 'https://wadus.com/guess_country.csv'

        path = fake_data_path('guess_country.csv')
        stub_download(url: url, filepath: path, content_disposition: false)

        attrs = random_attributes(user_id: @user2.id).merge(service_item_id: url, url: url, name: 'guess_country')
        member = Synchronization::Member.new(attrs).store

        DataImport.create(
          user_id: @user2.id,
          data_source: path,
          synchronization_id: member.id,
          service_name: 'public_url',
          service_item_id: url,
          updated_at: Time.now
        ).run_import!

        @user2.in_database.execute('CREATE VIEW wadus AS SELECT * FROM guess_country')

        member.run
        expect(member.state).to eq 'failure'
        expect(member.error_code).to eq 2013
      end

      it 'it can overwrite tables with views by sync' do
        url = 'https://wadus.com/guess_country_geocoded.csv'

        path = fake_data_path('guess_country_geocoded.csv')
        stub_download(url: url, filepath: path, content_disposition: false)

        attrs = random_attributes(user_id: @user2.id).merge(service_item_id: url, url: url, name: 'guess_country_geocoded')
        member = Synchronization::Member.new(attrs).store

        DataImport.create(
          user_id: @user2.id,
          data_source: path,
          synchronization_id: member.id,
          service_name: 'public_url',
          service_item_id: url,
          updated_at: Time.now
        ).run_import!

        @user2.in_database.execute('CREATE VIEW wadus_geocoded AS SELECT * FROM guess_country_geocoded')

        member.run
        expect(member.state).to eq 'success'
      end

      it 'should sync files with missing ogc_fid' do
        stub_arcgis_response_with_file(
          File.expand_path('spec/fixtures/arcgis_response_missing_ogc_fid.json'),
          File.expand_path('spec/fixtures/arcgis_metadata_ogc_fid.json')
        )

        url = 'https://wtf.com/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/2'

        attrs = random_attributes(user_id: @user1.id)
                .merge(service_item_id: url, url: url, name: 'land_zoning')
        member = Synchronization::Member.new(attrs).store

        data_import = DataImport.create(
          user_id: @user1.id,
          synchronization_id: member.id,
          service_name: 'arcgis',
          service_item_id: url,
          updated_at: Time.now
        )

        data_import.run_import!
        expect(data_import.state).to eq 'complete'

        source_file = CartoDB::Importer2::SourceFile.new(
          File.expand_path('spec/fixtures/arcgis_response_missing_ogc_fid.json'),
          'arcgis_response_missing_ogc_fid.json'
        )
        CartoDB::Importer2::Downloader.any_instance.stubs(:download_and_store).returns(source_file)
        CartoDB::Importer2::Downloader.any_instance.stubs(:source_file).returns(source_file)
        member.run
        expect(member.state).to eq 'success'
      end

      it 'keeps indices' do
        url = 'https://wadus.com/clubbing.csv'

        path = fake_data_path('clubbing.csv')
        stub_download(url: url, filepath: path, content_disposition: false)

        attrs = random_attributes(user_id: @user2.id).merge(service_item_id: url, url: url, name: 'clubbing')
        member = Synchronization::Member.new(attrs).store

        # Create table with index
        DataImport.create(
          user_id: @user2.id,
          data_source: path,
          synchronization_id: member.id,
          service_name: 'public_url',
          service_item_id: url,
          updated_at: Time.now
        ).run_import!
        @user2.in_database.execute('CREATE INDEX ON clubbing (nombre)')

        # Sync the table
        member.run
        expect(member.state).to eq 'success'

        # Expect custom and default indices to still exist
        table = UserTable.where(user: @user2, name: 'clubbing').first
        indexed_columns = table.service.pg_indexes.map { |x| x[:column] }
        expected_indices = ['cartodb_id', 'the_geom', 'the_geom_webmercator', 'nombre']

        expect(indexed_columns.sort).to eq(expected_indices.sort)
      end
    end
  end

  private

  def random_attributes(attributes={})
    random = unique_integer
    {
      name:       attributes.fetch(:name, "name#{random}"),
      interval:   attributes.fetch(:interval, 15 * 60 + random),
      state:      attributes.fetch(:state, 'enabled'),
      user_id:    attributes.fetch(:user_id, nil)
    }
  end
end
