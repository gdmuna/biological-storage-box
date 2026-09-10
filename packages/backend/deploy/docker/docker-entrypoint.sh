#!/bin/sh
set -e

# 确保挂载卷子目录存在，并将所有权交给 node 用户
# 此脚本以 root 运行，完成后通过 runuser 降权到 node
mkdir -p ./data/logs ./data/temp/exports ./data/temp/uploads
chown -R node:node ./data

exec runuser -u node -- "$@"
