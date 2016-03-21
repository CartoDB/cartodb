module RandomNamesHelper
  def random_string
    String.random(6).downcase
  end

  def random_email
    random_string + '@' + random_string + '.com'
  end

  def random_name(prefix)
    "#{prefix}#{random_string}"
  end

  def random_integer
    rand(10000)
  end
end
