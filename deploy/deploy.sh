#!/bin/bash
clear
echo "Good morning, world."
ansible-playbook ./deploy/install.yml -i ./deploy/hosts
