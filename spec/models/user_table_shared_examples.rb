shared_examples_for 'user table models' do
  describe '#estimated_row_count and #actual_row_count' do
    it 'should query Table estimated an actual row count methods' do
      ::Table.any_instance.stubs(:estimated_row_count).returns(999)
      ::Table.any_instance.stubs(:actual_row_count).returns(1000)

      @user_table.estimated_row_count.should == 999
      @user_table.actual_row_count.should == 1000
    end
  end

  it 'should sync table_id with physical table oid' do
    @user_table.table_id = nil
    @user_table.save

    @user_table.table_id.should be_nil

    @user_table.sync_table_id.should eq @user_table.service.get_table_id
  end

  describe 'dependent visualizations' do
    include Carto::Factories::Visualizations

    before(:all) do
      @map, @other_table, @table_visualization, @visualization = create_full_visualization(@carto_user)
      @first_layer = @visualization.data_layers.first
      @second_layer = FactoryGirl.create(:carto_layer, kind: 'torque', maps: [@map])
    end

    before(:each) do
      @second_layer.update_attribute(:kind, 'torque')
      @user_table.reload
    end

    after(:all) do
      @second_layer.destroy
      destroy_full_visualization(@map, @other_table, @table_visualization, @visualization)
    end

    it 'no layers depending on the table -> not dependent' do
      @first_layer.user_table_ids = []
      @second_layer.user_table_ids = []

      @dependent_test_object.dependent_visualizations.any?.should be_false
      @dependent_test_object.non_dependent_visualizations.any?.should be_false
    end

    it 'one layer depending on the table -> fully dependent' do
      @first_layer.user_table_ids = [@user_table.id]
      @second_layer.user_table_ids = []
      @second_layer.update_attribute(:kind, 'tiled')

      @dependent_test_object.dependent_visualizations.any?.should be_true
      @dependent_test_object.non_dependent_visualizations.any?.should be_false
    end

    it 'two layers depending on the table -> fully dependent' do
      @first_layer.user_table_ids = [@user_table.id]
      @second_layer.user_table_ids = [@user_table.id]

      @dependent_test_object.dependent_visualizations.any?.should be_true
      @dependent_test_object.non_dependent_visualizations.any?.should be_false
    end

    it 'two layers depending on different tables -> partially dependent' do
      @first_layer.user_table_ids = [@user_table.id]
      @second_layer.user_table_ids = [@other_table.id]

      @dependent_test_object.dependent_visualizations.any?.should be_false
      @dependent_test_object.non_dependent_visualizations.any?.should be_true
    end

    it 'two layers depending on multiple tables (both include this one) -> fully dependent' do
      @first_layer.user_table_ids = [@user_table.id]
      @second_layer.user_table_ids = [@user_table.id, @other_table.id]

      @dependent_test_object.dependent_visualizations.any?.should be_true
      @dependent_test_object.non_dependent_visualizations.any?.should be_false
    end

    it 'two layers depending on multiple tables (this table is only used in one layer) -> partially dependent' do
      @first_layer.user_table_ids = [@user_table.id, @other_table.id]
      @second_layer.user_table_ids = [@other_table.id]

      @dependent_test_object.dependent_visualizations.any?.should be_false
      @dependent_test_object.non_dependent_visualizations.any?.should be_true
    end
  end
end
