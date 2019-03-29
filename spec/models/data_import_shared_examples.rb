# Including specs must define `:data_import_class`
shared_examples_for 'DataImport model' do
  describe 'validation' do
    before(:all) do
      @user = FactoryGirl.create(:valid_user)
    end

    after(:all) do
      @user.destroy if @user
    end

    it 'only allows valid collision strategies' do
      data_import = data_import_class.new(collision_strategy: 'wadus', user_id: @user.id)
      data_import.valid?.should be_false
      data_import.errors[:collision_strategy].should_not be_nil

      data_import = data_import_class.new(collision_strategy: DataImport::COLLISION_STRATEGY_SKIP, user_id: @user.id)
      data_import.valid?.should be_true
      data_import.errors[:collision_strategy].should be_empty
    end
  end
end
