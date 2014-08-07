class Api::Json::UsersController < Api::ApplicationController
  skip_before_filter :api_authorization_required, only: [:get_authenticated_users]
  ssl_required :get_authenticated_users

  if Rails.env.production? || Rails.env.staging?
    ssl_required :show
  end

  def show
    user = current_user
    render json: user.data
  end

  def get_authenticated_users
    subdomain = nil
    organization_username = nil
    users_intersection = []
    dashboard_urls = []
    dashboard_base_url = ''
    username = nil
    can_fork = false

    authenticated_users = request.session.select {|k,v| k.start_with?("warden.user")}.values
    referer = request.env["HTTP_REFERER"]
    referer_match = /https?:\/\/([\w\-\.]+)(:[\d]+)?(\/(u\/([\w\-\.]+)))?/.match(referer)

    if referer_match.nil?
      render status: 400 and return
    else
      subdomain = referer_match[1].gsub(CartoDB.session_domain, '')
      organization_username = referer_match[5]
    end

    unless authenticated_users.empty?
      # It doesn't have a organization username component
      # We assume it's not a organization referer
      if organization_username.nil?
        # The user is seeing its own dashboard
        if authenticated_users.include?(subdomain)
          dashboard_base_url = CartoDB.base_url(subdomain)
          username = authenticated_users.first
        # The user is authenticated but seeing another user dashboard
        else
          user_belongs_to_organization = CartoDB::UserOrganization.user_belongs_to_organization?(authenticated_users.first)
          # The first user in session does not belong to any organization
          if user_belongs_to_organization.nil?
            dashboard_base_url = CartoDB.base_url(authenticated_users.first)
          else
            dashboard_base_url = CartoDB.base_url(user_belongs_to_organization, authenticated_users.first)
            username = authenticated_users.first
          end
        end
      else
        # The user is seeing its own organization dashboard
        if authenticated_users.include?(organization_username)
          dashboard_base_url = CartoDB.base_url(subdomain, organization_username)
          can_fork = can_org_user_fork_resource(referer, User.where(username: authenticated_users.first).first)
          username = authenticated_users.first
        # The user is seeing a organization dashboard, but not its one
        else
          # Get all users on the referer organization and intersect with the authenticated users list
          requested_organization_users = User.select(:username)
                                          .from('users', 'organizations')
                                          .where("organizations.id=users.organization_id and organizations.name='#{subdomain}'")
                                          .collect(&:username)
          users_intersection = requested_organization_users & authenticated_users
          # The user is authenticated with a user of the organization
          if !users_intersection.empty?
            dashboard_base_url = CartoDB.base_url(subdomain, users_intersection.first)
            can_fork = can_org_user_fork_resource(referer, User.where(username: users_intersection.first).first)
            username = users_intersection.first
          # The user is authenticated with a user not belonging to the requested organization dashboard
          # Let's get the first user in the session
          else
            user_belongs_to_organization = CartoDB::UserOrganization.user_belongs_to_organization?(authenticated_users.first)
            # The first user in session does not belong to any organization
            if user_belongs_to_organization.nil?
              dashboard_base_url = CartoDB.base_url(authenticated_users.first)
            else
              dashboard_base_url = CartoDB.base_url(user_belongs_to_organization, authenticated_users.first)
            end
          end
        end
      end
      unless dashboard_base_url.empty?
        dashboard_urls << "#{dashboard_base_url}/dashboard"
      end
    end

    render json: {
      urls: dashboard_urls,
      can_fork: can_fork,
      username: username
    }

  end

  private

  # get visualization from url
  def can_org_user_fork_resource(url, current_user)
    referer_match = /tables\/([^\/]+)\/public/.match(url)
    res = nil
    if referer_match.nil?
      referer_match = /viz\/([^\/]+)/.match(url)
      unless referer_match.nil?
        res = referer_match[1]

        # If has schema, remove it
        if res =~ /\./
          res = res.split('.').reverse.first
        end

        vis = CartoDB::Visualization::Collection.new.fetch(
          id: res,
          user_id: current_user.id
        ).first
        if vis.nil?
          false
        else
          vis.related_tables.map { |t|
            t.table_visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READONLY)
          }.all?
        end
      end
    else
      #a public table always can be forked by org user
      true
    end
  end

end
