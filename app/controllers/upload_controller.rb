# coding: UTF-8

class UploadController < ApplicationController

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
