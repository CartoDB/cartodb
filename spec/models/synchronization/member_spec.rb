# encoding: utf-8

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
    end

    around(:each) do |example|
      Cartodb.with_config(metrics: {}, &example)
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
      it 'syncs' do
        # TODO: this is the minimum test valid to reproduce #11889, it's not a complete sync test
        CartoDB::Logger.stubs(:error).never

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

        member.run
      end

      it 'fails to overwrite tables with views' do
        url = 'https://wadus.com/guess_country.csv'

        path = fake_data_path('guess_country.csv')
        stub_download(url: url, filepath: path, content_disposition: false)

        attrs = random_attributes(user_id: @user2.id).merge(service_item_id: url, url: url, name: 'guess_country')
        member = Synchronization::Member.new(attrs).store

        DataImport.create(
          user_id: @user2.id,
          data_source: fake_data_path('guess_country.csv'),
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
