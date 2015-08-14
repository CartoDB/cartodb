# encoding: utf-8
require 'json'
require_relative '../../../models/synchronization/member'
require_relative '../../../models/synchronization/collection'
require_relative '../../../../services/datasources/lib/datasources'
require_relative '../../../../services/platform-limits/platform_limits'

class Api::Json::SynchronizationsController < Api::ApplicationController
  include CartoDB

  ssl_required :create, :update, :destroy, :sync, :sync_now

  # Upon creation, no rate limit checks
  def create
    external_source = nil

    # Keep in sync with http://docs.cartodb.com/cartodb-platform/import-api.html#params-4
    type_guessing_param    = !["false", false].include?(params[:type_guessing])
    quoted_fields_guessing_param  = !["false", false].include?(params[:quoted_fields_guessing])
    content_guessing_param = ["true", true].include?(params[:content_guessing])

    create_derived_vis = ["true", true].include?(params[:create_vis])

    member_attributes = payload.merge(
        name:                   params[:table_name],
        user_id:                current_user.id,
        state:                  Synchronization::Member::STATE_CREATED,
        type_guessing:          type_guessing_param,
        quoted_fields_guessing: quoted_fields_guessing_param,
        content_guessing:       content_guessing_param
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

    options = {
      user_id:                current_user.id,
      table_name:             params[:table_name].presence,
      service_name:           service_name,
      service_item_id:        service_item_id,
      type_guessing:          type_guessing_param,
      quoted_fields_guessing: quoted_fields_guessing_param,
      content_guessing:       content_guessing_param,
      create_visualization:   create_derived_vis
    }

    if params[:remote_visualization_id].present?
      member_attributes[:interval] = Carto::ExternalSource::REFRESH_INTERVAL
      external_source = get_external_source(params[:remote_visualization_id])
      member_attributes.merge!( {
        url: external_source.import_url.presence,
        service_item_id: external_source.import_url.presence
        } )
      options.merge!( { data_source: external_source.import_url.presence } )
    else
      options.merge!({ data_source: params[:url] })
    end

    member = Synchronization::Member.new(member_attributes)
    member.store

    options.merge!({ synchronization_id: member.id })

    data_import = DataImport.create(options)


    if external_source.present?
      ExternalDataImport.new(data_import.id, external_source.id, member.id).save
    end

    ::Resque.enqueue(::Resque::ImporterJobs, job_id: data_import.id)


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
  rescue CartoDB::InvalidInterval => exception
    render_jsonp({ errors: "#{exception.detail['message']}: #{exception.detail['hint']}" }, 400)
  end

  def sync(from_sync_now=false)
    enqueued = false
    member = Synchronization::Member.new(id: params[:id]).fetch
    return head(401) unless member.authorize?(current_user)

    # @see /services/synchronizer/lib/synchronizer/collection.rb -> enqueue_rate_limited()
    if ( member.should_auto_sync? || (from_sync_now && member.can_manually_sync?) )
      platform_limit = CartoDB::PlatformLimits::Importer::UserConcurrentSyncsAmount.new({
        user: current_user, redis: { db: $users_metadata }
      })
      if platform_limit.is_within_limit?
        member.enqueue
        enqueued = true
        platform_limit.increment!
      end
    end

    render_jsonp( { enqueued: enqueued, synchronization_id: member.id})
  rescue KeyError => exception
    puts exception.message + "\n" + exception.backtrace
    head(404)
  rescue => exception
    CartoDB.notify_exception(exception)
    head(404)
  end

  def sync_now
    sync(true)
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
  end

  def payload
    request.body.rewind
    ::JSON.parse(request.body.read.to_s || String.new)
  end

  def get_external_source(remote_visualization_id)
    external_source = CartoDB::Visualization::ExternalSource.where(visualization_id: remote_visualization_id).first
    unless remote_visualization_id.present? && external_source.importable_by(current_user)
      raise CartoDB::Datasources::AuthError.new('Illegal external load')
    end
    external_source
  end
end

