#!/usr/bin/bash

docker run --name nginx-archery --rm -d -p 8080:80 -v $PWD:/usr/share/nginx/html:ro nginx
