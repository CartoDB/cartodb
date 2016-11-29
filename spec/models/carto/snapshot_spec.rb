# ecoding: utf-8

require 'spec_helper_min'
require 'factories/carto_visualizations'

describe Carto::Snapshot do
  include Carto::Factories::Visualizations

  before(:all) do
    @user = FactoryGirl.create(:carto_user)
    @_m, @_t, @_tv, @visualization = create_full_visualization(@user)
  end

  after(:all) do
    destroy_full_visualization(@_m, @_t, @_tv, @visualization)
    @user.destroy
  end
end
