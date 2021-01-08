puts "Running"
require 'byebug'
any_instance_calls = 0

Dir['**/*'].each do |file_path|
  if file_path.match?(/_spec.rb/)
    puts "Checking file #{file_path}"
    replacings = {}

    File.readlines(file_path).each do |line|
      if matchdata = (line =~ (/\.any_instance\.stubs\(.*\)\.returns\(.*\)/))
        class_name = line.split(".any_instance").first.split(" ").last
        line_beginning = line.split(class_name).first
        method_name = line.split(".stubs(")[1].split(").returns").first
        return_value = line.split(".returns(")[1].split(")").first
        new_line = "#{line_beginning}allow_any_instance_of(#{class_name}).to receive(#{method_name}).and_return(#{return_value})"

        puts "-------"
        puts "Replacing:"
        puts "    #{line}"
        puts "Per:"
        puts "    #{new_line}"
        puts "-------"
        any_instance_calls += 1
        replacings[line] = "#{new_line}\n"
      end
    end

    file_text = File.read(file_path)
    replacings.each do |key, value|
      file_text.gsub!(key, value)
    end
    if replacings.any?
      File.open(file_path, "w") do |f|
        f.write(file_text)
      end
    end
  end
end

puts any_instance_calls
