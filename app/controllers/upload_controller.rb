# coding: UTF-8

class UploadController < ApplicationController

  skip_before_filter :verify_authenticity_token
  before_filter :login_required
  
  ssl_required :create, :progress

  def create
    render :nothing => true and return if params[:qqfile].blank? || request.body.blank?

    file_name       = params[:qqfile]
    user_id         = current_user.id
    upload_path = Rails.root.join('public', 'uploads', user_id.to_s)
    file_path       = upload_path.join(file_name)

    FileUtils.mkdir_p(upload_path) unless File.directory?(upload_path)
    File.open(file_path, 'w+') do |file|
      file.write(request.body.read.force_encoding('utf-8'))
    end

    render :json => {:file_uri => "/uploads/#{user_id}/" + file_name, :success => true}

  end

  def progress
    return if params["X-Progress-ID".to_sym].nil?
    if $progress[params["X-Progress-ID".to_sym]].nil?
      $progress[params["X-Progress-ID".to_sym]] = 0
    end
    $progress[params["X-Progress-ID".to_sym]] += 5
    result = {}
    if $progress[params["X-Progress-ID".to_sym]] == 100
      result['state'] = 'done'
    elsif $progress[params["X-Progress-ID".to_sym]] > 100
      $progress[params["X-Progress-ID".to_sym]] = 0
      result['state'] = 'uploading'
    else
      result['state'] = 'uploading'
    end
    result['received'] = $progress[params["X-Progress-ID".to_sym]]
    result['size'] = 100
    respond_to do |format|
      format.json do
        render :json => result.to_json
      end
    end
  end

end
