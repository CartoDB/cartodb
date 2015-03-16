# encoding: utf-8


module CartoDB
  class PermissionUserPresenter

    def decorate(user_id, options)
      decorate_user(User.where(id: user_id).first, options)
    end

    def decorate_user(user, options)
      return {} if user.nil?
      {
          id:         user.id,
          username:   user.username,
          avatar_url: user.avatar_url,
          # For now, don't add complexity to frontend
          base_url:   CartoDB.is_domainless?(options[:request]) ? user.domainless_public_url : user.public_url
      }
    end

  end
end

