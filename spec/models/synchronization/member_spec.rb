# encoding: utf-8

require_relative '../../spec_helper'

require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../services/data-repository/repository'
require_relative '../../../app/models/synchronization/member'
require 'helpers/unique_names_helper'

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

  describe "External sources" do
    before(:each) do
      @user_1 = FactoryGirl.create(:valid_user)
      @user_2 = FactoryGirl.create(:valid_user)
    end

    after(:each) do
      @user_1.destroy
      @user_2.destroy
    end

    it "Authorizes to sync always if from an external source" do
      member  = Synchronization::Member.new(random_attributes({user_id: @user_1.id})).store
      member.fetch

      member.expects(:from_external_source?)
            .returns(true)

      @user_1.sync_tables_enabled = true
      @user_2.sync_tables_enabled = true

      member.authorize?(@user_1).should eq true
      member.authorize?(@user_2).should eq false

      @user_1.sync_tables_enabled = false
      @user_2.sync_tables_enabled = false

      member.authorize?(@user_1).should eq true
    end
  end

  private

  def random_attributes(attributes={})
    random = unique_integer
    {
      name:       attributes.fetch(:name, "name #{random}"),
      interval:   attributes.fetch(:interval, 15 * 60 + random),
      state:      attributes.fetch(:state, 'enabled'),
      user_id:    attributes.fetch(:user_id, nil)
    }
  end
end
