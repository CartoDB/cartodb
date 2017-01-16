module SignupHelper
  def duplicated_username_prompt?
    # Ask for a different username for Google or GitHub signups with username errors
    @user.try(:errors).try(:[], :username).present? && (google_sign_in? || github_sign_in?)
  end

  def google_sign_in?
    @user.google_sign_in && @organization.auth_google_enabled
  end

  def github_sign_in?
    @user.github_user_id && @organization.auth_github_enabled
  end
end
