FROM openjdk:8-jdk-alpine

LABEL author="Liu Jiacheng"
LABEL version="0.0.1"

EXPOSE 10086
ENV TZ=Asia/Shanghai

WORKDIR /opt

COPY --chown=root:root ./app.jar ./app.jar

CMD ["java", "-jar", "app.jar"]
