#!/bin/bash
clear
echo "Good morning, world. Deploying"

#sshpass -p $HOST_PASS scp -o stricthostkeychecking=no golang-ci-example root@$SSH_HOST:~/
#sshpass -p $HOST_PASS ssh -o StrictHostKeyChecking=no root@$SSH_HOST DB_HOST=$DB_HOST DB_USER=$DB_USER DB_PASS=$DB_PASS DB_BUCKET=$DB_BUCKET ./golang-ci-example

ansible-playbook ./deploy/install.yml -vvvv -i ./deploy/hosts
