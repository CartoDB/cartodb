# encoding: utf-8


module CartoDB
  class PermissionUserPresenter

    def decorate(user_id)
      decorate_user(User.where(id: user_id).first)
    end

    def decorate_user(user)
      return {} if user.nil?
      {
        id:         user.id,
        username:   user.username,
        avatar_url: user.avatar_url,
        base_url: user.public_url
      }
    end

  end
end

