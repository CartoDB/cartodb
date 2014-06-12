# encoding: utf-8


module CartoDB
  class PermissionUserPresenter

    def decorate(user_id)
      user = User.where(id: user_id).first
      return {} if user.nil?
      {
          id:         user.id,
          username:   user.username,
          avatar_url: user.avatar_url
      }
    end

  end
end

