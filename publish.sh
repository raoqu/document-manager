#!/bin/sh
pnpm build && rsync -avz dist/ root@10.6.0.1:/www/server/pages/docs/
