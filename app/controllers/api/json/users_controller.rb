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
    referer = request.env["HTTP_REFERER"]
    referer_match = /https?:\/\/([\w\-\.]+)(:[\d]+)?(\/((u|user)\/([\w\-\.]+)))?/.match(referer)
    if referer_match.nil?
      render json: { error: "Referer #{referer} does not match" }, status: 400 and return
    end

    if current_viewer.nil?
      render json: {
                     urls: [],
                     can_fork: false,
                     username: nil,
                     avatar_url: nil
                   } and return
    end

    subdomain = referer_match[1].gsub(CartoDB.session_domain, '').downcase

    # referer_match[6] == username
    referer_organization_username = referer_match[6]

    get_organization_name_and_fork_feature(current_viewer, referer, subdomain, referer_organization_username)
  end

  private

  def get_organization_name_and_fork_feature(user, referrer, subdomain, referrer_organization_username=nil)
    organization_name = nil

    can_fork = can_user_fork_resource(referrer, user)

    # It doesn't have a organization username component. We assume it's not a organization referer
    if referrer_organization_username.nil?
      # The user is authenticated but seeing another user dashboard
      if user.username != subdomain
        organization_name = CartoDB::UserOrganization.user_belongs_to_organization?(user.username)
      end
    else
      referrer_organization_username = referrer_organization_username.downcase

      # The user is seeing its own organization dashboard
      if user.username == referrer_organization_username
        organization_name = subdomain
        # The user is seeing a organization dashboard, but not its one
      else
        # Authenticated with a user of the organization
        if user.organization && user.organization.name == subdomain
          organization_name = subdomain
          # The user is authenticated with a user not belonging to the requested organization dashboard
          # Let's get the first user in the session
        else
          organization_name = CartoDB::UserOrganization.user_belongs_to_organization?(user.username)
          can_fork = false
        end
      end
    end

    render json: {
      urls: ["#{CartoDB.base_url(current_viewer.username, organization_name)}#{CartoDB.path(self, 'dashboard_bis')}"],
      can_fork: can_fork,
      username: current_viewer.username,
      name: current_viewer.name_or_username,
      avatar_url: current_viewer.avatar_url,
      email: current_viewer.email,
      organization: current_viewer.organization.nil? ? nil : current_viewer.organization.to_poro,
      base_url: current_viewer.public_url,
    }
  end

  # get visualization from url
  def can_user_fork_resource(url, current_user)
    referer_match = /tables\/([^\/]+)\/public/.match(url)
    if referer_match.nil?
      referer_match = /viz\/([^\/]+)/.match(url)
      unless referer_match.nil?
        res = referer_match[1]

        # If has schema, remove it
        if res =~ /\./
          res = res.split('.').reverse.first
        end

        vis = CartoDB::Visualization::Collection.new.fetch(
          id:             res,
          user_id:        current_user.id,
          exclude_raster: true
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
