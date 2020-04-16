require_relative '../../controllers/carto/api/group_presenter'

module CartoDB
  class PermissionUserPresenter

    def decorate(user_id)
      decorate_user(::User.where(id: user_id).first)
    end

    def decorate_user(user)
      return {} if user.nil?
      {
        id: user.id,
        name: user.name,
        last_name: user.last_name,
        username: user.username,
        avatar_url: user.avatar_url,
        website: user.website,
        description: user.description,
        location: user.location,
        twitter_username: user.twitter_username,
        disqus_shortname: user.disqus_shortname,
        role_display: user.role_display,
        available_for_hire: user.available_for_hire,
        base_url: user.public_url,
        google_maps_query_string: user.google_maps_query_string,
        viewer: user.viewer,
        org_admin: user.organization_admin?,
        groups: user.groups ? user.groups.map { |g| Carto::Api::GroupPresenter.new(g).to_poro } : [],
        org_user: user.organization_id.present?,
        remove_logo: user.remove_logo?
      }
    end

  end
end
