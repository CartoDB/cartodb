# encoding utf-8

class Carto::StorageOptions::Local
  include Carto::Configuration

  def upload(namespaced_name, file, protocol: 'https')
    filename = Pathname.new(file.path).basename
    target_full_path = File.join(public_uploads_path, namespaced_name)
    FileUtils.mkdir_p(target_full_path)

    FileUtils.mv(file.path, target_full_path)

    url_path = File.join(target_full_path.gsub('public/', ''), filename)
    "#{protocol}://#{CartoDB.account_host}/#{url_path}"
  end

  def remove(namespaced_name)
    File.delete(namespaced_name) if File.exist?(namespaced_name)
  end
end
