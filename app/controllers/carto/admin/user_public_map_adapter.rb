class Carto::Admin::UserPublicMapAdapter
  extend Forwardable

  delegate [ :name, :username, :disqus_shortname, :avatar, :remove_logo?, :has_organization?, :organization, :twitter_username, :public_url, :subdomain, :organization_username ] => :user

  attr_reader :user

  def initialize(user)
    @user = user
  end

  def public_table_count
    @public_table_count ||= Carto::VisualizationQueryBuilder.user_public_tables(@user).build.count
  end

  def public_visualization_count
    @public_visualization_count ||= Carto::VisualizationQueryBuilder.user_public_visualizations(@user).build.count
  end

end
