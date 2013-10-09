# encoding: utf-8
require 'json'
require_relative '../../../models/synchronization/member'
require_relative '../../../models/synchronization/collection'

class Api::Json::SynchronizationsController < Api::ApplicationController
  include CartoDB

  ssl_required :index, :show, :create, :update, :destroy

  def index
    collection = Synchronization::Collection.new.fetch
    representation = collection.map(&:to_hash)
    response  = {
      synchronizations: representation,
      total_entries:    collection.total_entries
    }
    render_jsonp(response)
  end

  def create
    member = Synchronization::Member.new(
      payload.merge(
        name:       params[:table_name],
        user_id:    current_user.id,
        state:      'created'
      )
    )

    options = { 
      user_id:            current_user.id,
      table_name:         params[:table_name].presence,
      data_source:        params[:url],
      synchronization_id: member.id
    }
      
    data_import = DataImport.create(options)
    ::Resque.enqueue(::Resque::ImporterJobs, job_id: data_import.id)

    member.store
    collection      = Synchronization::Collection.new.fetch
    collection.add(member)
    collection.store

    response = {
      data_import: { 
        endpoint:       "/api/v1/imports",
        item_queue_id:  data_import.id
      }
    }.merge(member.to_hash)

    render_jsonp(response)
  rescue CartoDB::InvalidMember => exception
    render_jsonp({ errors: member.full_errors }, 400)
    puts exception.to_s
    puts exception.backtrace
  end

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
  rescue KeyError => exception
    head(404)
  rescue CartoDB::InvalidMember => exception
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

  def payload
    request.body.rewind
    ::JSON.parse(request.body.read.to_s || String.new)
  end #payload
end

