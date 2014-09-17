# encoding: utf-8
require_relative '../../models/map/presenter'
require_relative '../../models/visualization/locator'

class Admin::VisualizationsController < ApplicationController
  ssl_allowed :embed_map, :public_map, :show_protected_embed_map, :public_table
  ssl_required :index, :show, :protected_embed_map, :protected_public_map, :show_protected_public_map
  before_filter :login_required, only: [:index]
  before_filter :table_and_schema_from_params, only: [:show, :public_table, :public_map, :show_protected_public_map, :show_protected_embed_map, :embed_map]
  skip_before_filter :browser_is_html5_compliant?, only: [:public_map, :embed_map, :track_embed, :show_protected_embed_map, :show_protected_public_map]
  skip_before_filter :verify_authenticity_token, only: [:show_protected_public_map, :show_protected_embed_map]

  def index
    @tables_count  = current_user.tables.count
    @first_time    = !current_user.dashboard_viewed?
    @just_logged_in = !!flash['logged']
    current_user.view_dashboard
    update_user_last_activity
  end #index

  def resolve_visualization_and_table(request)
    locator.get(@table_id, @schema || CartoDB.extract_subdomain(request))
  end

  def show
    unless current_user.present?
      if request.original_fullpath =~ %r{/tables/}
        return(redirect_to public_table_map_url(user_domain: request.params[:user_domain], id: request.params[:id]))
      else
        return(redirect_to public_visualizations_public_map_url(user_domain: request.params[:user_domain], id: request.params[:id]))
      end
    end

    @visualization, @table = resolve_visualization_and_table(request)
    return(pretty_404) unless @visualization

    unless @visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READWRITE)
      if request.original_fullpath =~ %r{/tables/}
        return(redirect_to public_table_map_url(user_domain: request.params[:user_domain], id: request.params[:id], redirected:true))
      else
        return(redirect_to public_visualizations_public_map_url(user_domain: request.params[:user_domain], id: request.params[:id], redirected:true))
      end
    end

    respond_to { |format| format.html }

    update_user_last_activity
  end #show

  def public_table
    @visualization, @table = resolve_visualization_and_table(request)

    return(pretty_404) if @visualization.nil? || @visualization.private?

    return(redirect_to public_visualizations_public_map_url(user_domain: request.params[:user_domain], id: request.params[:id])) \
      if @visualization.derived?

    if current_user.nil? && !request.params[:redirected].present?
      redirect_url = get_corrected_url_if_proceeds(for_table=true)
      unless redirect_url.nil?
        redirect_to redirect_url and return
      end
    end

    if @visualization.organization?
      unless current_user and @visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READONLY)
        return(embed_forbidden)
      end
    end

    return(redirect_to :protocol => 'https://') if @visualization.organization? and not (request.ssl? or request.local?)

    # Legacy redirect, now all public pages also with org. name
    if @visualization.user.has_organization? && !request.params[:redirected].present?
      if CartoDB.extract_real_subdomain(request) != @visualization.user.organization.name
        redirect_to CartoDB.base_url(@visualization.user.organization.name) << public_table_path( \
            user_domain: @visualization.user.username, \
            id: "#{params[:id]}", redirected:true) \
          and return
      end
    end

    @vizjson = @visualization.to_vizjson
    @auth_tokens = nil
    @use_https = false
    @api_key = nil
    @can_copy = false

    if current_user && @visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READONLY)
      if @visualization.organization?
        @auth_tokens = current_user.get_auth_tokens
        @use_https = true
        @api_key = current_user.api_key
      end
      @can_copy = true # this table can be copied to user dashboard
    end

    owner = @visualization.user
    # set user to current user only if the user is in the same organization
    # this allows to enable "copy this table to your tables" button
    if current_user && current_user.organization.present? && owner.organization.present? && current_user.organization_id == owner.organization_id
      @user = current_user
      response.headers['Cache-Control'] = "no-cache,private"
    else
      @user = @visualization.user
    end

    @name = @visualization.user.name.present? ? @visualization.user.name : @visualization.user.username.truncate(20)
    @avatar_url             = @visualization.user.avatar

    @user_domain = user_domain_variable(request)

    @disqus_shortname       = @visualization.user.disqus_shortname.presence || 'cartodb'
    @public_tables_count    = @visualization.user.table_count(::Table::PRIVACY_PUBLIC)

    @non_dependent_visualizations = @table.non_dependent_visualizations.select{
        |vis| vis.privacy == CartoDB::Visualization::Member::PRIVACY_PUBLIC
    }

    @dependent_visualizations = @table.dependent_visualizations.select{
        |vis| vis.privacy == CartoDB::Visualization::Member::PRIVACY_PUBLIC
    }

    @total_visualizations  = @non_dependent_visualizations + @dependent_visualizations
    
    @total_nonpublic_total_vis_count = @table.non_dependent_visualizations.select{
        |vis| vis.privacy != CartoDB::Visualization::Member::PRIVACY_PUBLIC
    }.count + @table.dependent_visualizations.select{
        |vis| vis.privacy != CartoDB::Visualization::Member::PRIVACY_PUBLIC
    }.count

    respond_to do |format|
      format.html { render 'public_table', layout: 'application_table_public' }
    end

  end

  def public_map
    @visualization, @table = resolve_visualization_and_table(request)

    return(pretty_404) unless @visualization

    if current_user.nil? && !request.params[:redirected].present?
      redirect_url = get_corrected_url_if_proceeds(for_table=false)
      unless redirect_url.nil?
        redirect_to redirect_url and return
      end
    end

    return(embed_forbidden) if @visualization.private?
    return(public_map_protected) if @visualization.password_protected?
    if current_user and @visualization.organization? and @visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READONLY)
      return(show_organization_public_map)
    end

    # Legacy redirect, now all public pages also with org. name
    if @visualization.user.has_organization? && !request.params[:redirected].present?
      if CartoDB.extract_real_subdomain(request) != @visualization.user.organization.name
        redirect_to CartoDB.base_url(@visualization.user.organization.name) << public_visualizations_public_map_path( \
            user_domain: @visualization.user.username, \
            id: "#{@visualization.user.organization.name}.#{params[:id]}", redirected:true) \
          and return
      end
    end

    response.headers['X-Cache-Channel'] = "#{@visualization.varnish_key}:vizjson"
    response.headers['Cache-Control']   = "no-cache,max-age=86400,must-revalidate, public"

    @name = @visualization.user.name.present? ? @visualization.user.name : @visualization.user.username.truncate(20)
    @avatar_url             = @visualization.user.avatar

    @disqus_shortname       = @visualization.user.disqus_shortname.presence || 'cartodb'
    @visualization_count    = @visualization.user.public_visualization_count
    @related_tables         = @visualization.related_tables
    @related_tables_usernames = Hash.new
    @related_tables.each { |table|
      unless @related_tables_usernames.include?(table.user_id)
        table_owner = User.where(id: table.user_id).first
        if table_owner.nil?
          # strange scenario, as user has been deleted but his table still exists
          @related_tables_usernames[table.user_id] = nil
        else
          @related_tables_usernames[table.user_id] = table_owner.username
        end
      end
    }

    @user_domain = user_domain_variable(request)

    @public_tables_count    = @visualization.user.table_count(::Table::PRIVACY_PUBLIC)
    @nonpublic_tables_count = @related_tables.select{|p| p.privacy != ::Table::PRIVACY_PUBLIC }.count

    respond_to do |format|
      format.html { render layout: false }
      format.js { render 'public_map', content_type: 'application/javascript' }
    end
  rescue
    embed_forbidden
  end #public_map

  def show_organization_public_map
    @visualization, @table = resolve_visualization_and_table(request)

    return(embed_forbidden) unless current_user and @visualization and @visualization.organization? and @visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READONLY)

    @can_fork = @visualization.related_tables.map { |t|
      t.table_visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READONLY)
    }.all?

    response.headers['Cache-Control'] = "no-cache,private"

    @protected_map_tokens = current_user.get_auth_tokens

    @name = @visualization.user.name.present? ? @visualization.user.name : @visualization.user.username.truncate(20)
    @avatar_url = @visualization.user.avatar

    @disqus_shortname       = @visualization.user.disqus_shortname.presence || 'cartodb'
    @visualization_count    = @visualization.user.public_visualization_count
    @related_tables         = @visualization.related_tables
    @public_tables_count    = @visualization.user.table_count(::Table::PRIVACY_PUBLIC)
    @nonpublic_tables_count = @related_tables.select{|p| p.privacy != ::Table::PRIVACY_PUBLIC }.count

    respond_to do |format|
      format.html { render 'public_map', layout: false }
    end
  end

  def show_organization_embed_map
    @visualization, @table = resolve_visualization_and_table(request)

    return(embed_forbidden) unless current_user and @visualization and @visualization.organization? and @visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READONLY)

    response.headers['X-Cache-Channel'] = "#{@visualization.varnish_key}:vizjson"
    response.headers['Cache-Control']   = "no-cache,max-age=86400,must-revalidate, public"

    @protected_map_tokens = current_user.get_auth_tokens

    respond_to do |format|
      format.html { render 'embed_map', layout: false }
    end
  end

  def show_protected_public_map
    submitted_password = params.fetch(:password)
    @visualization, @table = resolve_visualization_and_table(request)

    return(pretty_404) unless @visualization and @visualization.password_protected? and @visualization.has_password?

    unless @visualization.is_password_valid?(submitted_password)
      flash[:placeholder] = '*' * submitted_password.size
      flash[:error] = "Invalid password"
      return(embed_protected)
    end

    response.headers['X-Cache-Channel'] = "#{@visualization.varnish_key}:vizjson"
    response.headers['Cache-Control']   = "no-cache,max-age=86400,must-revalidate, public"

    @protected_map_tokens = @visualization.get_auth_tokens

    @name = @visualization.user.name.present? ? @visualization.user.name : @visualization.user.username.truncate(20)
    @avatar_url = @visualization.user.avatar

    @user_domain = user_domain_variable(request)

    @disqus_shortname       = @visualization.user.disqus_shortname.presence || 'cartodb'
    @visualization_count    = @visualization.user.public_visualization_count
    @related_tables         = @visualization.related_tables
    @public_tables_count    = @visualization.user.table_count(::Table::PRIVACY_PUBLIC)
    @nonpublic_tables_count = @related_tables.select{|p| p.privacy != ::Table::PRIVACY_PUBLIC }.count

    respond_to do |format|
      format.html { render 'public_map', layout: false }
    end    
  rescue
    public_map_protected
  end #show_protected_public_map

  def show_protected_embed_map
    submitted_password = params.fetch(:password)
    @visualization, @table = resolve_visualization_and_table(request)

    return(pretty_404) unless @visualization and @visualization.password_protected? and @visualization.has_password?

    unless @visualization.is_password_valid?(submitted_password)
      flash[:placeholder] = '*' * submitted_password.size
      flash[:error] = "Invalid password"
      return(embed_protected)
    end

    response.headers['Cache-Control']   = "no-cache, private"

    @protected_map_tokens = @visualization.get_auth_tokens

    respond_to do |format|
      format.html { render 'embed_map', layout: false }
    end    
  rescue
    embed_protected
  end #show_protected_embed_map

  def embed_map
    @visualization, @table = resolve_visualization_and_table(request)
    
    return(pretty_404) unless @visualization
    return(embed_forbidden) if @visualization.private?
    return(embed_protected) if @visualization.password_protected?
    if current_user and @visualization.organization? and @visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READONLY)
      return(show_organization_embed_map)
    end

    response.headers['X-Cache-Channel'] = "#{@visualization.varnish_key}:vizjson"
    response.headers['Cache-Control']   = "no-cache,max-age=86400,must-revalidate, public"

    respond_to do |format|
      format.html { render layout: false }
      format.js { render 'embed_map', content_type: 'application/javascript' }
    end
  rescue
    embed_forbidden
  end #embed_map

  # Renders input password view
  def embed_protected
    render 'embed_map_password', :layout => false
  end #embed_protected

  def public_map_protected
    render 'public_map_password', :layout => false
  end #public_map_protected

  def embed_forbidden
    render 'embed_map_error', layout: false, status: :forbidden
  end #embed_forbidden

  def track_embed
    response.headers['X-Cache-Channel'] = "embeds_google_analytics"
    response.headers['Cache-Control']   = "no-cache,max-age=86400,must-revalidate, public"
    render 'track', layout: false
  end #track_embed

  private

  # If user A shares to user B a table link (being both from same org), attept to rewrite the url to the correct format
  # Messing with sessions is bad so just redirect to newly formed url and let new request handle permissions/access
  def get_corrected_url_if_proceeds(for_table=true)
    url = nil
    if CartoDB.extract_subdomain(request) != CartoDB.extract_real_subdomain(request)
      # Might be an org url, try getting the org
      organization = Organization.where(name: CartoDB.extract_real_subdomain(request)).first
      unless organization.nil?
        authenticated_users = request.session.select { |k,v| k.start_with?("warden.user") }.values
        authenticated_users.each { |username|
          if url.nil? && !User.where(username:username).first.nil?
            if for_table
              url = public_tables_show_url(user_domain: username, id: "#{params[:user_domain]}.#{params[:id]}", redirected:true)
            else
              url = public_visualizations_show_url(user_domain: username, id: "#{params[:user_domain]}.#{params[:id]}", redirected:true)
            end
          end
        }
      end
    end
    url
  end

  def table_and_schema_from_params
    if params.fetch('id', nil) =~ /\./
      @table_id, @schema = params.fetch('id').split('.').reverse
    else
      @table_id, @schema = [params.fetch('id', nil), nil]
    end
  end

  def full_table_id
    id = @table_id
    if @schema
      id = @schema + "." + id
    end
    id
  end

  def public_url()
    if request.path_info =~ %r{/tables/}
      public_table_path(user_domain: params[:user_domain], id: full_table_id)
    else
      public_visualization_path(user_domain: params[:user_domain], id: full_table_id)
    end
  end #public_url_for

  def public_map_url()
    if request.path_info =~ %r{/tables/}
      public_table_map_path(user_domain: params[:user_domain], id: full_table_id)
    else
      public_visualizations_public_map_path(user_domain: params[:user_domain], id: full_table_id)
    end
  end #public_map_url_for

  def embed_map_url_for(id)
    if request.path_info =~ %r{/tables/}
      public_tables_embed_map_path(user_domain: params[:user_domain], id: id)
    else
      public_visualizations_embed_map_path(user_domain: params[:user_domain], id: id)
    end
  end #embed_map_url_for

  def download_formats(table, format)
    format.sql  { send_data table.to_sql, data_for(table, 'zip', 'zip') }
    format.kml  { send_data table.to_kml, data_for(table, 'zip', 'kmz') }
    format.csv  { send_data table.to_csv, data_for(table, 'zip', 'zip') }
    format.shp  { send_data table.to_shp, data_for(table, 'octet-stream', 'zip') }
  end

  def data_for(table, type, extension)
    { 
      type:         "application/#{type}; charset=binary; header=present",
      disposition:  "attachment; filename=#{table.name}.#{extension}"
    }
  end

  def update_user_last_activity
    return false unless current_user.present?
    current_user.set_last_active_time
    current_user.set_last_ip_address request.remote_ip
  end

  def pretty_404
    render(file: "public/404", layout: false, status: 404)
  end #pretty_404

  def user_domain_variable(request)
    if params[:user_domain].present?
      CartoDB.extract_real_subdomain(request) != params[:user_domain] ? params[:user_domain] : nil
    else
      nil
    end
  end

  def locator
    CartoDB::Visualization::Locator.new
  end #locator
end # VisualizationsController
