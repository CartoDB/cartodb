module CacheHelper
  def get_surrogate_key(namespace, key)
    "#{namespace}:#{Digest::SHA256.base64digest(key)[0..5]}"
  end
end
