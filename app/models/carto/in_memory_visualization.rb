class Carto::InMemoryVisualization < Carto::Visualization
  def valid?
    false
  end

  def save
    raise "You should not be saving this!"
  end
end