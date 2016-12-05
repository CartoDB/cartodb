# encoding utf-8

class Carto::StorageOptions::Local
  UPLOADS_DIRECTORY = "public/uploads".freeze

  def upload(namespaced_name, file, protocol: 'https')
    FileUtils.mkdir_p(UPLOADS_DIRECTORY)

    target_full_path = File.join(UPLOADS_DIRECTORY, namespaced_name)
    FileUtils.mkdir_p(target_full_path)
    FileUtils.mv(file.path, target_full_path)

    "#{protocol}://#{CartoDB.account_host}/#{target_full_path}"
  end

  def remove(namespaced_name)
    File.delete(namespaced_name) if File.exist?(namespaced_name)
  end
end
