# coding: UTF-8
require_relative '../../../models/visualization/presenter'

class Api::Json::TablesController < Api::ApplicationController
  ssl_required :index, :show, :create, :update, :destroy
  skip_before_filter :api_authorization_required, :only => [ :vizzjson ]

  before_filter :load_table, :except => [:index, :create, :vizzjson]
  before_filter :set_start_time
  #before_filter :link_ghost_tables

  def index
    @tables = unless params[:tag_name].blank?
      tag_name = CGI::unescape(params[:tag_name]).sanitize_sql

      Table.fetch("select user_tables.*,
                      array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id),',') as tags_names
                          from user_tables, tags
                          where user_tables.user_id = ?
                          and user_tables.id = tags.table_id
                          and tags.name = ? order by user_tables.id desc", current_user.id, tag_name)
    else
      Table.select("*, array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id),',') as tags_names".lit)
        .where(:user_id => current_user.id).order(:id.desc)
    end

    @tables = @tables.search(params[:q]) unless params[:q].blank?

    page     = params[:page].to_i > 0 ? params[:page].to_i : 1
    per_page = params[:per_page].to_i > 0 ? params[:per_page].to_i : 1000
    render_jsonp({ :tables => @tables.paginate(page, per_page).all.map { |t| t.public_values(except: [ :schema, :geometry_types ]) },
                   :total_entries => @tables.count })
  end

  # Very basic controller method to simply make blank tables
  # All other table creation things are controlled via the imports_controller#create
  def create
    @table = Table.new
    @table.user_id        = current_user.id
    @table.name           = params[:name]          if params[:name]
    @table.description    = params[:description]   if params[:description]
    @table.the_geom_type  = params[:the_geom_type] if params[:the_geom_type]
    @table.force_schema   = params[:schema]        if params[:schema]
    @table.tags           = params[:tags]          if params[:tags]
    @table.import_from_query = params[:from_query]  if params[:from_query]

    if @table.valid? && @table.save
      @table = Table.fetch("select *, array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id),',') as tags_names
                            from user_tables
                            where id=?",@table.id).first
      render_jsonp(@table.public_values, 200, { location: "/tables/#{@table.id}" })
    else
      CartoDB::Logger.info "Error on tables#create", @table.errors.full_messages
      render_jsonp( { :description => @table.errors.full_messages,
                      :stack => @table.errors.full_messages
                    }, 400)
    end
  end

  def show
    respond_to do |format|
      format.csv do
        send_data @table.to_csv,
          :type => 'application/zip; charset=binary; header=present',
          :disposition => "attachment; filename=#{@table.name}.zip"
      end
      format.shp do
        send_data @table.to_shp,
          :type => 'application/octet-stream; charset=binary; header=present',
          :disposition => "attachment; filename=#{@table.name}.zip"
      end
      format.kml or format.kmz do
        send_data @table.to_kml,
          :type => 'application/vnd.google-earth.kml+xml; charset=binary; header=present',
          :disposition => "attachment; filename=#{@table.name}.kmz"
      end
      format.json do
        render_jsonp(@table.public_values.merge(schema: @table.schema(reload: true)))
      end
    end
  end

  def update
    warnings = []

    # Perform name validations
    # TODO move this to the model!
    unless params[:name].nil?
      if params[:name].downcase != @table.name
        owner = User.select(:id,:database_name,:crypted_password,:quota_in_bytes,:username, :private_tables_enabled, :table_quota).filter(:id => current_user.id).first
        if params[:name] =~ /^[0-9_]/
          raise "Table names can't start with numbers or dashes."
        elsif owner.tables.filter(:name.like(/^#{params[:name]}/)).select_map(:name).include?(params[:name].downcase)
          raise "Table '#{params[:name].downcase}' already exists."
        else
          @table.set_all(:name => params[:name].downcase)
          @table.save(:name)
        end
      end
    end

    @table.set_except(params, :name)
    if params.keys.include?("latitude_column") && params.keys.include?("longitude_column")
      latitude_column  = params[:latitude_column]  == "nil" ? nil : params[:latitude_column].try(:to_sym)
      longitude_column = params[:longitude_column] == "nil" ? nil : params[:longitude_column].try(:to_sym)
      @table.georeference_from!(:latitude_column => latitude_column, :longitude_column => longitude_column)
      render_jsonp(@table.public_values.merge(warnings: warnings)) and return
    end
    @table.tags = params[:tags] if params[:tags]
    if @table.update(@table.values.delete_if {|k,v| k == :tags_names}) != false
      @table = Table.fetch("select *, array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id),',') as tags_names
                            from user_tables
                            where id=?",@table.id).first

      render_jsonp(@table.public_values.merge(warnings: warnings))
    else
      render_jsonp({ :errors => @table.errors.full_messages}, 400)
    end
  rescue => e
    CartoDB::Logger.info e.class.name, e.message
    render_jsonp({ :errors => [translate_error(e.message.split("\n").first)] }, 400) and return
  end

  def destroy
    @table.destroy
    head :no_content
  end

  def vizzjson
    @table = Table.find_by_subdomain(request.subdomain, params[:id])
    if @table.present? && (@table.public? || (current_user.present? && @table.owner.id == current_user.id))
      response.headers['X-Cache-Channel'] = "#{@table.varnish_key}:vizjson"
      response.headers['Cache-Control']   = "no-cache,max-age=86400,must-revalidate, public"
      render_jsonp({})
    else
      head :forbidden
    end
  end

  protected

  def load_table
    @table = Table.find_by_identifier(current_user.id, params[:id])
  end
end

