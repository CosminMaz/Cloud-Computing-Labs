# Stage 1: build with Maven
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn compile dependency:copy-dependencies -DoutputDirectory=target/dependency -q

# Stage 2: minimal runtime image
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/classes ./classes
COPY --from=build /app/target/dependency ./dependency
EXPOSE 8000
CMD ["java", "-cp", "classes:dependency/*", "com.winamp.Main"]
