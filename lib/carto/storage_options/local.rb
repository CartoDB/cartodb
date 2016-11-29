# encoding utf-8

class Carto::StorageOptions::Local
  UPLOADS_DIRECTORY = "#{Rails.root}/uploads".freeze

  def upload(namespaced_name, file)
    File.mkdir(UPLOADS_DIRECTORY)
    FileUtils.mv(file.path, File.join(UPLOADS_DIRECTORY, namespaced_name))
  end

  def remove(namespaced_name)
    File.delete(namespaced_name) if File.exist?(namespaced_name)
  end
end
