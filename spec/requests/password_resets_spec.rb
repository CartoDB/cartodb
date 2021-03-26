require_relative '../spec_helper_min'

feature "Forgot password" do

  before(:all) do
    @user = create(:user)
  end

  before(:each) do
    visit login_path
    click_link 'Forgot?'
    fill_in 'email', with: @user.email
  end

  after(:all) do
    @user.destroy
  end

  scenario "Reset password view shows an error if the email is blank" do
    fill_in 'email', with: ''
    click_button "Send"

    page.should have_css "[data-content=\"Email cannot be blank.\"]"
  end

  scenario "Reset password view redirects to the right page if the email does not exist" do
    fill_in 'email', with: 'notfound@example.com'
    click_button "Send"

    page.should have_content("Ok, we have sent you an email")
  end

  scenario "Reset password redirects to the right view" do
    click_button "Send"

    page.should have_content("Ok, we have sent you an email")
  end

  scenario "Reset password link allows to change the password" do
    click_button "Send"

    @user.reload # so password_reset_token is loaded

    visit edit_password_reset_path(@user.password_reset_token)

    original_crypted_password = @user.crypted_password

    fill_in "carto_user_password", with: "newpass"
    fill_in "carto_user_password_confirmation", with: "newpass"
    click_button "Save"

    @user.reload # so password is loaded
    @user.crypted_password.should_not eql original_crypted_password
  end

  scenario "It shows the right view after changing the password" do
    click_button "Send"

    @user.reload # so password_reset_token is loaded

    visit edit_password_reset_path(@user.password_reset_token)

    fill_in "carto_user_password", with: "newpass2"
    fill_in "carto_user_password_confirmation", with: "newpass2"
    click_button "Save"

    current_path.should == changed_password_reset_path
    page.should have_content("Your password has been updated successfully")
  end

  scenario "Change password view shows an error when token has expired (>48h)" do
    Delorean.time_travel_to("49 hours ago") do
      click_button "Send"
    end

    Delorean.back_to_the_present
    @user.reload # so password_reset_token is loaded

    visit edit_password_reset_path(@user.password_reset_token)

    original_crypted_password = @user.crypted_password

    fill_in "carto_user_password", with: "newpass"
    fill_in "carto_user_password_confirmation", with: "newpass"
    click_button "Save"

    page.should have_css "[data-content='Password reset has expired.']"
    current_path.should == new_password_reset_path

    @user.reload.crypted_password.should == original_crypted_password
  end

  scenario "Change password view shows an error when the passwords do not match" do
    click_button "Send"

    @user.reload # so password_reset_token is loaded

    visit edit_password_reset_path(@user.password_reset_token)

    original_crypted_password = @user.crypted_password

    fill_in "carto_user_password", with: "newpass"
    fill_in "carto_user_password_confirmation", with: "newpa"
    click_button "Save"

    page.should have_css "[data-content='Please ensure your passwords match.']"

    @user.reload.crypted_password.should == original_crypted_password
  end
end
