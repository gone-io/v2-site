---
slug: xorm-update-process
description: This article details the process of refactoring the goner/xorm component using Gone framework's Provider mechanism. By implementing a unified Provider mechanism, the code structure was optimized, maintainability and test coverage were improved, while maintaining compatibility with existing functionality and configuration. The article covers the refactoring motivation, objectives, design approach, implementation details, and testing strategy.
keywords: ["Dependency Injection", "Database Access", "Code Refactoring", "Provider Pattern", "xorm", "Gone Framework", "Test Coverage", "Transaction Management", "SQL Building", "Code Optimization"]
tags:
  - xorm
  - gone
  - database access
  - code refactoring
  - test coverage
  - transaction management
---

# Refactoring goner/xorm Using Provider Mechanism

## Background

Recently, while adding test code to [goner](https://github.com/gone-io/goner) to improve project test coverage, we discovered two main issues when working on `goner/xorm`:

### 1. Complex Original Design
goner/xorm is one of the earlier components provided in the gone framework, with the following evolution:

- v1.0 version: Completely implemented based on Goner mechanism

- v1.2 version: Introduced Provider mechanism, incrementally modified to support multiple databases and cluster scenarios

Currently, both Goner mechanism and Provider mechanism implementations coexist:

- Default configured database: Injected based on Goner mechanism

- Cluster database or multiple databases: Injected using Provider mechanism

This dual-mechanism design increases code complexity and maintenance difficulty.

### 2. Testing Challenges and Coverage Issues
The code design lacks clear responsibilities and component boundaries, making it difficult to write tests and achieve good test coverage.

## Objectives
### 1. Ensure Configuration and Injection Compatibility
First, let's review goner/xorm's configuration conventions:

```yaml
# database default database configuration prefix
database:
    driver-name: mysql  # Database driver name
    dsn: user:password@tcp(IP_ADDRESS:3306)/dbname?options  # Database connection string
    max-idle-count: 10  # Maximum number of idle connections in the pool
    max-open: 100  # Maximum number of open connections
    max-lifetime: 10s  # Maximum connection lifetime
    show-sql: true  # Whether to display SQL statements
    cluster:  # Cluster configuration
        enable: false  # Whether to enable cluster mode
        master:  # Master database configuration
            driver-name: mysql
            dsn: user:password@tcp(IP_ADDRESS:3306)/dbname?options
        slaves:  # Slave database configuration list
            - driver-name: mysql
              dsn: user:password@tcp(IP_ADDRESS:3306)/dbname?options
            - driver-name: mysql
              dsn: user:password@tcp(IP_ADDRESS:3306)/dbname?options

# Custom database configuration prefix, custom-name is the custom database configuration prefix
custom-name:
    driver-name: mysql
    dsn: user:password@tcp(IP_ADDRESS:3306)/dbname?options
    max-idle-count: 10
    max-open: 100
    max-lifetime: 10s
    show-sql: true
    cluster:
        enable: false
        master:
            driver-name: mysql
            dsn: user:password@tcp(IP_ADDRESS:3306)/dbname?options
        slaves:
            - driver-name: mysql
              dsn: user:password@tcp(IP_ADDRESS:3306)/dbname?options
            - driver-name: mysql
              dsn: user:password@tcp(IP_ADDRESS:3306)/dbname?options
```

Now, let's review goner/xorm's injection methods:

```go
//  Default configuration prefix database injection
type defaultDbUser struct {
    engine0 xorm.Engine `gone:"*"`  // Inject database with default configuration prefix
    engine1 xorm.Engine `gone:"xorm,master"`  // Inject master database of default configuration cluster (if cluster mode is enabled)
    engine2 []xorm.Engine `gone:"xorm"`  // Inject slave database collection of default configuration cluster (if cluster mode is enabled)
    engine3 xorm.Engine `gone:"xorm,slave=0"`  // Inject first slave database from default configuration cluster (if cluster mode is enabled)
    engine4 xorm.Engine `gone:"xorm,slave=1"`  // Inject second slave database from default configuration cluster (if cluster mode is enabled)
}

//  Custom configuration prefix database injection
type customerDbUser struct {
    engine0 xorm.Engine `gone:"xorm,db=custom-name"`  // Inject database with configuration prefix equal to custom-name
    engine1 xorm.Engine `gone:"xorm,db=custom-name,master"`  // Inject master database of custom-name cluster (if cluster mode is enabled)
    engine2 []xorm.Engine `gone:"xorm,db=custom-name"`  // Inject slave database collection of custom-name cluster (if cluster mode is enabled)
    engine3 xorm.Engine `gone:"xorm,db=custom-name,slave=0"`  // Inject first slave database from custom-name cluster (if cluster mode is enabled)
    engine4 xorm.Engine `gone:"xorm,db=custom-name,slave=1"`  // Inject second slave database from custom-name cluster (if cluster mode is enabled)
}
```

The refactoring must maintain compatibility with the above configuration format and injection methods to ensure user code doesn't require changes.

### 2. Maintain Existing Functionality

Functionally, goner/xorm's Engine enhances xorm.io/xorm in two main ways:

#### 2.1 Enhanced Transaction Support

Using github.com/jtolds/gls to enhance transactions, better supporting nested transactions without manual transaction context passing:
```go
var db *xorm.Engine

// Main process function, initiating top-level transaction
func ProcessA(){
    db.Transaction(func(session xorm.XInterface) error {
        // Call other transaction functions, no need to pass session
        ProcessB()
        ProcessC()
        return nil
    })
}

// Sub-process B, automatically using parent transaction context
func ProcessB(){
    db.Transaction(func(session xorm.XInterface) error {
        ProcessD()
        return nil
    })
}

// Sub-process C, automatically using parent transaction context
func ProcessC(){
    db.Transaction(func(session xorm.XInterface) error {
        // Handle specific business logic
        return nil
    })
}

// Sub-process D, automatically using top-level transaction context
func ProcessD(){
    db.Transaction(func(session xorm.XInterface) error {
        // Handle specific business logic
        return nil
    })
}
```

This design allows developers to ignore transaction passing, simplifying nested transaction handling.

#### 2.2 Enhanced SQL Building Capability

Using github.com/jmoiron/sqlx to enhance SQL building capability, providing the Sqlx function:
```go
type dbUser struct {
    gone.Flag
    db xorm.Engine `gone:"*"`
}

func (s* dbUser)Query(){
    // Basic parameterized SQL using question mark placeholders
    db.Sqlx("select * from user where id=?", 1).Exec()

    // Support array parameters, automatically expanding to IN queries
    db.Sqlx("select * from user where id in (?)", []int{1,2,3}).Exec()
    // Generated SQL: select * from user where id in (1,2,3)

    // Support named parameters for better clarity
    db.Sqlx("select * from user where id in (:id) and status = :status", map[string]any{
        "id": []int{1,2,3},
        "status": 1,
    }).Exec()
    // Generated SQL: select * from user where id in (1,2,3) and status = 1
}
```

This approach makes SQL building more flexible and secure, especially when handling complex queries and dynamic conditions.

### 3. Implement Unified v2 Provider Mechanism

The core goal of the refactoring is to use a single mechanism (Provider mechanism) to implement all functionality, avoiding the complexity of dual mechanisms.

### 4. Optimize Code Design for Clear Responsibilities and Boundaries

Optimize code structure and component division to make each component's responsibility clear and singular, with clear boundaries between components, facilitating testing and maintenance.

## Design
1. Implement **xormProvider** to read conventional configuration and provide `xorm.EngineInterface` type instances from `xorm.io/xorm` for the system;
2. Use `gone.WrapFunctionProvider` to wrap `xormProvider`, providing `*xorm.Engine` and `*xorm.EngineGroup` type instances for the system;
3. Use `eng` to encapsulate `xorm.EngineInterface`, implementing the `Engine` interface defined in the original `goner/xorm`, completing transaction enhancement and SQL building enhancement;
4. Use `engProvider` to provide `goner/xorm.Engine` type instances for the system.

![](/img/20250414-xorm-update-process_design.png)

## Implementation

Below is the core implementation code for the refactoring. The complete code can be viewed in the GitHub repository: [Complete Code](https://github.com/gone-io/goner/tree/main/xorm).

### 1. Implement xormProvider and Related Providers
First, implement xormProvider and its wrapper classes xormEngineProvider and xormGroupProvider to provide native xorm objects:
```go
// xorm_provide.go
package xorm

import (
    "fmt"
    "github.com/gone-io/gone/v2"
    "xorm.io/xorm"
)

type xormProvider struct {
    gone.Flag
    configure gone.Configure   `gone:"configure"`
    logger    gone.Logger      `gone:"*"`
    policy    xorm.GroupPolicy `gone:"*" option:"allowNil"`

    dbMap map[string]xorm.EngineInterface
}

func (s *xormProvider) Init() {
    s.dbMap = make(map[string]xorm.EngineInterface)
}

// ... omitted code

// Provide provides xorm.EngineInterface instances based on tag configuration
func (s *xormProvider) Provide(tag string) (eng xorm.EngineInterface, err error) {
    dbName := getDbName(tag)

    if eng = s.dbMap[dbName]; eng == nil {
        eng, err = s.configAndInitDb(dbName)
        if err != nil {
            return nil, gone.ToError(err)
        }
        s.dbMap[dbName] = eng
    }
    return eng, nil
}

// configAndInitDb configures and initializes database connection based on database name
func (s *xormProvider) configAndInitDb(dbName string) (eng xorm.EngineInterface, err error) {
    var config Conf
    var enableCluster bool

    _ = s.configure.Get(dbName, &config, "")
    _ = s.configure.Get(dbName+".cluster.enable", &enableCluster, "false")

    if !enableCluster {
        // Create single database connection
        eng, err = xorm.NewEngine(config.DriverName, config.Dsn)
        if err != nil {
            return nil, gone.ToErrorWithMsg(err, "failed to create engine for db: "+dbName)
        }
    } else {
        // Create database cluster connection
        // ... code omitted
    }

    // Configure database connection pool and other options
    if config.MaxIdleCount > 0 {
        eng.SetMaxIdleConns(config.MaxIdleCount)
    }
    if config.MaxOpen > 0 {
        eng.SetMaxOpenConns(config.MaxOpen)
    }
    if config.MaxLifetime > 0 {
        eng.SetConnMaxLifetime(config.MaxLifetime)
    }
    eng.ShowSQL(config.ShowSql)
    eng.SetLogger(&dbLogger{Logger: s.logger, showSql: config.ShowSql})
    // Check connection availability based on configuration
    if config.PingAfterInit {
        if err = eng.Ping(); err != nil {
            return nil, gone.ToErrorWithMsg(err, "failed to ping db: "+dbName)
        }
    }
    return eng, nil
}

// Provide native Engine instance
func (s *xormProvider) ProvideEngine(tagConf string) (*xorm.Engine, error) {
    // ... code omitted
}

// Provide native EngineGroup instance
func (s *xormProvider) ProvideEngineGroup(tagConf string) (*xorm.EngineGroup, error) {
    // ... code omitted
}

// Wrap function Provider to provide *xorm.Engine
var xormEngineProvider = gone.WrapFunctionProvider(func(tagConf string, param struct {
    xormProvider *xormProvider `gone:"*"`
}) (*xorm.Engine, error) {
    return param.xormProvider.ProvideEngine(tagConf)
})

// Wrap function Provider to provide *xorm.EngineGroup
var xormGroupProvider = gone.WrapFunctionProvider(func(tagConf string, param struct {
    xormProvider *xormProvider `gone:"*"`
}) (*xorm.EngineGroup, error) {
    return param.xormProvider.ProvideEngineGroup(tagConf)
})
```

This code's main functionality is to parse configuration files, create database connections based on configuration, and provide native xorm engine objects. Key points include:

- Support for single database connection and master-slave cluster connection

- Implementation of configuration parsing and database connection pool configuration

- Provision of native xorm.Engine and xorm.EngineGroup instances

### 2. Implement Transaction Enhancement

Next, implement the transaction enhancement part to provide nested transaction support:
```go
// trans.go
package xorm

import (
    "fmt"
    "github.com/gone-io/gone/v2"
    "github.com/jtolds/gls"
    "sync"
)

func newTrans(logger gone.Logger, newSession func() Session) trans {
    return trans{
        logger:     logger,
        newSession: newSession,
    }
}

type trans struct {
    logger     gone.Logger
    newSession func() Session
}

var sessionMap = sync.Map{}

// Get transaction session, create a new session if current goroutine has no transaction
func (e *trans) getTransaction(id uint) (Session, bool) {
    session, suc := sessionMap.Load(id)
    if suc {
        return session.(Session), false
    } else {
        s := e.newSession()
        sessionMap.Store(id, s)
        return s, true
    }
}

// Delete transaction and close session
func (e *trans) delTransaction(id uint, session Session) error {
    defer sessionMap.Delete(id)
    return session.Close()
}

// Transaction executes SQL within a transaction
func (e *trans) Transaction(fn func(session Interface) error) error {
    var err error
    gls.EnsureGoroutineId(func(gid uint) {
        session, isNew := e.getTransaction(gid)

        if isNew {
            // Current goroutine has no active transaction, create new transaction
            rollback := func() {
                rollbackErr := session.Rollback()
                if rollbackErr != nil {
                    e.logger.Errorf("rollback err:%v", rollbackErr)
                    err = gone.ToErrorWithMsg(err, fmt.Sprintf("rollback error: %v", rollbackErr))
                }
            }

            isRollback := false
            defer func(e *trans, id uint, session Session) {
                err := e.delTransaction(id, session)
                if err != nil {
                    e.logger.Errorf("del session err:%v", err)
                }
            }(e, gid, session)

            // Handle panic situations, ensure transaction rollback
            defer func() {
                if info := recover(); info != nil {
                    e.logger.Errorf("session rollback for panic: %s", info)
                    e.logger.Errorf("%s", gone.PanicTrace(2, 1))
                    if !isRollback {
                        rollback()
                        err = gone.NewInnerError(fmt.Sprintf("%s", info), gone.DbRollForPanicError)
                    } else {
                        err = gone.ToErrorWithMsg(info, fmt.Sprintf("rollback for err: %v, but panic for", err))
                    }
                }
            }()

            // Begin transaction
            err = session.Begin()
            if err != nil {
                err = gone.ToError(err)
                return
            }

            // Execute user function
            err = gone.ToError(fn(session))
            if err == nil {
                // Transaction commit
                err = gone.ToError(session.Commit())
            } else {
                // Transaction rollback
                e.logger.Errorf("session rollback for err: %v", err)
                isRollback = true
                rollback()
            }
        } else {
            // Current goroutine already has active transaction, reuse existing transaction
            err = gone.ToError(fn(session))
        }
    })
    return err
}
```

The core of transaction enhancement is implemented through goroutine local storage (gls), which allows:

- Automatic sharing of transaction context within the same goroutine

- Support for nested transaction calls, inner transaction functions automatically use outer transaction

- Provide unified error handling and rollback mechanism

### 3. Implement Engine Encapsulation

Then implement the eng structure to encapsulate the native xorm interface and enhance functionality:

```go
//eng.go
package xorm

import (
    "github.com/gone-io/gone/v2"
    "xorm.io/xorm"
)

func newEng(xEng xorm.EngineInterface, logger gone.Logger) *eng {
    e := eng{EngineInterface: xEng}
    e.trans = newTrans(logger, func() Session {
        return e.NewSession()
    })
    return &e
}

type eng struct {
    xorm.EngineInterface  // Embed native xorm interface
    trans                 // Embed transaction enhancement functionality
}

// Get original engine instance
func (e *eng) GetOriginEngine() xorm.EngineInterface {
    return e.EngineInterface
}

// Set master-slave policy
func (e *eng) SetPolicy(policy xorm.GroupPolicy) {
    if group, ok := e.EngineInterface.(*xorm.EngineGroup); ok {
        group.SetPolicy(policy)
    }
}

// Enhanced SQL building functionality
func (e *eng) Sqlx(sql string, args ...any) *xorm.Session {
    sql, args = sqlDeal(sql, args...)
    return e.SQL(sql, args...)
}
```

This encapsulation layer implements:

- Embedding native xorm interface to maintain API compatibility

- Integration of transaction enhancement functionality

- Addition of SQL building enhancement functionality

### 4. Implement Engine Provider

Finally, implement engProvider to provide enhanced Engine instances for the application:
```go
//eng_provider.go
package xorm

import (
    "github.com/gone-io/gone/v2"
    "github.com/spf13/cast"
    "reflect"
)

type engProvider struct {
    gone.Flag
    logger    gone.Logger   `gone:"*"`
    xProvider *xormProvider `gone:"*"`
}

func (s *engProvider) GonerName() string {
    return "xorm" // Register as xorm name
}

// Provide instances, providing different instances based on type and configuration
func (s *engProvider) Provide(tagConf string, t reflect.Type) (any, error) {
    switch t {
    case xormInterfaceSlice: // Provide Engine slice
        group, err := s.xProvider.ProvideEngineGroup(tagConf)
        if err != nil {
            return nil, gone.ToError(err)
        }
        slaves := group.Slaves()
        engines := make([]Engine, 0, len(slaves))
        for _, slave := range slaves {
            engines = append(engines, newEng(slave, s.logger))
        }
        return engines, nil
    case xormInterface: // Provide single Engine
        return s.ProvideEngine(tagConf)
    default:
        return nil, gone.NewInnerErrorWithParams(gone.GonerTypeNotMatch, "Cannot find matched value for %q", gone.GetTypeName(t))
    }
}

// Provide Engine instance based on tag configuration
func (s *engProvider) ProvideEngine(tagConf string) (Engine, error) {
    m, _ := gone.TagStringParse(tagConf)

    // Handle master flag
    if v, ok := m[masterKey]; ok && (v == "" || cast.ToBool(v)) {
        group, err := s.xProvider.ProvideEngineGroup(tagConf)
        if err != nil {
            return nil, gone.ToError(err)
        }
        return newEng(group.Master(), s.logger), nil
    }

    // Handle slave flag
    if index, ok := m[slaveKey]; ok {
        i := cast.ToInt(index)
        group, err := s.xProvider.ProvideEngineGroup(tagConf)
        if err != nil {
            return nil, gone.ToError(err)
        }
        slaves := group.Slaves()
        if i < 0 || i >= len(slaves) {
            return nil, gone.ToError("slave index out of range")
        }
        return newEng(slaves[i], s.logger), nil
    }

    // Provide default engine
    provideEngine, err := s.xProvider.Provide(tagConf)
    if err != nil {
        return nil, gone.ToError(err)
    }
    return newEng(provideEngine, s.logger), nil
}
```

This Provider implements:

- Registering itself as "xorm" name, maintaining consistency with original injection tags

- Ability to provide single Engine instance or Engine slice

- Providing master database, slave database, or default database instance based on tag configuration

- Using newEng to wrap native engine instances, enhancing their functionality

## Testing

### Test Coverage
Testing is key to validating the success of the refactoring. Through comprehensive test cases, we can not only verify functional correctness but also improve code test coverage.

Test Coverage

As shown in the image, the code test coverage has significantly improved after refactoring.
![](/img/20250414-xorm-update-process_codecov.png)

### Here is some test code showing how to test xormProvider:

```go
// xorm_provider_test.go
package xorm

import (
    "database/sql"
    "github.com/DATA-DOG/go-sqlmock"
    "github.com/gone-io/gone/v2"
    "github.com/stretchr/testify/assert"
    "os"
    "testing"
    "xorm.io/xorm"
)

func Test_xormProvider_Init(t *testing.T) {
    // Create SQL mock for simulating database operations without real database
    db, mock, _ := sqlmock.NewWithDSN(
        "root@/blog",
        sqlmock.MonitorPingsOption(true),
    )
    defer db.Close()

    // Register mock database driver
    drivers := sql.Drivers()
    if !contains(drivers, "mysql") {
        sql.Register("mysql", db.Driver())
    }

    // Define test case structure
    type Tests struct {
        name        string
        before      func()         // Preparation before test
        after       func()         // Cleanup after test
        exceptPanic bool           // Whether panic is expected
        injectFn    any            // Dependency injection test function
    }

    tests := []Tests{
        {
            name: "inject default db failed",
            before: func() {
                // Set incorrect driver name, expecting failure
                _ = os.Setenv("GONE_DATABASE", `{
                    "driver-name":"error",
                    "dsn": "root@/blog",
                    "max-idle-count": 5,
                    "max-open": 10,
                    "max-lifetime": 10000,
                    "show-sql": true,
                    "ping-after-init": true
```