plugins {
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.0"
    id("java")
}

group = "com.example"
version = "1.0.0"
java.sourceCompatibility = JavaVersion.VERSION_17//java version 17까지 rulset 사용.
//현재 23까지 사용 가능. AWS 서버 맞춰서 바꾸기

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot 핵심 어노테이션 포함
    implementation("org.springframework.boot:spring-boot-starter")

    // 웹 API, @RestController, @RequestMapping 등 포함
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")

    // 선택: JSON 처리에 유용 (필요시)
    implementation("com.fasterxml.jackson.core:jackson-databind")

    // 선택: 로깅 (이미 포함되지만 명시적 사용 가능)
    implementation("org.springframework.boot:spring-boot-starter-logging")

    implementation("org.springframework.boot:spring-boot-starter-webflux")

    // 유효성 검사
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // 비밀번호 해시(Bcrypt)
    implementation("org.springframework.boot:spring-boot-starter-security")

    //token에 사용하는 jwt
    implementation("io.jsonwebtoken:jjwt-api:0.13.0")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.13.0")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.13.0") // JSON 파서

    //lombok
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

    // PostgreSQL 드라이버
    implementation ("org.postgresql:postgresql")
    //runtimeOnly("org.postgresql:postgresql:42.7.4")

    testImplementation("org.springframework.boot:spring-boot-starter-test")

    // Docker Compose 지원 (개발 환경 전용)
    developmentOnly("org.springframework.boot:spring-boot-docker-compose")
}