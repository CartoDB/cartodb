# encoding: utf-8

require 'spec_helper_min'

describe Carto::Snapshot do
  before(:all) do
    bypass_named_maps
    @user = FactoryGirl.create(:carto_user)
    @visualization = FactoryGirl.create(:carto_visualization, user: @user)
  end

  after(:all) do
    @visualization.destroy
    @user.destroy
  end

  describe('#validation') do
    it 'rejects nil visualization' do
      snapshot = Carto::Snapshot.new(user_id: @user.id)
      snapshot.save.should be_false
      snapshot.errors[:visualization].should_not be_empty
    end

    it 'rejects nil user' do
      snapshot = Carto::Snapshot.new(visualization_id: @visualization.id)
      snapshot.save.should be_false
      snapshot.errors[:user].should_not be_empty
    end
  end
end
