# encoding: UTF-8

require 'spec_helper_min'

describe Carto::Layer do
  describe '#number_of_features' do
    it 'returns the sum of number of rows of its affected tables' do
      T1_FEATURES = 111
      T2_FEATURES = 222
      user_table_1 = FactoryGirl.create(:carto_user_table)
      user_table_2 = FactoryGirl.create(:carto_user_table)
      user_table_1.stubs(:estimated_row_count).returns(T1_FEATURES)
      user_table_2.stubs(:estimated_row_count).returns(T2_FEATURES)

      layer = FactoryGirl.create(:carto_layer)
      layer.stubs(:affected_tables).returns([user_table_1, user_table_2])

      layer.number_of_features.should eq T1_FEATURES + T2_FEATURES
    end
  end
end
