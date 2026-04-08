FROM alpine:3.19
RUN apk add --no-cache bash curl jq
COPY watch.sh /watch.sh
RUN chmod +x /watch.sh
CMD ["/watch.sh"]
