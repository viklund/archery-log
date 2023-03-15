FROM golang:alpine as builder

ENV GOPATH=$PWD
ENV CGO_ENABLED=0

COPY go.mod go.sum main.go ./

RUN go build .
RUN echo "nobody:x:65534:65534:nobody:/:/sbin/nologin" > passwd

FROM scratch

ARG BUILD_DATE
ARG SOURCE_COMMIT

LABEL maintainer="Johan Viklund"
LABEL org.label-schema.schema-version="1.0"
LABEL org.label-schema.build-date=$BUILD_DATE
LABEL org.label-schema.vcs-url="https://github.com/viklund/archery-log"
LABEL org.label-schema.vcs-ref=$SOURCE_COMMIT

COPY --from=builder /go/passwd /etc/passwd
COPY --from=builder /go/backend /usr/bin/
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

USER 65534

CMD ["/usr/bin/backend"]
