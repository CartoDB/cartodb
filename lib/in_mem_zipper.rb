require 'zip'

module InMemZipper
  module_function

  def zip(entries)
    zipstream = Zip::OutputStream.write_buffer do |zio|
      entries.each do |name, contents|
        if contents.present?
          zio.put_next_entry name
          zio.write contents
        end
      end
    end
    zip_data = zipstream.string
  end

  def unzip(zip_data)
    fin = StringIO.new(zip_data.force_encoding(Encoding::ASCII_8BIT))
    entries = {}
    Zip::InputStream.open(fin) do |fzip|
      while entry = fzip.get_next_entry
        entries[entry.name] = fzip.read
      end
    end
    entries
  end
end
