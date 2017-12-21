shared_examples_for 'user table models' do
  describe '#validation' do
    after(:each) do
      @duplicate.try(:destroy)
    end

    it 'validates that user is required' do
      ut = build_user_table
      expect(ut.valid?).to be_false
      # Error key is :user_id for Sequel, :user for AR
      expect(ut.errors.keys & [:user, :user_id]).not_to be_empty
    end

    it 'validates that viewer user cannot modify tables' do
      @user.stubs(:viewer).returns(true)
      ut = build_user_table(user: @user)
      expect(ut.valid?).to be_false
      expect(ut.errors.keys).to include :user
    end

    it 'validates that name cannot be a reserved name' do
      ut = build_user_table(user: @user, name: 'public')
      expect(ut.valid?).to be_false
      expect(ut.errors.keys).to include :name
    end

    it 'validates that name cannot be taken' do
      @duplicate = FactoryGirl.create(:carto_user_table, user: Carto::User.find(@user.id), name: 'ut_spec_wadus')
      ut = build_user_table(user: @user, name: 'ut_spec_wadus')
      expect(ut.valid?).to be_false
      expect(ut.errors.keys.flatten).to include :name
    end

    it 'validates privacy' do
      begin
        ut = build_user_table(user: @user, privacy: 234)
        # AR fails validation
        expect(ut.valid?).to be_false
        expect(ut.errors.keys).to include :privacy
      rescue RuntimeError => e
        # Sequel raises when building the model
        raise 'Spec failed' unless e.message.include?('Invalid privacy value')
      end
    end

    it 'defaults to public privacy for users without private tables' do
      @user.stubs(:private_tables_enabled).returns(false)
      ut = build_user_table(user: @user)
      expect(ut.valid?).to be_true
      expect(ut.privacy).to eq Carto::UserTable::PRIVACY_PUBLIC
    end

    it 'defaults to private privacy for users with private tables' do
      @user.stubs(:private_tables_enabled).returns(true)
      ut = build_user_table(user: @user)
      expect(ut.valid?).to be_true
      expect(ut.privacy).to eq Carto::UserTable::PRIVACY_PRIVATE
    end

    it 'validates privacy option for user without private tables' do
      @user.stubs(:private_tables_enabled).returns(false)
      ut = build_user_table(user: @user, privacy: Carto::UserTable::PRIVACY_PUBLIC)
      expect(ut.valid?).to be_true

      ut = build_user_table(user: @user, privacy: Carto::UserTable::PRIVACY_PRIVATE)
      expect(ut.valid?).to be_false
      expect(ut.errors.keys).to include :privacy
    end

    it 'validates privacy option for user with private tables' do
      @user.stubs(:private_tables_enabled).returns(true)
      ut = build_user_table(user: @user, privacy: Carto::UserTable::PRIVACY_PUBLIC)
      expect(ut.valid?).to be_true

      ut = build_user_table(user: @user, privacy: Carto::UserTable::PRIVACY_PRIVATE)
      expect(ut.valid?).to be_true
    end
  end

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

      @dependent_test_object.fully_dependent_visualizations.any?.should be_false
      @dependent_test_object.partially_dependent_visualizations.any?.should be_false
    end

    it 'one layer depending on the table -> fully dependent' do
      @first_layer.user_table_ids = [@user_table.id]
      @second_layer.user_table_ids = []
      @second_layer.update_attribute(:kind, 'tiled')

      @dependent_test_object.fully_dependent_visualizations.any?.should be_true
      @dependent_test_object.partially_dependent_visualizations.any?.should be_false
    end

    it 'two layers depending on the table -> fully dependent' do
      @first_layer.user_table_ids = [@user_table.id]
      @second_layer.user_table_ids = [@user_table.id]

      @dependent_test_object.fully_dependent_visualizations.any?.should be_true
      @dependent_test_object.partially_dependent_visualizations.any?.should be_false
    end

    it 'two layers depending on different tables -> partially dependent' do
      @first_layer.user_table_ids = [@user_table.id]
      @second_layer.user_table_ids = [@other_table.id]

      @dependent_test_object.fully_dependent_visualizations.any?.should be_false
      @dependent_test_object.partially_dependent_visualizations.any?.should be_true
    end

    it 'two layers depending on multiple tables (both include this one) -> fully dependent' do
      @first_layer.user_table_ids = [@user_table.id]
      @second_layer.user_table_ids = [@user_table.id, @other_table.id]

      @dependent_test_object.fully_dependent_visualizations.any?.should be_true
      @dependent_test_object.partially_dependent_visualizations.any?.should be_false
    end

    it 'two layers depending on multiple tables (this table is only used in one layer) -> partially dependent' do
      @first_layer.user_table_ids = [@user_table.id, @other_table.id]
      @second_layer.user_table_ids = [@other_table.id]

      @dependent_test_object.fully_dependent_visualizations.any?.should be_false
      @dependent_test_object.partially_dependent_visualizations.any?.should be_true
    end
  end
end
