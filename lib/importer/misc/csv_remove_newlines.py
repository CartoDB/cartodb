#!/usr/bin/env python

# Remove newline chars from CSV "cells"
# Input is taken from stdin and output spit to stdout

import csvkit
import sys

reader = csvkit.reader(sys.stdin)
writer = csvkit.writer(sys.stdout)
for row in reader:
  for i in range(0, len(row)):
    if isinstance(row[i], str):
      if "\n" in row[i]:
        row[i] = row[i].replace("\n", '')
  writer.writerow(row)
