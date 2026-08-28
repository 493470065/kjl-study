package com.racc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * 景磊的AI乐园管理平台启动类
 */
@SpringBootApplication
@EnableScheduling
@EnableTransactionManagement
public class RaccPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(RaccPlatformApplication.class, args);
    }
}
