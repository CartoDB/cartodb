class Carto::Api::UserPresenter

  def initialize(user)
    @user = user
  end

  def to_poro
    return {} if @user.nil?
    {
        id:         @user.id,
        username:   @user.username,
        avatar_url: @user.avatar_url,
        base_url:   @user.public_url
    }
  end

end
