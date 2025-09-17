plugins {
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.0"
    id("java")
}

group = "com.example"
version = "1.0.0"
java.sourceCompatibility = JavaVersion.VERSION_17

repositories {
    mavenCentral()
}

dependencies {
    // ✅ Spring Boot 핵심 어노테이션 포함
    implementation("org.springframework.boot:spring-boot-starter")

    // ✅ 웹 API, @RestController, @RequestMapping 등 포함
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")

    // ✅ 선택: JSON 처리에 유용 (필요시)
    implementation("com.fasterxml.jackson.core:jackson-databind")

    // ✅ 선택: 로깅 (이미 포함되지만 명시적 사용 가능)
    implementation("org.springframework.boot:spring-boot-starter-logging")

    implementation("org.springframework.boot:spring-boot-starter-webflux")

    // 유효성 검사
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // 비밀번호 해시(Bcrypt)
    implementation("org.springframework.boot:spring-boot-starter-security")

    // PostgreSQL 드라이버
    runtimeOnly("org.postgresql:postgresql:42.7.4")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.withType<org.springframework.boot.gradle.tasks.run.BootRun> {
    mainClass.set("com.example.chat.Application")
}
