---
slug: gone-config-system
description: Gone framework provides a powerful configuration management system that supports environment variables, local configuration files, and various configuration centers. Through a unified interface and elegant dependency injection, it simplifies application configuration management. Supporting mainstream configuration centers like Apollo and Nacos, it meets configuration requirements from simple applications to distributed systems.
keywords: ["Configuration Management", "Environment Variables", "Configuration Center", "Dependency Injection", "Apollo", "Nacos", "Gone Framework", "Distributed Systems", "Configuration Files", "Configuration Interface"]
tags:
  - Configuration Management
  - Microservices
  - Distributed Systems
  - Configuration Management
  - Microservices
---

# How to Use Configuration in Gone Framework

Configuration management is a core component of modern application development, allowing developers to adjust application behavior without modifying code. Gone framework provides a feature-rich and flexible configuration system that supports multiple configuration sources and environments. This article will detail Gone's configuration reading solution and its usage methods.

## Core Configuration Reading Solution

Gone framework's configuration solution mainly includes three levels:

1. **Built-in environment variable support in core framework**: No additional components required
2. **Local configuration files and command line parameters**: Supported through the `goner/viper` library
3. **Configuration center integration**: Supports various popular configuration centers
   - `goner/apollo` - Apollo Configuration Center
   - `goner/nacos` - Nacos Configuration Center
   - `goner/viper/remote` - Supports etcd, consul, Firestore, NATS, etc.

## Core Configuration Architecture

Gone's configuration system consists of three main parts: Configure interface, ConfigProvider, and EnvConfigure default implementation.

### Configure Interface

The Configure interface is the foundation of the entire configuration system, defining a concise yet powerful standard interface:

```go
type Configure interface {
    Get(key string, v any, defaultVal string) error
}
```

This interface contains a Get method for retrieving and converting configuration values:
- `key`: Configuration item key name, supports dot-separated multi-level paths (e.g., "db.host")
- `v`: Pointer variable for storing configuration value, supports basic types and complex structs
- `defaultVal`: Default value when configuration item doesn't exist
- Returns `error`: Specific error information when retrieval fails or type conversion errors occur

### ConfigProvider

ConfigProvider is responsible for configuration value dependency injection:

```go
type ConfigProvider struct {
    Flag
    configure Configure `gone:"configure"`
}
```

It provides several powerful features:
- Intelligent type conversion: Automatically converts configuration values to target types
- Default value mechanism: Falls back to default values when configuration items don't exist
- Clear error messages: Helps quickly locate configuration issues

### EnvConfigure Default Implementation

EnvConfigure is an out-of-the-box environment variable configuration implementation:

```go
type EnvConfigure struct {
    Flag
}
```

It has the following characteristics:
1. Standardized environment variable naming:
   - Automatically converts configuration key names to uppercase (e.g., db.host → GONE_DB_HOST)
   - Uniformly adds "GONE_" prefix to avoid naming conflicts

2. Comprehensive type support:
   - Basic types: string, int, float, bool, etc.
   - Numeric types: int/int8/int16/int32/int64, uint/uint8/uint16/uint32/uint64
   - Floating-point types: float32/float64
   - Complex types: time.Duration and JSON format structs

3. Intelligent default value handling:
   - Uses default values when environment variables are missing
   - Supports custom default values defined in tags

## Usage Examples

### Basic Configuration Injection

```go
// Configuration injection example
type UseConfig struct {
    // Simple type configurations
    port int    `gone:"config,port=8080"` // Default value 8080
    host string `gone:"config,host=localhost"` // Default value localhost
    duration time.Duration `gone:"config,duration=1s"`

    // Complex type configurations
    complexStruct struct {
        Field1 string `json:"field1"`
        Field2 int    `json:"field2"`
    } `gone:"config,complexStruct={\"field1\":\"value1\",\"field2\":42}"`

    array []string `gone:"config,array=[\"a\",\"b\",\"c\"]"`
}

func main(){
    gone.Run(func(conf *UseConfig){
        fmt.Println(conf.port)       // Get from GONE_PORT environment variable or default value
        fmt.Println(conf.host)       // Get from GONE_HOST environment variable or default value
        fmt.Println(conf.duration)   // Get from GONE_DURATION environment variable or default value
        fmt.Println(conf.complexStruct)  // Get from GONE_COMPLEXSTRUCT environment variable or default value
    })
}
```

All configurations are marked with the `gone:"config"` tag, followed by the configuration item key name and default value. For complex types, default values need to use valid JSON format strings.

For specific implementation, refer to the [source code](https://github.com/gone-io/gone/blob/main/config.go).

## Using goner/viper to Support Local Configuration Files

The `gone-viper` component, based on [spf13/viper](https://github.com/spf13/viper), provides powerful local configuration file management capabilities.

### Main Features

- Multiple configuration sources: files, environment variables, command line parameters
- Multi-format support: JSON, YAML, TOML, Properties
- Hierarchical configuration structure and default value mechanism
- Environment variable override functionality

### Configuration File Search Mechanism

The component automatically searches for configuration files in the following priority order:

1. Executable file directory
2. `config` subdirectory in executable file directory
3. Current working directory
4. `config` subdirectory in current working directory
5. Additional paths in test mode:
   - `config` directory in go.mod directory
   - `testdata` directory in current working directory
   - `testdata/config` directory in current working directory
6. Path specified by `CONF` environment variable or `-conf` startup option

### Configuration File Loading Order

In the same directory, the component loads and merges configurations in the following order:

1. Default configuration files (in order):
   - default.json
   - default.toml
   - default.yaml/yml
   - default.properties

2. Environment-related configuration files (default environment is `local`):
   - $\{env}.json
   - $\{env}.toml
   - $\{env}.yaml/yml
   - $\{env}.properties

### Usage Examples

1. Install component:
```bash
go get -u github.com/gone-io/goner/viper
```

2. Load in application:
```go
gone.Loads(
    viper.Load, // Load configuration component
    // Other components...
).Run()
```

3. Inject configuration through tags:
```go
type MyService struct {
    gone.Flag
    ServerHost string `gone:"config,server.host,default=localhost"`
    ServerPort int    `gone:"config,server.port,default=8080"`
    DbURL      string `gone:"config,db.url"`
}
```

4. Manually get configuration values:
```go
type MyComponent struct {
    gone.Flag
    conf gone.Configure `gone:"configure"` // Inject configuration manager
}

func (c *MyComponent) DoSomething() error {
    var host string
    err := c.conf.Get("server.host", &host, "localhost")
    if err != nil {
        return err
    }

    // Get complex struct configuration
    var dbConfig struct {
        URL      string
        Username string
        Password string
    }
    err = c.conf.Get("db", &dbConfig, "")
    // ...
}
```

### Configuration File Format Examples

#### Properties Format
```properties
# Server configuration
server.host=localhost
server.port=8080

# Database configuration
db.username=root
db.password=secret
db.database=mydb

# Variable substitution supported within the same file
db.url=mysql://localhost:3306/${db.database}
```

#### YAML Format
```yaml
server:
  host: localhost
  port: 8080

db:
  url: mysql://localhost:3306/mydb
  username: root
  password: secret

log:
  level: info
  path: /var/log/myapp
```

#### JSON Format
```json
{
  "server": {
    "host": "localhost",
    "port": 8080
  },
  "db": {
    "url": "mysql://localhost:3306/mydb",
    "username": "root",
    "password": "secret"
  },
  "log": {
    "level": "info",
    "path": "/var/log/myapp"
  }
}
```

#### TOML Format
```toml
[server]
host = "localhost"
port = 8080
[db]
url = "mysql://localhost:3306/mydb"
username = "root"
password = "secret"
[log]
level = "info"
path = "/var/log/myapp"
```

For more information, refer to [goner/viper](https://github.com/gone-io/goner/blob/main/viper/README_CN.md).

## Configuration Center Support

### Apollo Configuration Center

Gone Apollo component provides dynamic configuration retrieval and real-time update functionality.

1. Installation:
```bash
go get -u github.com/gone-io/goner/apollo
```

2. Load component:
```go
//...
import "github.com/gone-io/goner/apollo"
//

//...
gone.
    Loads(
        apollo.Load, // Load Apollo configuration component
        // Other components...
    ).
//...
```

3. Configure connection information:
```yaml
apollo:
  appId: YourAppId
  cluster: default
  ip: http://apollo-server:8080
  namespace: application
  secret: YourSecretKey
  isBackupConfig: true
  watch: true
  useLocalConfIfKeyNotExist: true
```

4. Usage:
```go
type YourComponent struct {
    gone.Flag
    // Configuration items supporting dynamic updates need to use pointer types
    ServerPort *int    `gone:"config,server.port"`
    DbUrl      *string `gone:"config,database.url"`
}
```

For more information, refer to [goner/apollo](https://github.com/gone-io/goner/blob/main/apollo/README_CN.md).

### Nacos Configuration Center

Gone Nacos component provides configuration management capabilities based on Alibaba's Nacos.

1. Installation:
```bash
go get -u github.com/gone-io/goner/nacos
```

2. Load component:
```go
//...
import "github.com/gone-io/goner/nacos"

//...

gone.
    Loads(
        nacos.Load, // Load Nacos configuration component
        // Other components...
    )
//...
```

3. Configure connection information:
```yaml
nacos:
  client:
    namespaceId: public
    timeoutMs: 10000
    logLevel: info
  server:
    ipAddr: "127.0.0.1"
    contextPath: /nacos
    port: 8848
  dataId: user-center
  watch: true
  useLocalConfIfKeyNotExist: true
```

For more information, refer to [goner/nacos](https://github.com/gone-io/goner/blob/main/nacos/README_CN.md).

### Other Configuration Centers

Through the `goner/viper/remote` component, Gone supports more configuration centers:

- etcd/etcd3: Highly available distributed key-value store
- consul: Service discovery and configuration tool
- firestore: Google Cloud NoSQL database
- nats: Distributed messaging system

1. Installation
```bash
go get -u github.com/gone-io/goner/remote
```

2. Load component:
```go
//...
import "github.com/gone-io/goner/remote"

//...

gone.
    Loads(
        remote.Load, // Load viper/remote configuration component
        // Other components...
    )
//...
```

3. Configuration example:
```yaml
viper.remote:
  type: yaml
  watch: true
  watchDuration: 5s
  useLocalConfIfKeyNotExist: true
  providers:
    - provider: etcd # Supported configuration center types: etcd, etcd3, consul, firestore, nats
      endpoint: localhost:2379
      path: /config/myapp
      configType: json
```

## Custom Configuration Source
If you need to customize a configuration source, you can extend the configuration component by implementing the `Configure` interface.

```go
type customerConfig struct {
    gone.Flag
}

func (c *customerConfig) Get(key string, v any, defaultVal string) error {
    // Implement logic to get configuration from custom configuration source
    // ...
}

// Define load function
func Load(loader gone.Loader) gone.Loader {
    return gone.LoadOnce(func() error {
        return loader.Load(
            &customerConfig{},
            gone.Name(gone.ConfigureName),
            gone.IsDefault(new(gone.Configure)),
            gone.ForceReplace(),
        )
    })
}
```

## Best Practice Recommendations

1. Use hierarchical structure to organize configurations, improving readability and maintainability
2. Provide reasonable default values for key configurations, ensuring applications can still run normally when configurations are missing
3. Inject sensitive information (like passwords, API keys) through environment variables, avoiding hardcoding in configuration files
4. Use different environment configuration files (like `dev.yaml`, `prod.yaml`) to manage configurations for different environments
5. Use lowercase letters and dots for configuration key names, maintaining consistent naming conventions

## Summary

Gone framework's configuration system is both simple to use and powerful, capable of meeting various configuration management needs from simple applications to complex distributed systems. Whether through environment variables, local configuration files, or remote configuration centers, Gone provides a unified interface and elegant dependency injection approach, greatly simplifying application configuration management work.