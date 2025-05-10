---
slug: goner-meter
description: Detailed introduction on how to use Gone framework's goner/otel/meter component, combined with Prometheus to implement application metrics monitoring, data collection, and visualization display, helping developers easily build a complete application monitoring system
keywords:
  - OpenTelemetry
  - Gone Framework
  - Prometheus Monitoring
  - Application Metrics
  - Performance Monitoring
  - Observability
  - Monitoring System
  - Metrics Collection
tags:
  - OpenTelemetry
  - Gone
  - Observability
  - Technical Practice
date: 2025-05-09T22:00
---

# Using goner/otel/meter for Application Metrics Monitoring

Monitoring application running status is crucial in modern application development. This article will introduce how to use Gone framework's `goner/otel/meter` component to collect application metrics and visualize them through Prometheus. Through this tutorial, you will learn how to monitor key metrics like your application's API call count.

## Quick Start

### 1. Preparation

First, we need to install Gone framework's command-line tool `gonectl`. It can help us quickly create and manage Gone projects:

```bash
go install github.com/gone-io/gonectl@latest
```

### 2. Create Sample Project

Use `gonectl` to create a project based on the `otel/meter/prometheus` template. This template already includes all necessary monitoring component configurations:

```bash
gonectl create -t otel/meter/prometheus meter-prometheus
```

### 3. Start Application

Enter the project directory and run the following command to start the application service:

```bash
go run ./cmd
```

### 4. Start Prometheus Monitoring Service

The project includes Prometheus configuration file, use Docker to start Prometheus service:

```bash
docker compose up -d
```

### 5. Verify Monitoring Effect

Now, let's verify if the monitoring system is working properly:

1. Access the sample interface multiple times to generate some monitoring data:
```bash
curl http://localhost:8080/hello
```

2. View raw metrics data:
```bash
curl http://localhost:8080/metrics
```

3. View visualized metrics data in Prometheus console:
   - Open Prometheus interface: http://localhost:9090/graph
   - Enter in the query box: `api_counter_total`
   - You will see monitoring data display similar to the following image:

![Prometheus Metrics Query Result](/img/2025-05-09-goner-meter-screenshot.png)

## Code Analysis

Let's understand how this monitoring system works.

### Project Structure

```bash
.
├── cmd
│   ├── import.gone.go  # Auto-generated component import file
│   └── server.go       # Application entry file
├── controller
│   ├── ctr.go          # API interface definition and metrics collection logic
│   └── init.gone.go    # Controller initialization file
├── docker-compose.yaml # Docker configuration file
├── prometheus.yml     # Prometheus configuration file
├── init.gone.go
└── module.load.go     # Gone module loading configuration
```

### Core Component Description

The project uses the `goner/otel/meter/prometheus/gin` component, which will automatically:
- Create an HTTP service (default port 8080)
- Provide `/metrics` interface for exposing monitoring metrics
- Integrate Prometheus data collection

This component actually includes the following function modules:
- `goner/otel/meter/prometheus`: Prometheus metrics collector
- `goner/otel/meter`: Metrics management core functionality
- `goner/otel`: OpenTelemetry basic functionality
- `goner/gin`: Web service framework

### Metrics Collection Example

In `controller/ctr.go`, we defined a simple counter metric:

```go
package controller

import (
	"github.com/gin-gonic/gin"
	"github.com/gone-io/gone/v2"
	"github.com/gone-io/goner/g"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/metric"
)

type ctr struct {
	gone.Flag
	r g.IRoutes `gone:"*"`
}

func (c *ctr) Mount() (err g.MountError) {
    // Create a meter named "my-service-meter"
    var meter = otel.Meter("my-service-meter")

    // Define a counter type metric
    apiCounter, err := meter.Int64Counter(
        "api.counter",           // Metric name
        metric.WithDescription("Number of API calls"), // Metric description
        metric.WithUnit("{count}"),   // Measurement unit
    )
    if err != nil {
        return gone.ToErrorWithMsg(err, "Failed to create api.counter")
    }

    // Register HTTP interface, increment counter on each access
    c.r.GET("/hello", func(ctx *gin.Context) string {
        apiCounter.Add(ctx, 1)  // Increment counter by 1
        return "hello, world"
    })
    return
}
```

This code demonstrates how to:
1. Create a metrics collector (Meter)
2. Define a counter type metric (Counter)
3. Record metric data in API interface

### Monitoring Data Collection Configuration

Prometheus configuration (`prometheus.yml`) is also simple:

```yaml
scrape_configs:
  - job_name: 'node'
    scrape_interval: 5s    # Collect data every 5 seconds
    static_configs:
      - targets: ['localhost:8080']
        labels:
          group: 'canary'
```

This configuration tells Prometheus to collect metrics data from our application (localhost:8080) every 5 seconds.