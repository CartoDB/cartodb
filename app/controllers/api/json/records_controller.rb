# coding: UTF-8

class Api::Json::RecordsController < Api::ApplicationController
  ssl_required :index, :create, :show, :update, :destroy, :show_column, :update_column, :pending_addresses

  REJECT_PARAMS = %W{ format controller action id row_id requestId column_id api_key table_id oauth_token oauth_token_secret }

  before_filter :load_table, :set_start_time
  after_filter :record_query_threshold
  
  def index
    render :json =>  Yajl::Encoder.encode(@table.records(params.slice(:page, :rows_per_page))),
           :callback => params[:callback]
  end

  def create
    primary_key = @table.insert_row!(params.reject{|k,v| REJECT_PARAMS.include?(k)}.symbolize_keys)
    respond_to do |format|
      format.json do
        render :json => {:id => primary_key}.to_json, :status => 200, :callback => params[:callback]
      end
    end
  rescue => e
    puts $!
    render :json => { :errors => [$!] }.to_json, :status => 400,
           :callback => params[:callback]
  end

  def show
    render :json => @table.record(params[:id]).to_json,
           :callback => params[:callback]
  rescue => e
    render :json => { :errors => ["Record #{params[:id]} not found"] }.to_json, :status => 404,
           :callback => params[:callback]
  end

  def update
    unless params[:id].blank?
      begin
        resp = @table.update_row!(params[:id], params.reject{|k,v| REJECT_PARAMS.include?(k)}.symbolize_keys)
        if resp > 0
          render :nothing => true, :status => 200
        else
          render :json => { :errors => ["row identified with #{params[:id]} not found"] }.to_json,
                 :status => 404, :callback => params[:callback] and return
        end
      rescue => e
        render :json => { :errors => [translate_error(e.message.split("\n").first)] }.to_json, :status => 400,
               :callback => params[:callback] and return
      end
    else
      render :json => { :errors => ["id can't be blank"] }.to_json,
             :status => 404, :callback => params[:callback] and return
    end
  end

  def destroy
    if params[:id]
      current_user.in_database do |user_database|
        user_database.run("delete from #{@table.name} where cartodb_id = #{params[:id].sanitize_sql}")
      end
      render :nothing => true,
             :callback => params[:callback], :status => 200
    else
      render :json => { :errors => ["row identified with #{params[:id]} not found"] }.to_json,
             :status => 404, :callback => params[:callback] and return
    end
  end

  def show_column
    render :json => current_user.run_query("select #{params[:id].sanitize_sql} from #{@table.name} where cartodb_id = #{params[:record_id].sanitize_sql}")[:rows].first.to_json,
           :status => 200
  end

  def update_column
    @table.update_row!(params[:record_id], {params[:id].to_sym => params[:value]})
    render :json => {params[:id] => params[:value]}.to_json,
           :status => 200
  end
  
  def pending_addresses
    records = @table.get_records_with_pending_addresses(:page => params[:page], :rows_per_page => params[:rows_per_page])
    render :json => records.to_json,
           :status => 200
  end
  
  protected

  def load_table
    @table = Table.filter(:user_id => current_user.id, :name => params[:table_id]).first
    raise RecordNotFound if @table.nil?
  end

  def record_query_threshold
    if response.ok?
      case action_name
        when "index", "show", "show_column"
          CartoDB::QueriesThreshold.incr(current_user.id, "select", Time.now - @time_start)
        when "create"
          CartoDB::QueriesThreshold.incr(current_user.id, "insert", Time.now - @time_start)
        when "update", "update_column"
          CartoDB::QueriesThreshold.incr(current_user.id, "update", Time.now - @time_start)
        when "destroy"
          CartoDB::QueriesThreshold.incr(current_user.id, "delete", Time.now - @time_start)
      end
    end
  end
end