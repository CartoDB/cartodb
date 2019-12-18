
import sys
import os.path

if (len(sys.argv) != 4):
    print("rails2grunt type rails_file grunt.json")
    sys.exit()

file_type = sys.argv[1]
rails_file = sys.argv[2];
rails_path = os.path.abspath(rails_file)
name = os.path.basename(rails_file).split('.')[0]

def normalize(f):
    return f \
        .replace('../../../lib/assets/javascripts/', 'javascripts/') \
        .replace('../../../vendor/assets/javascripts/', 'javascripts/vendor/')

lines = []
for x in open(rails_file):
    tk = x.strip().split(' ')
    if tk[0] == '//=' or tk[0] == '*=':
        f = tk[2].replace("//=", "").replace("*=", "")
        if tk[1] == 'require':
            if '/' not in f:
                if file_type == 'scss':
                    lines.append("'vendor/assets/stylesheets/" + f + ".css',")
                else:
                    lines.append("'vendor/assets/javascripts/" + f + ".js',")
            else:
                if file_type == 'scss':
                    lines.append("'%s'," % (normalize(f) + ".scss"))
                else:
                    lines.append("'%s'," % (normalize(f) + ".js"))
        elif tk[1] == 'require_tree':
            if file_type == 'scss':
                lines.append("'%s'," % (normalize(f) + "/**/*.scss"))
            else:
                lines.append("'%s'," % (normalize(f) + "/**/*.js"))

print("%s: [\n%s\n]" % (name, '\n'.join(lines)[:-1]))


