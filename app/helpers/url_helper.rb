module UrlHelper
  def current_user_url(path, params = {})
    CartoDB.url(self, path, params, current_user)
  end
end
