# These helpers are meant to be used in tests to generate random data which may collide, e.g: usernames
# The methods are parameter-less in purpose, so it is easier to modify the name generation if needed
module RandomNamesHelper
  @@item_count = 0

  def random_string
    sprintf '%08d', random_integer
  end

  def random_email
    r = random_string
    "e#{r}@d#{r}.com"
  end

  def random_name(prefix)
    prefix + random_string
  end

  def random_integer
    @@item_count += 1
    global_id * 10000000 + @@item_count
  end

  def global_id
    @@global_id ||= if ENV['PARALLEL_SEQ']
                      ENV['PARALLEL_SEQ'].to_i
                    elsif ENV['CHECK_SPEC']
                      ENV['CHECK_SPEC'].to_i
                    else
                      0
                    end
  end
end
