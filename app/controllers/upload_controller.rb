# coding: UTF-8

class UploadController < ApplicationController
  ssl_required :create
  skip_before_filter :verify_authenticity_token
  before_filter :login_required

  def create
    head(400) and return if params[:qqfile].blank? || request.body.blank?
 	
    upload_path  = Rails.root.join('public', 'uploads', current_user.id.to_s) 	
    file_path    = upload_path.join(params[:qqfile])
 	
    FileUtils.mkdir_p(upload_path) unless File.directory?(upload_path)
    File.open(file_path, 'w+') do |file|
      file.write(request.body.read.force_encoding('utf-8'))
    end
    render :json => {:file_uri => "/uploads/#{current_user.id}/" + params[:qqfile], :success => true}

    # begin
    #   file_path = Tempfile.new(params[:qqfile])
    #   File.open(file_path, 'w+') do |file|
    #     file.write(request.body.read.force_encoding('utf-8'))
    #   end
    #   render :json => {:file_uri => file_path, :success => true}
    # rescue => e
    #   debugger
    #   head(400) and return
    # end    
  end
end
