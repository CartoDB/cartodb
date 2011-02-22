  # coding: UTF-8

class Float

  def self.random_latitude
    40.0 + (rand(10000.0) / 1000.0)
  end

  def self.random_longitude
    3.0 + (rand(1000.0) / 1000.0)
  end

end
