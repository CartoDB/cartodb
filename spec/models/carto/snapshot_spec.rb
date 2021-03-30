require 'spec_helper_unit'

describe Carto::Snapshot do
  before do
    bypass_named_maps
    @user = create(:carto_user)
    @visualization = create(:carto_visualization, user: @user)
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
