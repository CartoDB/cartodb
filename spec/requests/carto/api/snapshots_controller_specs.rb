# encoding utf-8

require 'spec_helper_min'

module Carto
  module Api
    describe SnapshotsController do
      before(:all) do
        @user = FactoryGirl.create(:carto_user)
        @intruder = FactoryGirl.create(:carto_user)
        @_m, @_t, @_tv, @visualization = create_full_visualization(@user)
      end

      after(:all) do
        destroy_full_visualzation(@_m, @_t, @_tv, @visualization)
        @intruder.destroy
        @user.destroy
      end
    end
  end
end
