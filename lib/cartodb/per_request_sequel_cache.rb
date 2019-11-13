module PerRequestSequelCache

  def self.set(key, obj, ttl)
    # Please note ttl is ignored
    RequestStore.write(key, obj)
  end

  def self.get(key)
    RequestStore.read(key)
  end

  def self.delete(key)
    RequestStore.delete(key)
  end

end
