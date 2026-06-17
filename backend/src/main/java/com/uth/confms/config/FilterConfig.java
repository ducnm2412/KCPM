package com.uth.confms.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình đăng ký các filter
 *
 * @author UTH-ConfMS Team
 * @version 1.0
 */
@Configuration
public class FilterConfig {

  @Bean
  @ConditionalOnBean(RateLimitingFilter.class)
  public FilterRegistrationBean<RateLimitingFilter> rateLimitingFilterRegistration(
      RateLimitingFilter rateLimitingFilter) {
    FilterRegistrationBean<RateLimitingFilter> registration = new FilterRegistrationBean<>();
    registration.setFilter(rateLimitingFilter);
    registration.addUrlPatterns("/api/*");
    registration.setOrder(1);
    registration.setName("rateLimitingFilter");
    return registration;
  }
}
