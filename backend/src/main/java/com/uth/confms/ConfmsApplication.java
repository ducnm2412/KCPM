package com.uth.confms;

import io.github.cdimascio.dotenv.Dotenv;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing
@EnableCaching
@EnableAsync
@EnableScheduling
@EnableRetry
@Slf4j
public class ConfmsApplication {

  @PostConstruct
  public void init() {
    java.util.TimeZone.setDefault(
        java.util.TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
  }

  public static void main(String[] args) {
    loadEnvironmentVariables();
    SpringApplication.run(ConfmsApplication.class, args);
  }

  private static void loadEnvironmentVariables() {
    try {
      String[] searchPaths = getSearchPaths();

      Dotenv dotenv = findDotenv(searchPaths);

      if (dotenv == null) {
        dotenv = loadDefaultDotenv();
      }

      if (dotenv != null) {
        loadProperties(dotenv);
      } else {
        log.warn(".env file not found. Using environment variables and defaults.");
        log.warn("Searched in: {}", String.join(", ", searchPaths));
      }

    } catch (Exception e) {
      log.warn("Could not load .env file: {}", e.getMessage());
      log.warn("Using environment variables and defaults.");
    }
  }

  private static String[] getSearchPaths() {
    String userDir = System.getProperty("user.dir");

    return new String[] {
        ".",
        userDir,
        userDir + "/backend",
        "../",
        "../backend"
    };
  }

  private static Dotenv findDotenv(String[] searchPaths) {
    for (String path : searchPaths) {
      Dotenv dotenv = tryLoadDotenv(path);

      if (dotenv != null) {
        return dotenv;
      }
    }

    return null;
  }

  private static Dotenv tryLoadDotenv(String path) {
    try {
      java.io.File envFile = new java.io.File(path, ".env");

      if (!envFile.exists() || !envFile.isFile()) {
        return null;
      }

      Dotenv dotenv = Dotenv.configure()
          .directory(path)
          .ignoreIfMissing()
          .load();

      log.info("Found .env file at: {}", envFile.getAbsolutePath());

      return dotenv;

    } catch (Exception e) {
      return null;
    }
  }

  private static Dotenv loadDefaultDotenv() {
    try {
      return Dotenv.configure()
          .ignoreIfMissing()
          .load();
    } catch (Exception e) {
      return null;
    }
  }

  private static void loadProperties(Dotenv dotenv) {
    int loadedCount = 0;

    for (var entry : dotenv.entries()) {
      String key = entry.getKey();
      String value = entry.getValue();

      if (System.getProperty(key) == null
          && System.getenv(key) == null) {

        System.setProperty(key, value);
        loadedCount++;
      }
    }

    log.info("Loaded {} variables from .env file", loadedCount);
  }
}
