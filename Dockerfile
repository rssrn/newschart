# Stage 1: Build frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json frontend/
RUN cd frontend && npm ci --legacy-peer-deps
COPY frontend/ frontend/
RUN cd frontend && npm run build

# Stage 2: Build backend (with frontend bundled into classpath:/static/)
FROM eclipse-temurin:21-jdk-alpine AS backend-build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw package -DskipTests -q -Dmaven.repo.local=/root/.m2/repository || true
COPY src/ src/
COPY --from=frontend-build /app/frontend/build/ src/main/resources/static/
RUN ./mvnw package -DskipTests -q && cp target/newschart-*.jar target/app.jar

# Stage 3: Runtime
# NOTE: SPA routing (serving index.html for non-API paths) requires a backend
# WebMvcConfigurer — add a ResourceHandlerRegistry fallback before deploying.
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/target/app.jar ./
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
