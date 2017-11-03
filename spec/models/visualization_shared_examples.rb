# requires implementing build_visualization
shared_examples_for 'visualization models' do
  describe '#password' do
    it 'checks that when using password protected type, encrypted password is generated and stored correctly' do
      password_value = '123456'
      password_second_value = '456789'

      visualization = build_visualization(type: Visualization::Member::TYPE_DERIVED)
      visualization.privacy = Visualization::Member::PRIVACY_PROTECTED

      visualization.password = password_value
      visualization.has_password?.should be_true
      visualization.password_valid?(password_value).should be_true

      # Shouldn't remove the password, and be equal
      visualization.password = ''
      visualization.has_password?.should be_true
      visualization.password_valid?(password_value).should be_true
      visualization.password = nil
      visualization.has_password?.should be_true
      visualization.password_valid?(password_value).should be_true

      # Modify the password
      visualization.password = password_second_value
      visualization.has_password?.should be_true
      visualization.password_valid?(password_second_value).should be_true
      visualization.password_valid?(password_value).should be_false

      # Test removing the password, should work
      # :remove_password doesn't need to be public, so in the new model it's kept private. :send is needed here, then.
      visualization.send(:remove_password)
      visualization.has_password?.should be_false
      visualization.password_valid?(password_value).should be_false
    end
  end
end
