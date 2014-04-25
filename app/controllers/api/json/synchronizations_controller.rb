# encoding: utf-8
require 'json'
require_relative '../../../models/synchronization/member'
require_relative '../../../models/synchronization/collection'
require_relative '../../../../services/datasources/lib/datasources'

class Api::Json::SynchronizationsController < Api::ApplicationController
  include CartoDB

  ssl_required :index, :show, :create, :update, :destroy

  def index
    collection = Synchronization::Collection.new.fetch(user_id: current_user.id)
    representation = collection.map(&:to_hash)
    response  = {
      synchronizations: representation,
      total_entries:    collection.total_entries
    }
    render_jsonp(response)
  end

  def create
    member_attributes = payload.merge(
        name:       params[:table_name],
        user_id:    current_user.id,
        state:      Synchronization::Member::STATE_CREATED
    )

    if from_sync_file_provider?
      member_attributes = member_attributes.merge({
              service_name: params[:service_name],
              service_item_id: params[:service_item_id]
          })
      service_name = params[:service_name]
      service_item_id = params[:service_item_id]
    else
      service_name = CartoDB::Datasources::Url::PublicUrl::DATASOURCE_NAME
      service_item_id = params[:url].presence
    end

    member = Synchronization::Member.new(member_attributes)

    options = {
      user_id:            current_user.id,
      table_name:         params[:table_name].presence,
      data_source:        params[:url],
      synchronization_id: member.id,
      service_name:       service_name,
      service_item_id:    service_item_id
    }
      
    data_import = DataImport.create(options)
    ::Resque.enqueue(::Resque::ImporterJobs, job_id: data_import.id)

    member.store
    collection      = Synchronization::Collection.new.fetch
    collection.add(member)
    collection.store

    response = {
      data_import: { 
        endpoint:       '/api/v1/imports',
        item_queue_id:  data_import.id
      }
    }.merge(member.to_hash)

    render_jsonp(response)
  rescue CartoDB::InvalidMember => exception
    render_jsonp({ errors: member.full_errors }, 400)
    puts exception.to_s
    puts exception.backtrace
  end

  def sync(from_sync_now=false)
    enqueued = false
    member = Synchronization::Member.new(id: params[:id]).fetch
    return head(401) unless member.authorize?(current_user)

    if member.should_auto_sync? || (from_sync_now && member.can_manually_sync?)
      enqueued = true
      member.enqueue
    end

    render_jsonp( { enqueued: enqueued, synchronization_id: member.id})
  rescue KeyError => exception
    puts exception.message + "\n" + exception.backtrace
    head(404)
  rescue => exception
    CartoDB.notify_exception(exception)
    puts exception.message + "\n" + exception.backtrace
    head(404)
  end #sync

  def sync_now
    return sync(true)
  end #sync_now

  def syncing?
    member = Synchronization::Member.new(id: params[:id]).fetch
    return head(401) unless member.authorize?(current_user)

    render_jsonp( { state: member.state } )
  rescue KeyError => exception
    puts exception.message + "\n" + exception.backtrace
    head(404)
  end #syncing?

  def show
    member = Synchronization::Member.new(id: params[:id]).fetch

    return(head 401) unless member.authorize?(current_user)
    render_jsonp(member)
  rescue KeyError => exception
    puts exception.to_s
    puts exception.backtrace
    head(404)
  end

  def update
    member = Synchronization::Member.new(id: params.fetch('id')).fetch
    return head(401) unless member.authorize?(current_user)

    member.attributes = payload
    member.store.fetch
    render_jsonp(member)
  rescue KeyError
    head(404)
  rescue CartoDB::InvalidMember
    render_jsonp({ errors: member.full_errors }, 400)
  end

  def destroy
    member = Synchronization::Member.new(id: params.fetch('id')).fetch
    return(head 401) unless member.authorize?(current_user)

    member.delete
    return head 204
  rescue KeyError
    head(404)
  end

  private

  def from_sync_file_provider?
    params.include?(:service_name) && params.include?(:service_item_id)
  end #from_sync_file_provider?

  def payload
    request.body.rewind
    ::JSON.parse(request.body.read.to_s || String.new)
  end #payload
end

