# coding: utf-8
class Api::ApplicationController < ApplicationController
  # Don't force org urls
  skip_before_filter :ensure_org_url_if_org_user, :browser_is_html5_compliant?, :verify_authenticity_token
  before_filter :api_authorization_required, :link_ghost_tables

  protected

  def set_start_time
    @time_start = Time.now
  end

  # dry up the jsonp output
  def render_jsonp obj, status = 200, options = {}
    options.reverse_merge! :json => obj, :status => status, :callback => params[:callback]
    render options
  end

  def link_ghost_tables
    return true unless current_user.present?
    if current_user.search_for_cartodbfied_tables.length
      # this should be removed from there once we have the table triggers enabled in cartodb-postgres extension
      # test if there is a job already for this
      working = Resque::Worker.all.select { |w|
        w.job && w.job['payload'] && w.job['payload']['class'] === 'Resque::UserJobs::SyncTables::LinkGhostTables' && w.job['args'] === current_user.id
      }.length
      if !working
        ::Resque.enqueue(::Resque::UserJobs::SyncTables::LinkGhostTables, current_user.id)
      end
    end
  end
end
