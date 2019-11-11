  class Float

  def self.random_latitude
    rand(40) * [1,-1][rand(2)] + (rand(10000.0) / 1000.0)
  end

  def self.random_longitude
    rand(3) * [1,-1][rand(2)] + (rand(10000.0) / 1000.0)
  end

end
