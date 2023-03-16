#!/usr/bin/env bash

if [ ! -f database.db ]; then
    sqlite3 database.db < schema.sql
fi

docker-compose up --build
