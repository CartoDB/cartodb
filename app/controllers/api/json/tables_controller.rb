# coding: UTF-8

class Api::Json::TablesController < Api::ApplicationController
  ssl_required :index, :show, :create, :update, :destroy, :set_infowindow, :duplicate, :set_map_metadata, :get_map_metadata

  before_filter :load_table, :except => [:index, :create]
  before_filter :set_start_time
  after_filter  :record_query_threshold
   before_filter :link_ghost_tables

  def index
    @tables = unless params[:tag_name].blank?
      tag_name = params[:tag_name].sanitize.tr('_',' ')
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
    render_jsonp({ :tables => @tables.paginate(page, per_page).all.map(&:public_values),
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
      render_jsonp(@table.public_values, 200, { :location => table_path(@table) })
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
        render_jsonp(@table.public_values)
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
    if @table.update(@table.values.delete_if {|k,v| k == :tags_names})
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

  # expects the infowindow data in the infowindow parameter
  def set_infowindow
    @table.infowindow = params[:infowindow]
    head :ok
  end

  def set_map_metadata
    @table.map_metadata = params[:map_metadata]
    head :ok
  end

  #todo: replace with windshaft
  def get_map_metadata
    render_jsonp({:map_metadata => @table.map_metadata})
  end

  protected

  def load_table
    @table = Table.find_by_identifier(current_user.id, params[:id])
  end

  def record_query_threshold
    if [200, 204].include?(response.status)
      case action_name
        when "create"
          CartoDB::QueriesThreshold.incr(current_user.id, "other", Time.now - @time_start)
        when "destroy"
          CartoDB::QueriesThreshold.incr(current_user.id, "other", Time.now - @time_start)
      end
    end
  end

end
