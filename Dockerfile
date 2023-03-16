FROM golang:alpine

ARG BUILD_DATE
ARG SOURCE_COMMIT

LABEL maintainer="Johan Viklund"
LABEL org.label-schema.schema-version="1.0"
LABEL org.label-schema.build-date=$BUILD_DATE
LABEL org.label-schema.vcs-url="https://github.com/viklund/archery-log"
LABEL org.label-schema.vcs-ref=$SOURCE_COMMIT

ENV GOPATH=$PWD
ENV CGO_ENABLED=1

COPY go.mod go.sum main.go /go/src/

RUN apk add --no-cache --virtual .build-deps gcc musl-dev libc-dev && \
    cd /go/src && go build . && mv backend /usr/bin/backend && \
    apk del .build-deps && rm -rf /root/go && rm -rf /root/.cache

CMD ["/usr/bin/backend"]
