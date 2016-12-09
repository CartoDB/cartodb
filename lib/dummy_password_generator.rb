module DummyPasswordGenerator
  def generate_dummy_password
    (0...15).map { ('a'..'z').to_a[rand(26)] }.join
  end
end
