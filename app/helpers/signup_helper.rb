module SignupHelper
  def duplicated_username_prompt?
    # Ask for a different username for Google or GitHub signups with username errors
    only_username_errors? && (google_sign_in? || github_sign_in?)
  end

  def only_username_errors?
    errors = @user.try(:errors)
    return false unless errors.present?
    @user.errors.select { |_, v| v.present? }.keys == [:username]
  end

  def google_sign_in?
    @user.google_sign_in && @organization.auth_google_enabled
  end

  def github_sign_in?
    @user.github_user_id && @organization.auth_github_enabled
  end

  def organization_signup_url
    subdomain = CartoDB.subdomain_from_request(request)

    CartoDB.base_url(subdomain) + signup_path if Carto::Organization.where(name: subdomain).any?
  end
end
