/**
 * Dynamic AI Assessment & Adaptive Question Generator Service - Skill Point
 * 
 * Module 4: Dynamic Level-Based Adaptive Assessment Engine
 * 
 * Key Principles:
 *  • NO hard limit of 5 questions.
 *  • Minimum 10 questions for EVERY difficulty level (Beginner: 10 min, Intermediate: 10 min, Advanced: 10 min).
 *  • Dynamic & Adaptive question count scaling:
 *     - Scales to 15–20+ questions when multiple skill gaps exist (e.g. 6 weak skills -> 15-20 questions).
 *     - Ensures every important missing/partial skill receives sufficient diagnostic coverage (2–3 questions each).
 *     - Adjusts based on JD importance, current skill level, and previous assessment performance.
 *  • Strict deduplication:
 *     - Zero duplicate questions within the same assessment session.
 *     - Prioritizes unseen questions across previous assessment attempts.
 *  • Broad question repository & procedural scenario generators across all modern engineering skills.
 */

import { getCanonicalSkillName } from "./skillMatchingService.js";

// =====================================================================
// 1. QUESTION REPOSITORY BY SKILL & DIFFICULTY LEVEL
//    Level 1: Beginner / Fundamentals & Core Syntax
//    Level 2: Intermediate / Core Engineering & Architecture
//    Level 3: Advanced / Production Scenarios, Concurrency & Resiliency
// =====================================================================

export const QUESTION_GENERATORS = {
  "Spring Boot": {
    1: [
      () => ({
        question: "In Spring Boot, which annotation is used to mark a class as a REST controller that combines @Controller and @ResponseBody?",
        options: ["@RestController", "@Service", "@Component", "@Repository"],
        answer: 0,
        explanation: "@RestController is a convenience annotation that combines @Controller and @ResponseBody, automatically serializing return values to JSON.",
      }),
      () => ({
        question: "Which file is the primary configuration file for a standard Spring Boot application?",
        options: ["application.properties or application.yml", "pom.xml", "web.xml", "context.xml"],
        answer: 0,
        explanation: "Spring Boot uses application.properties or application.yml located in src/main/resources for application settings.",
      }),
      () => ({
        question: "Which annotation is used to automatically inject bean dependencies into a Spring managed class?",
        options: ["@Autowired", "@InjectBean", "@ResourceBean", "@Provide"],
        answer: 0,
        explanation: "@Autowired allows Spring's dependency injection container to automatically inject dependent beans.",
      }),
      () => ({
        question: "What is the default embedded servlet container used by Spring Boot starter web?",
        options: ["Tomcat", "Jetty", "Undertow", "GlassFish"],
        answer: 0,
        explanation: "Spring Boot Starter Web configures Apache Tomcat as the default embedded servlet container.",
      }),
      () => ({
        question: "Which annotation is used on the main application class to enable auto-configuration, component scanning, and extra configuration?",
        options: ["@SpringBootApplication", "@EnableAutoConfiguration", "@Configuration", "@ComponentScan"],
        answer: 0,
        explanation: "@SpringBootApplication encapsulates @Configuration, @EnableAutoConfiguration, and @ComponentScan.",
      }),
    ],
    2: [
      () => ({
        question: "How do you handle global exceptions across all controllers in a Spring Boot application?",
        options: [
          "Create a class annotated with @ControllerAdvice and methods with @ExceptionHandler",
          "Wrap every controller method in a try-catch block",
          "Override the default ErrorHandler in application.properties",
          "Implement the GlobalServletListener interface",
        ],
        answer: 0,
        explanation: "@ControllerAdvice combined with @ExceptionHandler provides centralized, clean error handling across all controllers.",
      }),
      () => ({
        question: "In Spring Data JPA, which annotation is placed on a repository method to execute a custom JPQL or native SQL update statement?",
        options: ["@Modifying alongside @Query", "@Transactional only", "@UpdateQuery", "@NativeExecute"],
        answer: 0,
        explanation: "@Modifying must be used with @Query for INSERT, UPDATE, or DELETE operations in Spring Data JPA repositories.",
      }),
      () => ({
        question: "What does the @Transactional annotation guarantee when applied to a service method?",
        options: [
          "The method executes inside a database transaction conforming to ACID properties",
          "The method becomes multi-threaded and thread-safe",
          "HTTP responses are automatically cached in Redis",
          "All exceptions are suppressed without rolling back",
        ],
        answer: 0,
        explanation: "@Transactional wraps method execution in a database transaction, rolling back automatically on unchecked exceptions.",
      }),
      () => ({
        question: "How does Spring Boot Actuator help in production environments?",
        options: [
          "Exposes operational endpoints for health, metrics, environment, and thread dumps",
          "Generates automatic frontend HTML pages for users",
          "Compresses database tables on startup",
          "Encrypts all HTTP traffic automatically",
        ],
        answer: 0,
        explanation: "Spring Boot Actuator provides built-in HTTP endpoints like /actuator/health and /actuator/metrics for production monitoring.",
      }),
      () => ({
        question: "What is the default bean scope in Spring Framework if no @Scope annotation is declared?",
        options: ["Singleton", "Prototype", "Request", "Session"],
        answer: 0,
        explanation: "In Spring, beans are singletons by default: only a single shared instance is created per ApplicationContext.",
      }),
    ],
    3: [
      () => ({
        question: "In a high-throughput Spring Boot service, what happens if a @Transactional method calls another @Transactional method within the SAME class?",
        options: [
          "The inner method's transaction configuration is bypassed because calls bypass Spring's CGLIB proxy",
          "A nested transaction is created automatically with isolation rollback",
          "Spring throws an IllegalTransactionStateException at runtime",
          "The thread deadlocks waiting for the outer transaction lock",
        ],
        answer: 0,
        explanation: "Self-invocation of @Transactional methods within the same class bypasses Spring's AOP proxy, so inner transaction attributes are ignored.",
      }),
      () => ({
        question: "When diagnosing high latency in a Spring Boot application under load, which thread pool should be tuned to prevent request queue saturation?",
        options: [
          "server.tomcat.threads.max and server.tomcat.accept-count",
          "spring.jpa.properties.hibernate.jdbc.batch_size",
          "spring.servlet.multipart.max-request-size",
          "management.endpoints.web.exposure.include",
        ],
        answer: 0,
        explanation: "Tuning Tomcat's max worker threads and accept-count queue size directly impacts how many incoming HTTP connections can be serviced under concurrent load.",
      }),
      () => ({
        question: "In Spring Boot with HikariCP, how should database connection pool timeouts be configured to prevent thread starvation during database slowdowns?",
        options: [
          "Set connectionTimeout lower than HTTP gateway request timeouts and configure a sensible leakDetectionThreshold",
          "Set maximumPoolSize to unlimited to avoid queuing",
          "Disable connection testing on borrow",
          "Increase idleTimeout to 24 hours",
        ],
        answer: 0,
        explanation: "Setting connectionTimeout lower than upstream gateway timeouts prevents requests from hanging indefinitely, while leak detection pinpoints unclosed connections.",
      }),
    ],
  },

  "Java": {
    1: [
      () => ({
        question: "Which of the following is NOT a primitive data type in Java?",
        options: ["String", "int", "boolean", "double"],
        answer: 0,
        explanation: "String is an immutable reference class in java.lang, whereas int, boolean, and double are primitive types.",
      }),
      () => ({
        question: "What is the default value of an uninitialized boolean instance variable in a Java class?",
        options: ["false", "true", "null", "0"],
        answer: 0,
        explanation: "In Java, primitive boolean instance variables default to false.",
      }),
      () => ({
        question: "Which keyword is used to prevent method overriding or class inheritance in Java?",
        options: ["final", "static", "const", "abstract"],
        answer: 0,
        explanation: "The 'final' keyword on a class prevents inheritance; on a method, it prevents overriding in subclasses.",
      }),
      () => ({
        question: "Which collection interface does ArrayList implement for fast constant-time index lookups?",
        options: ["List and RandomAccess", "Queue", "Set", "Deque"],
        answer: 0,
        explanation: "ArrayList implements List and the marker interface RandomAccess, enabling O(1) indexed positional access.",
      }),
    ],
    2: [
      () => ({
        question: "Why should you override hashCode() whenever you override equals() in a Java class?",
        options: [
          "To maintain the contract that equal objects must have identical hash codes for hash collections like HashMap",
          "To prevent Java garbage collector memory leaks",
          "To enable deep cloning of objects",
          "It is required by the JVM compiler or it fails to compile",
        ],
        answer: 0,
        explanation: "If two objects are equal according to equals(), they must produce the same hashCode to function correctly in Hash-based collections.",
      }),
      () => ({
        question: "What is the difference between Comparable and Comparator interfaces in Java?",
        options: [
          "Comparable defines natural ordering via compareTo(o), while Comparator defines custom external ordering via compare(o1, o2)",
          "Comparable is used for multi-threading, while Comparator is for sorting",
          "Comparable cannot be used with Lambda expressions, but Comparator can",
          "There is no difference; they are aliases",
        ],
        answer: 0,
        explanation: "Comparable modifies the class itself for natural sorting, while Comparator allows defining multiple independent sorting strategies.",
      }),
      () => ({
        question: "How does Java handle unchecked exceptions (RuntimeException) compared to checked exceptions (Exception)?",
        options: [
          "Unchecked exceptions do not need to be declared in method throws signatures or caught explicitly at compile time",
          "Unchecked exceptions crash the JVM immediately without stack traces",
          "Checked exceptions only occur at build time",
          "Unchecked exceptions are ignored by the compiler and never thrown",
        ],
        answer: 0,
        explanation: "Subclasses of RuntimeException are unchecked and can be thrown without mandatory catch or throws declarations.",
      }),
    ],
    3: [
      () => ({
        question: "What does the 'volatile' keyword guarantee in Java multi-threaded memory visibility?",
        options: [
          "Writes to the variable are immediately visible to all threads and prevents instruction reordering around that variable",
          "It acquires a mutual exclusion lock on the object",
          "It makes compound operations like counter++ atomic",
          "It stores the variable permanently on the disk",
        ],
        answer: 0,
        explanation: "volatile guarantees memory visibility across threads and establishes a happens-before relationship, but does NOT make compound operations atomic.",
      }),
      () => ({
        question: "How does Java's Garbage Collector handle objects referenced only by WeakReferences?",
        options: [
          "They are collected during the very next GC cycle when memory is needed, regardless of memory pressure",
          "They are never collected until the JVM shuts down",
          "They are promoted directly to the Old/Tenured Generation",
          "They cause an OutOfMemoryError if not manually cleared",
        ],
        answer: 0,
        explanation: "WeakReferences are cleared eagerly by the garbage collector once an object has no strong or soft references pointing to it.",
      }),
      () => ({
        question: "What causes a ConcurrentModificationException when iterating over a standard ArrayList?",
        options: [
          "Modifying the list structurally (add/remove) directly without using the Iterator's own remove() method",
          "Reading elements from two separate threads simultaneously",
          "Using an enhanced for-loop on a read-only list",
          "Calling Collections.sort() before iteration",
        ],
        answer: 0,
        explanation: "ArrayList uses a modCount tracker; structural modifications during iteration violate fail-fast checks.",
      }),
    ],
  },

  "SQL": {
    1: [
      () => ({
        question: "Which SQL clause is used to filter records before any GROUP BY aggregation takes place?",
        options: ["WHERE", "HAVING", "ORDER BY", "LIMIT"],
        answer: 0,
        explanation: "WHERE filters rows before grouping and aggregation, whereas HAVING filters groups after aggregation.",
      }),
      () => ({
        question: "What type of JOIN returns all records from the left table and matched records from the right table?",
        options: ["LEFT JOIN", "INNER JOIN", "FULL OUTER JOIN", "CROSS JOIN"],
        answer: 0,
        explanation: "LEFT JOIN returns all rows from the left table, with NULLs for unmatched rows from the right table.",
      }),
      () => ({
        question: "Which constraint uniquely identifies each record in a database table and disallows NULL values?",
        options: ["PRIMARY KEY", "FOREIGN KEY", "UNIQUE", "CHECK"],
        answer: 0,
        explanation: "A PRIMARY KEY constraint enforces unique non-null identification for table rows.",
      }),
    ],
    2: [
      () => ({
        question: "What is the primary difference between WHERE and HAVING clauses in SQL?",
        options: [
          "WHERE filters individual rows before aggregation; HAVING filters aggregated groups created by GROUP BY",
          "WHERE is faster because it uses indexes; HAVING cannot use indexes",
          "HAVING cannot use aggregate functions like COUNT() or SUM()",
          "There is no difference; they are interchangeable",
        ],
        answer: 0,
        explanation: "WHERE evaluates row-by-row before GROUP BY; HAVING evaluates aggregate expressions after grouping.",
      }),
      () => ({
        question: "What does the ACID property 'Isolation' prevent in relational database transactions?",
        options: [
          "Concurrent transactions from interfering with each other's uncommitted data",
          "Database crashes from losing committed transactions",
          "Data type mismatches during insert",
          "Disk fragmentation on large tables",
        ],
        answer: 0,
        explanation: "Isolation ensures concurrent transaction execution produces state equivalent to serial execution, preventing anomalies like dirty reads.",
      }),
      () => ({
        question: "In SQL, what is the key functional difference between UNION and UNION ALL?",
        options: [
          "UNION removes duplicate rows across result sets, while UNION ALL retains duplicates and executes faster",
          "UNION ALL sorts the result, while UNION does not",
          "UNION can only be used on numerical columns",
          "UNION ALL is only supported in NoSQL databases",
        ],
        answer: 0,
        explanation: "UNION performs a distinct deduplication sort, while UNION ALL concatenates results directly without duplicate checks.",
      }),
    ],
    3: [
      () => ({
        question: "What is the difference between a Clustered Index and a Non-Clustered Index in relational databases?",
        options: [
          "A clustered index determines the physical storage order of rows in the table (one per table), while non-clustered indexes store pointers to rows",
          "A clustered index is always in memory, while non-clustered indexes are on disk",
          "You can have unlimited clustered indexes per table",
          "Non-clustered indexes cannot be used for WHERE clauses",
        ],
        answer: 0,
        explanation: "Table rows can only be physically sorted one way, so only one Clustered Index can exist per table. Non-clustered indexes are separate lookup structures pointing to the data.",
      }),
      () => ({
        question: "How do you resolve a Phantom Read anomaly in standard SQL transaction isolation levels?",
        options: [
          "Elevate the transaction isolation level to SERIALIZABLE (or use range locks)",
          "Use READ COMMITTED with optimistic row versions",
          "Add non-clustered indexes to foreign keys",
          "Disable auto-commit and increase statement timeout",
        ],
        answer: 0,
        explanation: "Phantom reads occur when concurrent transactions insert rows satisfying a query range; SERIALIZABLE prevents this via predicate or index-range locking.",
      }),
    ],
  },

  "PostgreSQL": {
    1: [
      () => ({
        question: "Which PostgreSQL data type is specifically optimized for storing and querying semi-structured JSON documents with index support?",
        options: ["JSONB", "JSON", "TEXT", "BYTEA"],
        answer: 0,
        explanation: "JSONB stores JSON in a decomposed binary format that supports GIN indexing and fast operator lookups.",
      }),
      () => ({
        question: "What command in PostgreSQL provides detailed execution plans and estimated costs for a SQL query?",
        options: ["EXPLAIN (ANALYZE)", "DESCRIBE QUERY", "SHOW PLAN", "PROFILER ON"],
        answer: 0,
        explanation: "EXPLAIN ANALYZE runs the query and prints execution timing, node steps, and planning costs.",
      }),
    ],
    2: [
      () => ({
        question: "What index type in PostgreSQL is best suited for full-text search, arrays, and JSONB containment operators?",
        options: ["GIN (Generalized Inverted Index)", "B-Tree", "Hash", "BRIN"],
        answer: 0,
        explanation: "GIN indexes map elements (such as array values, JSON keys, or text tokens) to the rows containing them.",
      }),
      () => ({
        question: "Why does PostgreSQL require the VACUUM process in its MVCC implementation?",
        options: [
          "To reclaim dead row versions left by UPDATE and DELETE statements and prevent transaction ID wraparound",
          "To recompile stored procedures into native C code",
          "To compress foreign key relationships",
          "To restart the PostgreSQL server daemon automatically",
        ],
        answer: 0,
        explanation: "PostgreSQL's multi-version concurrency control marks updated/deleted rows as dead tuples; VACUUM reclaims the disk space.",
      }),
    ],
    3: [
      () => ({
        question: "When query execution suffers from severe sequential scans despite an existing index, what is the most likely cause in PostgreSQL?",
        options: [
          "Outdated planner statistics, requiring an ANALYZE on the table, or high selectivity fraction favoring sequential reads",
          "Corrupted PostgreSQL binaries",
          "Too many primary keys on the schema",
          "Using UTF-8 database encoding",
        ],
        answer: 0,
        explanation: "If pg_statistic estimates that a high percentage of rows will be returned, or statistics are stale, the cost planner chooses sequential scans over random index page fetches.",
      }),
    ],
  },

  "Docker": {
    1: [
      () => ({
        question: "Which Docker command is used to build a container image from a Dockerfile in the current directory?",
        options: ["docker build -t image_name .", "docker run -b .", "docker compile image_name", "docker create image_name"],
        answer: 0,
        explanation: "'docker build -t <tag> .' instructs the Docker daemon to build an image from the Dockerfile in the specified context.",
      }),
      () => ({
        question: "What is the key difference between a Docker Image and a Docker Container?",
        options: [
          "An image is an immutable template/blueprint, while a container is a running, writable instance of that image",
          "An image is for production, a container is only for development",
          "A container contains the source code, an image only contains the OS",
          "There is no difference",
        ],
        answer: 0,
        explanation: "A Docker image is a read-only snapshot; a container is a live runtime instance with a writable layer.",
      }),
      () => ({
        question: "Which Dockerfile instruction sets the default command that runs when a container launches?",
        options: ["CMD or ENTRYPOINT", "RUN", "EXPOSE", "WORKDIR"],
        answer: 0,
        explanation: "ENTRYPOINT and CMD specify the default executable and arguments executed upon container startup.",
      }),
    ],
    2: [
      () => ({
        question: "Why are Multi-Stage builds recommended in production Dockerfiles?",
        options: [
          "To separate build tools and SDKs from the final runtime container, drastically reducing image size and attack surface",
          "To run multiple containers on a single port",
          "To automatically publish images to Docker Hub",
          "To allow multiple base operating systems simultaneously",
        ],
        answer: 0,
        explanation: "Multi-stage builds compile artifacts in an intermediate container and copy only the binary to a minimal runtime image, keeping images lightweight and secure.",
      }),
      () => ({
        question: "How do Docker volumes provide persistent storage for containers?",
        options: [
          "Volumes bypass the union file system, writing directly to designated host storage managed by Docker",
          "Volumes store data inside the container's temporary writable layer",
          "Volumes encrypt data and send it to Docker Hub cloud storage",
          "Volumes only persist data while the host machine remains powered on",
        ],
        answer: 0,
        explanation: "Docker volumes are directories outside the container's union filesystem, preserving data across container restarts and destruction.",
      }),
    ],
    3: [
      () => ({
        question: "How do Docker bridge networks provide service discovery between containers in Docker Compose?",
        options: [
          "Containers on user-defined bridge networks resolve each other by container/service name via an embedded DNS server",
          "Containers must hardcode the host machine's public IP address",
          "All containers share the exact same localhost loopback interface",
          "Docker Compose modifies the host /etc/hosts file dynamically",
        ],
        answer: 0,
        explanation: "Docker provides an automatic embedded DNS server on user-defined networks that resolves service names to internal container IP addresses.",
      }),
      () => ({
        question: "What signal does Docker send to a container's PID 1 during 'docker stop', and what happens if it is ignored?",
        options: [
          "Sends SIGTERM, waits 10 seconds for graceful shutdown, then sends SIGKILL",
          "Sends SIGINT immediately followed by SIGSTOP",
          "Sends SIGHUP to reload configs",
          "Restarts the container automatically",
        ],
        answer: 0,
        explanation: "Docker issues SIGTERM to allow graceful teardown; if the process does not terminate within the grace period (default 10s), SIGKILL force-terminates it.",
      }),
    ],
  },

  "Kubernetes": {
    1: [
      () => ({
        question: "What is the smallest deployable compute unit in a Kubernetes cluster?",
        options: ["Pod", "Container", "Node", "Deployment"],
        answer: 0,
        explanation: "A Pod is the basic execution unit in Kubernetes, representing a single instance of an application that encapsulates one or more containers.",
      }),
      () => ({
        question: "Which Kubernetes resource manages rolling updates, rollbacks, and replica counts for stateless Pods?",
        options: ["Deployment", "DaemonSet", "StatefulSet", "ConfigMap"],
        answer: 0,
        explanation: "A Deployment declarative controller manages ReplicaSets and automated rolling updates for Pods.",
      }),
      () => ({
        question: "Which Kubernetes CLI tool is used to run commands against Kubernetes clusters?",
        options: ["kubectl", "kubeadm", "minikube", "helm"],
        answer: 0,
        explanation: "kubectl is the primary command-line tool for interacting with the Kubernetes control plane.",
      }),
    ],
    2: [
      () => ({
        question: "What is the purpose of a Kubernetes Service of type ClusterIP?",
        options: [
          "Provides a stable internal virtual IP and DNS name that load-balances traffic across matching Pods inside the cluster",
          "Exposes the Pods directly to the public internet via public DNS",
          "Mounts block storage disks to container pods",
          "Backs up etcd database snapshots automatically",
        ],
        answer: 0,
        explanation: "ClusterIP is the default Service type, providing a stable cluster-internal endpoint and kube-proxy load balancing for Pods.",
      }),
      () => ({
        question: "What is the difference between a Liveness Probe and a Readiness Probe in Kubernetes?",
        options: [
          "Liveness probe determines if a container needs to be restarted; Readiness probe determines if a container is ready to accept network traffic",
          "Liveness probe runs only once at startup; Readiness runs continuously",
          "Readiness probe restarts the container when it fails",
          "There is no difference; they are synonymous",
        ],
        answer: 0,
        explanation: "If a liveness probe fails, the kubelet kills and restarts the container. If a readiness probe fails, the Pod is temporarily removed from Service load balancer endpoints.",
      }),
    ],
    3: [
      () => ({
        question: "What causes a Pod to enter CrashLoopBackOff state in production Kubernetes environments?",
        options: [
          "The container terminates immediately after launch due to configuration errors, unhandled exceptions, or missing dependencies",
          "The Kubernetes worker node ran out of disk space for logs",
          "etcd lost quorum during leader election",
          "The cluster ingress controller was deleted",
        ],
        answer: 0,
        explanation: "CrashLoopBackOff indicates that the container repeatedly starts, crashes, and the kubelet applies exponential backoff delays before retrying.",
      }),
      () => ({
        question: "In Kubernetes, how does an Horizontal Pod Autoscaler (HPA) make scaling decisions without thrashing?",
        options: [
          "Calculates desired replicas using metric ratios (current/target) and applies stabilization windows and cooldown delays",
          "Doubles replicas every 3 seconds until CPU drops below 10%",
          "Scales pods only during maintenance windows",
          "Reboots nodes when memory exceeds 80%",
        ],
        answer: 0,
        explanation: "HPA queries metrics-server, computes desired replicas = ceil(currentReplicas * (currentMetricValue / targetMetricValue)), and enforces stabilization windows.",
      }),
    ],
  },

  "REST API": {
    1: [
      () => ({
        question: "Which HTTP method is specifically intended to be idempotent and used to retrieve resources without modifying server state?",
        options: ["GET", "POST", "PATCH", "CONNECT"],
        answer: 0,
        explanation: "GET requests should be safe and idempotent, retrieving resource representation without side effects.",
      }),
      () => ({
        question: "Which HTTP status code indicates that a new resource was successfully created on the server?",
        options: ["201 Created", "200 OK", "204 No Content", "202 Accepted"],
        answer: 0,
        explanation: "201 Created is the standard HTTP response status code for successful resource creation (typically returned from POST).",
      }),
      () => ({
        question: "Which HTTP status code should be returned when an unauthenticated client attempts to access a protected endpoint?",
        options: ["401 Unauthorized", "403 Forbidden", "404 Not Found", "500 Internal Error"],
        answer: 0,
        explanation: "401 Unauthorized indicates that the request lacks valid authentication credentials.",
      }),
    ],
    2: [
      () => ({
        question: "What is the key architectural difference between PUT and PATCH HTTP methods?",
        options: [
          "PUT replaces the entire resource representation, while PATCH applies partial modifications",
          "PUT is non-idempotent while PATCH is always idempotent",
          "PUT is only for file uploads, PATCH is for JSON",
          "PATCH cannot return a response body",
        ],
        answer: 0,
        explanation: "PUT is designed for full resource replacement (idempotent), whereas PATCH is used for partial updates.",
      }),
      () => ({
        question: "What header is used in REST APIs to support client-side caching and conditional GET requests with ETags?",
        options: ["If-None-Match", "Authorization", "X-Cache-Status", "Accept-Encoding"],
        answer: 0,
        explanation: "Clients send If-None-Match with an ETag value; if the resource is unchanged, the server responds with 304 Not Modified without sending the body.",
      }),
    ],
    3: [
      () => ({
        question: "In distributed REST architectures, how do Idempotency Keys prevent duplicate charges on payment POST endpoints?",
        options: [
          "The server caches the unique key and returns the original cached response if a duplicate request arrives during retries",
          "The client generates an auto-incrementing database ID",
          "The server converts POST to GET automatically",
          "Idempotency keys disable network timeouts",
        ],
        answer: 0,
        explanation: "Idempotency keys allow clients to safely retry network failures without processing identical transactions twice.",
      }),
      () => ({
        question: "How should an enterprise REST API handle API versioning to prevent breaking existing mobile and third-party consumers?",
        options: [
          "Use URI path versioning (/v1/users) or custom vendor media type headers (Accept: application/vnd.company.v1+json)",
          "Never change field names and always return HTTP 200",
          "Force all clients to upgrade simultaneously",
          "Randomize endpoint URLs per deployment",
        ],
        answer: 0,
        explanation: "URI path versioning or content negotiation headers allow multiple API versions to coexist stably without breaking older clients.",
      }),
    ],
  },

  "Microservices": {
    1: [
      () => ({
        question: "What is a core benefit of a microservices architecture compared to a monolithic architecture?",
        options: [
          "Independent deployability, scalability, and localized technology choices per service",
          "Simpler distributed debugging and zero network latency",
          "Guaranteed zero network failures between modules",
          "A single shared database table for all domain entities",
        ],
        answer: 0,
        explanation: "Microservices enable distinct bounded contexts to be independently built, scaled, and deployed by autonomous teams.",
      }),
      () => ({
        question: "What pattern is commonly placed in front of microservices to handle routing, SSL termination, and rate limiting?",
        options: ["API Gateway", "Message Broker", "Service Registry", "Distributed Tracing"],
        answer: 0,
        explanation: "An API Gateway serves as a single entry point for clients, routing requests to downstream microservices.",
      }),
    ],
    2: [
      () => ({
        question: "In a microservices architecture, how should distributed transactions across multiple services be handled?",
        options: [
          "Using the Saga Pattern with compensating transactions or event choreographies",
          "Using two-phase commit (2PC) distributed database locks across all services",
          "By combining all services back into a single database schema",
          "By ignoring database rollbacks on failure",
        ],
        answer: 0,
        explanation: "Sagas break transactions into local transactions coordinated by events, using compensating actions if a downstream step fails.",
      }),
      () => ({
        question: "What role does the Circuit Breaker pattern (e.g., Resilience4j) play in inter-service communications?",
        options: [
          "Prevents cascading service failures by failing fast and returning fallbacks when a downstream dependency is unhealthy",
          "Encrypts network traffic between services",
          "Balances network load across available CPU cores",
          "Compresses JSON payloads using Gzip",
        ],
        answer: 0,
        explanation: "Circuit breakers monitor failure rates; if thresholds are exceeded, calls trip open to protect caller resources from thread exhaustion.",
      }),
    ],
    3: [
      () => ({
        question: "How does Distributed Tracing (e.g., OpenTelemetry, Jaeger) correlate requests spanning multiple asynchronous microservices?",
        options: [
          "By propagating trace IDs and span IDs through HTTP headers (W3C TraceContext) across all service calls",
          "By centralizing all application logs into a single text file",
          "By synchronizing server clocks to the exact nanosecond",
          "By forcing all services to run on a single host machine",
        ],
        answer: 0,
        explanation: "Trace context headers pass trace and span identifiers downstream, allowing tracing backends to assemble complete end-to-end call trees.",
      }),
    ],
  },

  "Redis": {
    1: [
      () => ({
        question: "What is the primary architecture of Redis?",
        options: [
          "An in-memory key-value data structure store used as a database, cache, and message broker",
          "A relational database that requires fixed schema tables",
          "A document database that only runs on Windows",
          "A client-side browser storage library",
        ],
        answer: 0,
        explanation: "Redis is an open-source, in-memory data store supporting varied data structures such as strings, hashes, lists, and sets.",
      }),
      () => ({
        question: "Which Redis command is used to store a key-value pair with an expiration time in seconds?",
        options: ["SETEX key seconds value", "EXPIRE key value", "PUT key value TIME", "STORE key value TTL"],
        answer: 0,
        explanation: "SETEX sets the string value of a key and sets its timeout in a single atomic operation.",
      }),
    ],
    2: [
      () => ({
        question: "What is the Cache Stampede (or Thundering Herd) problem in Redis caching, and how is it mitigated?",
        options: [
          "High concurrent requests hit the database simultaneously when a hot cache key expires; mitigated using probabilistic early expiration or mutex locks",
          "Redis crashes due to exceeding RAM limits",
          "A network partition causes duplicate keys",
          "Redis master fails to replicate to slaves",
        ],
        answer: 0,
        explanation: "Cache stampede occurs when thousands of threads simultaneously query the underlying database for an expired key. Mutex locks or XFetch mitigates it.",
      }),
      () => ({
        question: "What is the difference between Redis RDB snapshots and AOF (Append Only File) persistence?",
        options: [
          "RDB takes point-in-time snapshots at specified intervals; AOF logs every write command for higher durability",
          "RDB is for production, AOF is only for development",
          "AOF is stored in RAM, RDB is stored in cloud",
          "There is no difference; they are aliases",
        ],
        answer: 0,
        explanation: "RDB creates compact point-in-time dump files; AOF records every write operation, offering configurable fsync durability.",
      }),
    ],
    3: [
      () => ({
        question: "Why should the KEYS * command NEVER be executed in a high-traffic production Redis instance?",
        options: [
          "Redis is single-threaded; KEYS * scans the entire keyspace and blocks all incoming client requests until completion",
          "It permanently deletes all keys in the database",
          "It causes immediate master-slave desynchronization",
          "It corrupts memory allocations",
        ],
        answer: 0,
        explanation: "Because Redis executes commands on a single event loop, blocking operations like KEYS * halt all traffic. SCAN should be used instead.",
      }),
    ],
  },

  "AWS": {
    1: [
      () => ({
        question: "Which AWS service provides resizable, on-demand virtual compute instances in the cloud?",
        options: ["Amazon EC2", "Amazon S3", "Amazon RDS", "AWS Lambda"],
        answer: 0,
        explanation: "Amazon EC2 (Elastic Compute Cloud) provides secure, resizable compute capacity in the cloud.",
      }),
      () => ({
        question: "What is the primary purpose of Amazon S3?",
        options: ["Scalable object storage for files, backups, and media assets", "Relational database hosting", "DNS routing", "Serverless function execution"],
        answer: 0,
        explanation: "Amazon S3 (Simple Storage Service) is an industry-leading object storage service storing unstructured data.",
      }),
    ],
    2: [
      () => ({
        question: "What is the difference between an IAM Role and an IAM User in AWS?",
        options: [
          "An IAM User has permanent credentials for people, while an IAM Role has temporary credentials assumed by applications or services",
          "An IAM Role can only access S3, while Users can access all services",
          "IAM Roles require payment per use",
          "IAM Users cannot be granted policies",
        ],
        answer: 0,
        explanation: "IAM roles provide temporary security credentials via STS, avoiding hardcoding access keys in applications.",
      }),
      () => ({
        question: "How does Amazon RDS Multi-AZ deployment provide high availability?",
        options: [
          "Synchronously replicates data to a standby database instance in a different Availability Zone with automatic failover",
          "Asynchronously replicates across different AWS regions",
          "Distributes query load across multiple read/write masters",
          "Stores table data in Amazon S3 buckets",
        ],
        answer: 0,
        explanation: "Multi-AZ maintains a synchronous replica in a distinct AZ; if primary fails, AWS automatically updates DNS to the standby.",
      }),
    ],
    3: [
      () => ({
        question: "When architecting serverless applications on AWS Lambda with relational databases (Amazon RDS), what issue arises without AWS RDS Proxy?",
        options: [
          "Lambda's rapid scale-out can exhaust database connection limits during concurrent bursts",
          "Lambda cannot resolve private VPC IP addresses",
          "RDS requires continuous SSH tunneling from Lambda",
          "Lambda functions run out of ephemeral disk space",
        ],
        answer: 0,
        explanation: "RDS Proxy pools and shares database connections established by thousands of ephemeral concurrent Lambda invocations.",
      }),
    ],
  },

  "Git": {
    1: [
      () => ({
        question: "Which Git command creates a new branch and immediately switches your working directory to it?",
        options: ["git checkout -b <branch_name> (or git switch -c)", "git branch -n <branch_name>", "git merge <branch_name>", "git clone <branch_name>"],
        answer: 0,
        explanation: "git checkout -b or git switch -c creates and checks out the new branch in a single command.",
      }),
      () => ({
        question: "What is the purpose of the staging area (index) in Git?",
        options: [
          "Allows developers to selectively curate and organize changes before committing them to history",
          "Acts as a remote backup in case of local disk failure",
          "Compresses Git repository history automatically",
          "Prevents merge conflicts permanently",
        ],
        answer: 0,
        explanation: "The staging area holds tracked changes staged with git add before creating a commit.",
      }),
    ],
    2: [
      () => ({
        question: "What is the key difference between 'git merge' and 'git rebase'?",
        options: [
          "Merge creates a 3-way merge commit preserving exact history branch topology; Rebase replays commits on top of the base branch for a linear history",
          "Rebase cannot handle conflicts, while merge can",
          "Merge modifies existing commit hashes, while rebase does not",
          "Rebase only works with GitHub remote repositories",
        ],
        answer: 0,
        explanation: "Merge preserves the branching history with a merge commit; Rebase rewrites history by moving feature commits onto the target branch tip.",
      }),
      () => ({
        question: "Which command safely removes uncommitted modifications in tracked working directory files?",
        options: ["git restore . (or git checkout -- .)", "git commit --amend", "git clean -f", "git push --force"],
        answer: 0,
        explanation: "git restore . discards unstaged changes in tracked files without touching untracked files.",
      }),
    ],
    3: [
      () => ({
        question: "How does 'git reflog' enable recovery of commits that appear lost after a botched rebase or hard reset?",
        options: [
          "Reflog records every change made to the tip of branches (HEAD updates), allowing you to check out older commit SHAs before garbage collection",
          "Reflog restores files directly from GitHub's cloud cache",
          "Reflog reverts the operating system file system",
          "Reflog undoes all commits pushed to the main branch",
        ],
        answer: 0,
        explanation: "Git maintains a local journal of all HEAD pointer movements in the reflog for 30–90 days, enabling recovery of orphaned commits.",
      }),
    ],
  },

  "DSA": {
    1: [
      () => ({
        question: "What is the average time complexity of searching for an element in an unsorted array of size N?",
        options: ["O(N)", "O(log N)", "O(1)", "O(N log N)"],
        answer: 0,
        explanation: "Searching an unsorted array requires scanning elements sequentially, taking linear O(N) time.",
      }),
      () => ({
        question: "Which data structure operates on a First-In, First-Out (FIFO) principle?",
        options: ["Queue", "Stack", "Binary Heap", "Trie"],
        answer: 0,
        explanation: "Queues process elements in FIFO order, where elements added first are dequeued first.",
      }),
      () => ({
        question: "What is the time complexity of pushing an element onto a standard LIFO Stack?",
        options: ["O(1)", "O(N)", "O(log N)", "O(N^2)"],
        answer: 0,
        explanation: "Pushing to the top of a stack takes constant O(1) time.",
      }),
    ],
    2: [
      () => ({
        question: "What is the worst-case time complexity of QuickSort when an improper pivot is consistently chosen?",
        options: ["O(N^2)", "O(N log N)", "O(log N)", "O(N)"],
        answer: 0,
        explanation: "If the pivot is always the extreme smallest or largest element on sorted data, QuickSort degrades to O(N^2).",
      }),
      () => ({
        question: "Which data structure is optimal for implementing an LRU (Least Recently Used) cache with O(1) get and put operations?",
        options: ["Doubly Linked List combined with a HashMap", "Sorted Array", "Binary Search Tree", "Single Queue"],
        answer: 0,
        explanation: "A HashMap provides O(1) lookups, while a Doubly Linked List enables O(1) insertion and removal of the least recently used node.",
      }),
    ],
    3: [
      () => ({
        question: "In graph algorithms, when is Dijkstra's algorithm preferred over Bellman-Ford?",
        options: [
          "When finding the shortest path on graphs with non-negative edge weights (Dijkstra runs faster in O(E + V log V))",
          "When the graph has negative weight cycles",
          "When finding minimum spanning trees",
          "When the graph is unweighted",
        ],
        answer: 0,
        explanation: "Dijkstra is faster on non-negative weighted graphs using a priority queue. Bellman-Ford is needed if negative edge weights are present.",
      }),
    ],
  },

  "OOP": {
    1: [
      () => ({
        question: "Which OOP concept involves bundling data and the methods that operate on that data into a single unit while restricting direct access?",
        options: ["Encapsulation", "Inheritance", "Polymorphism", "Abstraction"],
        answer: 0,
        explanation: "Encapsulation hides internal state and requires all interaction to occur through public accessors/methods.",
      }),
      () => ({
        question: "Which OOP principle allows methods to exhibit different behaviors based on the object instance executing them?",
        options: ["Polymorphism", "Coupling", "Static Typing", "Composition"],
        answer: 0,
        explanation: "Polymorphism allows subclasses to override methods and provide distinct behaviors while sharing a common interface.",
      }),
    ],
    2: [
      () => ({
        question: "What does the 'L' in SOLID design principles stand for?",
        options: ["Liskov Substitution Principle", "Loose Coupling Principle", "Linear Dependency Rule", "Lazy Evaluation Pattern"],
        answer: 0,
        explanation: "Liskov Substitution states that objects of a superclass should be replaceable with objects of a subclass without breaking application correctness.",
      }),
      () => ({
        question: "Why is 'Composition over Inheritance' widely advocated in modern object-oriented software design?",
        options: [
          "Composition enables flexible behavior changes at runtime without tight coupling to base class implementation details",
          "Inheritance cannot be used with polymorphism",
          "Composition uses zero memory",
          "Inheritance prevents unit testing entirely",
        ],
        answer: 0,
        explanation: "Inheritance exposes subclasses to superclass changes ('fragile base class problem'); composition packages independent interfaces modularly.",
      }),
    ],
    3: [
      () => ({
        question: "What problem does the Dependency Inversion Principle (DIP) solve in high-level modules?",
        options: [
          "High-level modules should not depend on low-level modules; both should depend on abstractions (interfaces)",
          "It forces classes to use singleton instances",
          "It avoids using inheritance completely",
          "It mandates microservice architecture",
        ],
        answer: 0,
        explanation: "DIP decouples high-level policy logic from specific low-level implementations by introducing interface abstractions.",
      }),
    ],
  },
};

// =====================================================================
// 2. PROCEDURAL SCENARIO GENERATOR
//    Generates dynamic, rich questions with realistic engineering context
//    for any skill to prevent repetition and ensure sufficient depth.
// =====================================================================

function generateProceduralQuestion(skillName, level = 1, variantIndex = 0) {
  const templates = {
    1: [
      {
        question: `In standard software development, what is the primary role of ${skillName}?`,
        options: [
          `Provides core capabilities, APIs, and conventions tailored to solve engineering problems in its domain`,
          `Replaces the underlying hardware virtualization layer completely`,
          `Acts exclusively as a temporary testing script runner`,
          `Forces all application logic to run as a single synchronous process`,
        ],
        answer: 0,
        explanation: `${skillName} is a standard technology that provides structured capabilities and idioms for its respective engineering domain.`,
      },
      {
        question: `When getting started with ${skillName}, which foundational best practice should developers follow?`,
        options: [
          `Adhere to canonical naming conventions, standard project directory layouts, and official dependency management`,
          `Disable all compiler warnings and runtime logging`,
          `Store database passwords and secret keys directly in plain text in version control`,
          `Avoid reading standard documentation and deprecation notices`,
        ],
        answer: 0,
        explanation: `Beginning with ${skillName} requires following established community conventions, clean dependencies, and proper environment hygiene.`,
      },
      {
        question: `Which of the following represents a basic syntax or configuration error when initializing ${skillName}?`,
        options: [
          `Failing to provide required environment variables or missing required dependency imports`,
          `Using modular function boundaries`,
          `Writing automated unit tests`,
          `Using version control branching`,
        ],
        answer: 0,
        explanation: `Missing configurations, incorrect runtime paths, or missing library imports are typical startup failure modes when configuring ${skillName}.`,
      },
      {
        question: `How does ${skillName} typically handle basic data flow and input validation?`,
        options: [
          `Validates data boundaries at entry points before handing off to business processing logic`,
          `Passes all unvalidated user input directly to the database execution engine`,
          `Ignores malformed input payloads and silently terminates`,
          `Encodes all data exclusively into base64 before inspection`,
        ],
        answer: 0,
        explanation: `Robust design in ${skillName} emphasizes defensive input sanitization and boundary checks.`,
      },
    ],
    2: [
      {
        question: `When building robust systems with ${skillName}, how should unexpected runtime errors and exceptions be managed?`,
        options: [
          `Implement centralized exception handling, structured error logging, and return clear diagnostic status codes to callers`,
          `Swallow exceptions in empty catch blocks to keep the application running silently`,
          `Crash the host operating system immediately upon any warning`,
          `Print stack traces directly to end-user public responses without filtering`,
        ],
        answer: 0,
        explanation: `Production use of ${skillName} requires structured error boundaries, actionable logging, and shielding internal stack traces from clients.`,
      },
      {
        question: `In an enterprise application using ${skillName}, what is the recommended approach for decoupling components?`,
        options: [
          `Define clean interface boundaries and inject dependencies rather than hardcoding concrete implementations`,
          `Import all modules into a single monolithic source file`,
          `Use global mutable state across all packages`,
          `Bypass architectural layers and call internal private helpers directly`,
        ],
        answer: 0,
        explanation: `Dependency injection and programming to interfaces ensure maintainability and testability when utilizing ${skillName}.`,
      },
      {
        question: `How does automated testing verify ${skillName} integrations effectively?`,
        options: [
          `Combines unit tests with isolated mocks and integration tests against containerized test environments`,
          `Only tests by manual point-and-click in production after release`,
          `Disables assertions so test suites run faster`,
          `Relies solely on compile-time verification without unit tests`,
        ],
        answer: 0,
        explanation: `Reliable ${skillName} engineering combines unit tests with realistic integration testing for deterministic quality.`,
      },
      {
        question: `When optimizing database interactions or network calls with ${skillName}, which pattern avoids the classic N+1 query problem?`,
        options: [
          `Batch fetching, join queries, or eager loading strategies instead of executing a query per parent record`,
          `Executing queries sequentially inside deep loops`,
          `Disabling database indexing on foreign keys`,
          `Increasing HTTP connection timeouts to several minutes`,
        ],
        answer: 0,
        explanation: `The N+1 problem is solved by batching fetches or utilizing joins to retrieve required associations in a single round-trip.`,
      },
    ],
    3: [
      {
        question: `In high-concurrency production deployments of ${skillName}, what is the primary risk of unbounded thread or resource creation?`,
        options: [
          `Thread starvation, high context-switching overhead, and eventual OutOfMemory crashes`,
          `Source code compilation degradation`,
          `Premature expiration of SSL certificates`,
          `Automatic downgrading of network protocols`,
        ],
        answer: 0,
        explanation: `Unbounded concurrency under load exhausts memory and CPU scheduling capacity. Fixed thread pools and backpressure are essential with ${skillName}.`,
      },
      {
        question: `When diagnosing tail latency spikes (p99) in a service powered by ${skillName}, which telemetry metric is most critical?`,
        options: [
          `Downstream I/O wait times, connection pool contention, and garbage collection or event loop pauses`,
          `Total lines of commented code in repository`,
          `Local filesystem disk drive brand`,
          `Number of git branches in the repo`,
        ],
        answer: 0,
        explanation: `p99 latency spikes are typically caused by blocking I/O calls, thread pool saturation, or memory reclamation pauses.`,
      },
      {
        question: `How should a distributed service leveraging ${skillName} ensure fault tolerance during partial downstream network outages?`,
        options: [
          `Apply timeouts, exponential backoff with jitter on retries, and circuit breakers with fallback responses`,
          `Retry failed requests in an infinite tight loop immediately without delay`,
          `Terminate the entire cluster on the first network timeout`,
          `Disable all health check probes across the cluster`,
        ],
        answer: 0,
        explanation: `Exponential backoff with jitter prevents thundering herds, while circuit breakers fail fast during outages.`,
      },
      {
        question: `To ensure zero-downtime rolling deployments when updating ${skillName} components in production, what must be supported?`,
        options: [
          `Backward-compatible API payloads, graceful shutdown signal handling (SIGTERM), and database migration decoupling`,
          `Simultaneous shutdown of all servers followed by a cold boot`,
          `Deleting all historical database tables before restarting`,
          `Forcing all clients to clear their cookies`,
        ],
        answer: 0,
        explanation: `Zero-downtime updates demand graceful shutdown to finish inflight requests and backward-compatible changes.`,
      },
    ],
  };

  const pool = templates[level] || templates[1];
  const item = pool[variantIndex % pool.length];
  return {
    ...item,
    skillId: skillName,
    level,
  };
}

// =====================================================================
// 3. ADAPTIVE QUESTION PLAN CALCULATOR
//    Computes dynamic question count and per-skill quotas based on:
//     - Minimum 10 questions for EVERY level
//     - Number of missing / partially matched skills
//     - Importance of each JD skill (High/Required vs Medium/Preferred)
//     - Current skill level / gap depth
//     - Previous performance in past assessment attempts
// =====================================================================

/**
 * Calculates adaptive question distribution and total count
 *
 * @param {Object} params
 * @param {Array}  params.skills - List of skill names or skill gap objects
 * @param {Array}  [params.skillGaps] - Complete skill gap matrix from Module 3
 * @param {number} [params.level] - Difficulty level: 1 (Beginner), 2 (Intermediate), 3 (Advanced)
 * @param {Array}  [params.assessmentHistory] - Past assessment attempts
 * @param {Object} [params.activeJD] - Active Job Description
 * @param {Object} [params.skillLevels] - Current verified skill levels map from Module 5
 * @returns {Object} Adaptive assessment plan
 */
export function calculateAdaptiveQuestionPlan({
  skills = [],
  skillGaps = [],
  level = 1,
  assessmentHistory = [],
  activeJD = null,
  skillLevels = {},
} = {}) {
  // Normalize skills list into objects
  const skillMap = new Map();

  // Helper to find skill level record
  const findSkillLevelRecord = (skillName) => {
    if (!skillLevels || typeof skillLevels !== "object") return null;
    if (skillLevels[skillName]) return skillLevels[skillName];
    const lower = (skillName || "").toLowerCase();
    for (const [k, v] of Object.entries(skillLevels)) {
      if (k.toLowerCase() === lower) return v;
    }
    return null;
  };

  // 1. Ingest base skill names
  skills.forEach((s) => {
    const name = typeof s === "string" ? s : s.name;
    if (name) {
      const lvlRec = findSkillLevelRecord(name);
      skillMap.set(name.toLowerCase(), {
        name,
        importance: "Medium",
        source: "Required",
        matchClassification: "Developing",
        currentScore: lvlRec?.score ?? 50,
        currentLevel: lvlRec?.currentLevel || "Beginner",
        levelTrend: lvlRec?.trend || "Maintained",
        gap: 30,
        previousAccuracy: null,
      });
    }
  });

  // 2. Enrich from skillGaps if available
  skillGaps.forEach((g) => {
    if (!g || !g.name) return;
    const key = g.name.toLowerCase();
    const existing = skillMap.get(key) || { name: g.name };
    const lvlRec = findSkillLevelRecord(g.name);
    skillMap.set(key, {
      ...existing,
      name: g.name,
      importance: g.importance || existing.importance || "Medium",
      source: g.source || existing.source || "Required",
      matchClassification: g.matchClassification || existing.matchClassification || "Developing",
      currentScore: typeof g.current === "number" ? g.current : (lvlRec?.score ?? 50),
      currentLevel: g.skillLevel || lvlRec?.currentLevel || existing.currentLevel || "Beginner",
      levelTrend: g.skillTrend || lvlRec?.trend || existing.levelTrend || "Maintained",
      gap: typeof g.gap === "number" ? g.gap : 30,
      priority: g.priority || (g.matchClassification === "Missing" ? "High" : "Medium"),
    });
  });

  // 3. Ingest activeJD required/preferred skills
  if (activeJD) {
    (activeJD.requiredSkills || []).forEach((s) => {
      const name = typeof s === "string" ? s : s.name;
      if (!name) return;
      const key = name.toLowerCase();
      const lvlRec = findSkillLevelRecord(name);
      const existing = skillMap.get(key) || {
        name,
        matchClassification: "Missing",
        currentScore: lvlRec?.score ?? 0,
        currentLevel: lvlRec?.currentLevel || "Beginner",
        gap: 80,
      };
      skillMap.set(key, {
        ...existing,
        name,
        source: "Required",
        importance: "High",
      });
    });

    (activeJD.preferredSkills || []).forEach((s) => {
      const name = typeof s === "string" ? s : s.name;
      if (!name) return;
      const key = name.toLowerCase();
      const lvlRec = findSkillLevelRecord(name);
      const existing = skillMap.get(key) || {
        name,
        matchClassification: "Missing",
        currentScore: lvlRec?.score ?? 0,
        currentLevel: lvlRec?.currentLevel || "Beginner",
        gap: 70,
      };
      skillMap.set(key, {
        ...existing,
        name,
        source: "Preferred",
        importance: "Medium",
      });
    });
  }

  // Fallback if no skills registered at all
  if (skillMap.size === 0) {
    ["Java", "Spring Boot", "REST API", "SQL", "Docker"].forEach((name) => {
      const lvlRec = findSkillLevelRecord(name);
      skillMap.set(name.toLowerCase(), {
        name,
        importance: "High",
        source: "Required",
        matchClassification: "Developing",
        currentScore: lvlRec?.score ?? 50,
        currentLevel: lvlRec?.currentLevel || "Beginner",
        gap: 30,
      });
    });
  }

  // 4. Inspect previous assessment history to detect struggling skills
  const previousPerformanceBySkill = {};
  assessmentHistory.forEach((attempt) => {
    if (attempt?.skillScores) {
      Object.entries(attempt.skillScores).forEach(([skill, score]) => {
        const key = skill.toLowerCase();
        if (typeof score === "number") {
          if (!previousPerformanceBySkill[key]) previousPerformanceBySkill[key] = [];
          previousPerformanceBySkill[key].push(score);
        }
      });
    }
  });

  const evaluatedSkills = Array.from(skillMap.values());

  // Partition skills by deficit status
  const missingSkills = evaluatedSkills.filter(
    (s) => s.matchClassification === "Missing" || s.currentScore === 0
  );
  const partialSkills = evaluatedSkills.filter(
    (s) => s.matchClassification === "Partially Matched" || (s.currentScore > 0 && s.gap > 20)
  );
  const matchedSkills = evaluatedSkills.filter(
    (s) => s.matchClassification === "Matched" || (s.gap <= 20 && s.currentScore >= 70)
  );
  const weakSkills = [...missingSkills, ...partialSkills];

  // Calculate skill level counts for adaptive recommendations
  let beginnerCount = 0;
  let intermediateCount = 0;
  let advancedCount = 0;

  evaluatedSkills.forEach((s) => {
    const lvl = s.currentLevel;
    if (lvl === "Advanced") advancedCount++;
    else if (lvl === "Intermediate") intermediateCount++;
    else beginnerCount++;
  });

  // Dynamic recommendation for next assessment level
  let recommendedLevel = 1;
  let levelRationale = "";
  const totalEval = evaluatedSkills.length || 1;

  if (advancedCount / totalEval >= 0.5) {
    recommendedLevel = 3;
    levelRationale = `${advancedCount} of ${totalEval} skills demonstrate Advanced mastery (≥75%). Level 3 recommended to stress-test production scenarios.`;
  } else if ((intermediateCount + advancedCount) / totalEval >= 0.5) {
    recommendedLevel = 2;
    levelRationale = `${intermediateCount + advancedCount} of ${totalEval} skills are at Intermediate/Advanced proficiency. Level 2 recommended for core architecture diagnostics.`;
  } else {
    recommendedLevel = 1;
    levelRationale = `${beginnerCount} of ${totalEval} skills are at Beginner stage (<50%). Level 1 recommended to establish verified fundamentals.`;
  }

  // 5. Calculate question quota per skill
  // Rule:
  //  - Missing High Priority / Required: 3 questions
  //  - Missing Medium Priority: 2 questions
  //  - Partially Matched / Deficit > 20%: 2 to 3 questions
  //  - Skill Level is Beginner: +1 boost on weak skills for diagnostic depth
  //  - Skill Level is Advanced: 1 spot-check question is sufficient
  //  - Previously scored < 60% in past assessments: +1 question boost
  //  - Matched / Satisfied: 1 question (coverage verification)
  const allocations = [];
  let calculatedTotal = 0;

  evaluatedSkills.forEach((s) => {
    let quota = 1; // Base minimum per evaluated skill
    let reason = "Benchmark verification";

    const isMissing = s.matchClassification === "Missing" || s.currentScore === 0;
    const isPartial = s.matchClassification === "Partially Matched" || s.gap > 20;
    const isHighImportance = s.importance === "High" || s.source === "Required" || s.priority === "High";

    if (isMissing) {
      if (isHighImportance) {
        quota = 3;
        reason = "Critical missing required qualification (High Priority ATS Deficit)";
      } else {
        quota = 2;
        reason = "Missing preferred qualification";
      }
    } else if (isPartial) {
      if (isHighImportance) {
        quota = 3;
        reason = "Partially matched with significant benchmark deficit (High Priority)";
      } else {
        quota = 2;
        reason = "Partially matched with theoretical skills gap";
      }
    } else {
      // Matched skill
      if (s.currentLevel === "Beginner") {
        quota = 2;
        reason = "Beginner status: diagnostic reinforcement despite match";
      } else if (s.currentLevel === "Intermediate") {
        quota = 1;
        reason = "Intermediate proficiency verification";
      } else {
        quota = 1;
        reason = "Advanced mastery spot-check";
      }
    }

    // Historical failure adjustment
    const pastScores = previousPerformanceBySkill[s.name.toLowerCase()];
    if (pastScores && pastScores.length > 0) {
      const avgPast = pastScores.reduce((a, b) => a + b, 0) / pastScores.length;
      if (avgPast < 60 && quota < 3) {
        quota += 1;
        reason += " • Boosted: low score (<60%) on previous assessment";
      }
    } else if (s.currentLevel === "Beginner" && (isMissing || isPartial) && quota < 3) {
      quota = Math.min(3, quota + 1);
      reason += " • Boosted: Beginner depth requirement";
    }

    allocations.push({
      skill: s.name,
      quota,
      reason,
      importance: s.importance,
      classification: s.matchClassification,
      currentScore: s.currentScore,
      currentLevel: s.currentLevel,
      levelTrend: s.levelTrend,
      gap: s.gap,
    });

    calculatedTotal += quota;
  });

  // 6. Enforce Level-Based Minimum Question Floors:
  // Level 1: 15+ questions (comprehensive fundamentals & syntax check)
  // Level 2: 10+ questions (core engineering & architecture)
  // Level 3: 5+ questions (deep 1-to-1 interview style production scenarios)
  const LEVEL_FLOORS = { 1: 15, 2: 10, 3: 5 };
  const MIN_FLOOR = LEVEL_FLOORS[level] || 10;
  let finalTargetCount = Math.max(calculatedTotal, MIN_FLOOR);

  if (calculatedTotal < MIN_FLOOR) {
    let needed = MIN_FLOOR - calculatedTotal;
    // Sort allocations so weak and high importance skills get additional questions first
    const sortedAllocations = [...allocations].sort((a, b) => {
      const aWeight = (a.classification === "Missing" ? 3 : a.classification === "Partially Matched" ? 2 : 1);
      const bWeight = (b.classification === "Missing" ? 3 : b.classification === "Partially Matched" ? 2 : 1);
      return bWeight - aWeight;
    });

    let idx = 0;
    while (needed > 0 && sortedAllocations.length > 0) {
      const target = sortedAllocations[idx % sortedAllocations.length];
      target.quota += 1;
      target.reason += ` (quota expanded to satisfy Level ${level} minimum ${MIN_FLOOR} questions floor)`;
      needed--;
      idx++;
    }
  }

  // Recalculate sum of quotas after expansion
  finalTargetCount = allocations.reduce((sum, a) => sum + a.quota, 0);

  // Difficulty title
  const levelNames = {
    1: "Level 1: Fundamentals & Syntax (15+ Questions)",
    2: "Level 2: Core Engineering & Architecture (10+ Questions)",
    3: "Level 3: Technical Interview & Production Scenarios (5+ Questions)",
  };

  const rationale = `Adaptive Assessment: ${finalTargetCount} questions dynamically generated based on ${weakSkills.length} identified weak/partial skills and ${evaluatedSkills.length} total competencies (Level ${level} floor: ${MIN_FLOOR} questions).`;

  return {
    level,
    levelName: levelNames[level] || `Level ${level}`,
    recommendedLevel,
    recommendedLevelName: levelNames[recommendedLevel] || `Level ${recommendedLevel}`,
    levelRationale,
    skillLevelSummary: {
      beginner: beginnerCount,
      intermediate: intermediateCount,
      advanced: advancedCount,
    },
    targetCount: finalTargetCount,
    minFloor: MIN_FLOOR,
    allocations,
    skillsEvaluatedCount: evaluatedSkills.length,
    weakSkillsCount: weakSkills.length,
    missingSkillsCount: missingSkills.length,
    partialSkillsCount: partialSkills.length,
    matchedSkillsCount: matchedSkills.length,
    rationale,
  };
}

// =====================================================================
// 4. MAIN DYNAMIC QUESTION GENERATION ENGINE
//    Produces non-repeating questions that satisfy the adaptive plan.
// =====================================================================

/**
 * Normalizes question string for reliable deduplication comparison
 */
function normalizeQuestionText(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 80);
}

/**
 * Procedurally generates dynamic assessment questions
 *
 * @param {Object} params
 * @param {string} params.targetJob - Target role (e.g. Backend Developer)
 * @param {Array}  params.skills - List of skills to test
 * @param {Array}  [params.skillGaps] - Skill gap objects from Module 3
 * @param {number} [params.level] - Difficulty level: 1, 2, or 3 (min 10 questions per level)
 * @param {number} [params.count] - Optional override, defaults to adaptive calculation
 * @param {Array}  [params.assessmentHistory] - Past attempts for cross-test deduplication
 * @param {Object} [params.activeJD] - Active Job Description
 * @param {Object} [params.skillLevels] - Current verified skill levels map
 * @returns {Object} Complete assessment session
 */
export function generateDynamicQuestions({
  targetJob = "Backend Developer",
  skills = ["Java", "Spring Boot", "REST API", "SQL", "Docker"],
  skillGaps = [],
  level = 1,
  count = null,
  assessmentHistory = [],
  activeJD = null,
  skillLevels = {},
} = {}) {
  const selectedLevel = Math.max(1, Math.min(3, parseInt(level, 10) || 1));

  // 1. Calculate the adaptive question plan
  const adaptivePlan = calculateAdaptiveQuestionPlan({
    skills,
    skillGaps,
    level: selectedLevel,
    assessmentHistory,
    activeJD,
    skillLevels,
  });

  // Use explicit override if provided (clamped to level floor), otherwise use adaptive target count
  const LEVEL_FLOORS = { 1: 15, 2: 10, 3: 5 };
  const levelFloor = LEVEL_FLOORS[selectedLevel] || 10;
  const targetTotal = count !== null ? Math.max(levelFloor, parseInt(count, 10)) : adaptivePlan.targetCount;

  // 2. Build anti-repetition registry
  const previouslySeenHashes = new Set();
  assessmentHistory.forEach((attempt) => {
    if (Array.isArray(attempt.questions)) {
      attempt.questions.forEach((q) => {
        if (q?.question) previouslySeenHashes.add(normalizeQuestionText(q.question));
      });
    }
  });

  const sessionUsedHashes = new Set();
  const selectedQuestions = [];

  // Helper to pick/create a unique question for a skill
  const pickQuestionForSkill = (skillName, variantHint = 0) => {
    const canonicalName = getCanonicalSkillName(skillName);
    const skillGenerators = QUESTION_GENERATORS[canonicalName] || QUESTION_GENERATORS[skillName];
    let candidates = [];

    if (skillGenerators) {
      const levelGens = skillGenerators[selectedLevel] || skillGenerators[1] || [];
      candidates = levelGens.map((fn) => fn());
    }

    // Filter candidates that have not been used in this session
    const unusedInSession = candidates.filter(
      (c) => !sessionUsedHashes.has(normalizeQuestionText(c.question))
    );

    // Prefer candidates that are also unseen in historical attempts
    const completelyUnseen = unusedInSession.filter(
      (c) => !previouslySeenHashes.has(normalizeQuestionText(c.question))
    );

    let chosen = null;
    if (completelyUnseen.length > 0) {
      // Pick random from completely unseen
      chosen = completelyUnseen[Math.floor(Math.random() * completelyUnseen.length)];
    } else if (unusedInSession.length > 0) {
      // Pick random from unused in current session
      chosen = unusedInSession[Math.floor(Math.random() * unusedInSession.length)];
    } else {
      // Fallback: Generate procedural scenario variant with randomized parameters
      chosen = generateProceduralQuestion(skillName, selectedLevel, variantHint + selectedQuestions.length);
    }

    // Final safety check: if somehow already in session, mutate variant index until unique
    let attemptCount = 0;
    while (sessionUsedHashes.has(normalizeQuestionText(chosen.question)) && attemptCount < 10) {
      attemptCount++;
      chosen = generateProceduralQuestion(skillName, selectedLevel, variantHint + attemptCount + 5);
    }

    sessionUsedHashes.add(normalizeQuestionText(chosen.question));
    return {
      skillId: skillName,
      level: selectedLevel,
      ...chosen,
    };
  };

  // 3. Fulfill per-skill quotas from adaptive allocation plan
  adaptivePlan.allocations.forEach((alloc) => {
    for (let i = 0; i < alloc.quota; i++) {
      if (selectedQuestions.length < targetTotal) {
        const q = pickQuestionForSkill(alloc.skill, i);
        selectedQuestions.push(q);
      }
    }
  });

  // 4. If we haven't reached targetTotal (or minimum 10), distribute remaining across skills
  let round = 0;
  while (selectedQuestions.length < targetTotal) {
    const targetSkill = adaptivePlan.allocations[round % adaptivePlan.allocations.length]?.skill || skills[0] || "Java";
    const q = pickQuestionForSkill(targetSkill, selectedQuestions.length);
    selectedQuestions.push(q);
    round++;
  }

  // 5. Shuffle overall question order so questions from the same skill aren't all bunched together
  for (let i = selectedQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
  }

  // 6. Randomize option choices for each question (Fisher-Yates shuffle) so the correct answer isn't always A
  const finalizedQuestions = selectedQuestions.map((q) => {
    const optionsWithIndices = q.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));
    for (let i = optionsWithIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionsWithIndices[i], optionsWithIndices[j]] = [optionsWithIndices[j], optionsWithIndices[i]];
    }

    const newCorrectIndex = optionsWithIndices.findIndex((o) => o.originalIndex === q.answer);
    return {
      skill: q.skillId,
      skillId: q.skillId,
      level: q.level,
      question: q.question,
      options: optionsWithIndices.map((o) => o.text),
      answer: newCorrectIndex >= 0 ? newCorrectIndex : 0,
      explanation: q.explanation || "Correct response satisfies standard engineering conventions.",
    };
  });

  return {
    sessionId: `assessment-${Date.now()}`,
    targetJob,
    level: selectedLevel,
    levelName: adaptivePlan.levelName,
    generatedAt: new Date().toISOString(),
    totalQuestions: finalizedQuestions.length,
    minQuestionsRequired: levelFloor,
    adaptivePlan,
    questions: finalizedQuestions,
    source: "local_procedural_generator",
  };
}

// =====================================================================
// 5. LLM-GENERATED MCQS CLIENT INTEGRATION (Workers AI + Zero-Cost Guard)
// =====================================================================

// Endpoint configuration: local dev proxy, Cloudflare Worker route, or configurable env var
/**
 * Resolves consistent generation and submission endpoints from a base URL or configured endpoint string.
 * Prevents malformed URLs, duplicated '/api' segments, and silently sending submissions to the wrong origin.
 */
export function resolveWorkerEndpoints(configuredUrl) {
  const raw = (
    configuredUrl !== undefined && configuredUrl !== null
      ? configuredUrl
      : (typeof import.meta !== "undefined" && import.meta.env?.VITE_WORKERS_AI_ENDPOINT
          ? import.meta.env.VITE_WORKERS_AI_ENDPOINT
          : (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL
              ? import.meta.env.VITE_API_BASE_URL
              : ""))
  );

  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) {
    return {
      generate: "/api/generate-mcqs",
      submit: "/api/submit-assessment",
      base: "",
    };
  }

  // Remove trailing slashes
  const clean = trimmed.replace(/\/+$/, "");

  // If pointing specifically to /generate-mcqs (e.g. "/api/generate-mcqs" or "https://worker.dev/api/generate-mcqs")
  if (clean.endsWith("/generate-mcqs")) {
    const prefix = clean.slice(0, -"/generate-mcqs".length).replace(/\/+$/, "");
    if (!prefix) {
      return {
        generate: "/api/generate-mcqs",
        submit: "/api/submit-assessment",
        base: "",
      };
    }
    return {
      generate: clean,
      submit: `${prefix}/submit-assessment`,
      base: prefix.endsWith("/api") ? prefix.slice(0, -4).replace(/\/+$/, "") : prefix,
    };
  }

  // If ending with /api
  if (clean.endsWith("/api")) {
    return {
      generate: `${clean}/generate-mcqs`,
      submit: `${clean}/submit-assessment`,
      base: clean.slice(0, -4).replace(/\/+$/, ""),
    };
  }

  // Generic base URL (e.g. "https://worker.dev" or "http://localhost:8787")
  return {
    generate: `${clean}/api/generate-mcqs`,
    submit: `${clean}/api/submit-assessment`,
    base: clean,
  };
}

export function getWorkerEndpoints() {
  return resolveWorkerEndpoints();
}

export const WORKER_AI_ENDPOINT = resolveWorkerEndpoints().generate;
export const WORKER_SUBMIT_ENDPOINT = resolveWorkerEndpoints().submit;

const LLM_REQUEST_TIMEOUT_MS = 12000; // 12-second bounded timeout

/**
 * Validates candidate LLM questions against the application's strict contract.
 * Checks for:
 *  - non-empty question string
 *  - exactly 4 distinct, non-empty options
 *  - single valid answer index (0..3)
 *  - explanation text
 *  - no intra-attempt duplicate questions
 */
export function validateLLMQuestions(rawQuestions, level = 1, requestedSkills = []) {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return { valid: false, questions: [], error: "Output is not a valid question array." };
  }

  const cleaned = [];
  const seenQuestionTexts = new Set();

  for (let i = 0; i < rawQuestions.length; i++) {
    const q = rawQuestions[i];
    if (!q || typeof q !== "object") continue;

    const questionText = typeof q.question === "string" ? q.question.trim() : "";
    if (questionText.length < 15) continue;

    // Deduplication check
    const normalized = normalizeQuestionText(questionText);
    if (seenQuestionTexts.has(normalized)) continue;

    // Exactly 4 options required
    if (!Array.isArray(q.options) || q.options.length !== 4) continue;

    const trimmedOptions = q.options.map((o) => (typeof o === "string" ? o.trim() : String(o || "").trim()));
    if (trimmedOptions.some((o) => o.length === 0)) continue;

    // Ensure options are distinct
    const uniqueOptions = new Set(trimmedOptions.map((o) => o.toLowerCase()));
    if (uniqueOptions.size !== 4) continue;

    // Answer validation (0, 1, 2, or 3) if provided (revealed post-submission or test fixtures)
    let answerIndex = undefined;
    if (q.answer !== undefined) {
      if (typeof q.answer === "number" && Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3) {
        answerIndex = q.answer;
      } else if (typeof q.answer === "string") {
        const parsed = parseInt(q.answer, 10);
        if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 3) {
          answerIndex = parsed;
        } else {
          const char = q.answer.trim().toUpperCase();
          if (char === "A") answerIndex = 0;
          else if (char === "B") answerIndex = 1;
          else if (char === "C") answerIndex = 2;
          else if (char === "D") answerIndex = 3;
        }
      }
      if (answerIndex === undefined || answerIndex < 0 || answerIndex > 3) continue;
    }

    const skillId = typeof q.skill === "string" && q.skill.trim().length > 0
      ? getCanonicalSkillName(q.skill.trim())
      : (requestedSkills[i % requestedSkills.length] || "Core Engineering");

    const explanation = typeof q.explanation === "string" && q.explanation.trim().length > 10
      ? q.explanation.trim()
      : (answerIndex !== undefined ? `Option ${String.fromCharCode(65 + answerIndex)} represents standard production practice for ${skillId}.` : undefined);

    const item = {
      id: q.id || `llm-q-${Date.now()}-${i + 1}`,
      skill: skillId,
      skillId,
      level,
      question: questionText,
      options: trimmedOptions,
      objective: q.objective || `${skillId} assessment`,
      source: "workers_ai_llm",
    };

    if (answerIndex !== undefined) {
      item.answer = answerIndex;
    }
    if (explanation !== undefined) {
      item.explanation = explanation;
    }

    cleaned.push(item);

    seenQuestionTexts.add(normalized);
  }

  return {
    valid: cleaned.length > 0,
    questions: cleaned,
    count: cleaned.length,
  };
}

/**
 * Invokes Cloudflare Workers AI endpoint with context minimization and bounded timeout.
 * Sends ONLY: target role, sanitized skill gaps, difficulty, and question count.
 * Never transmits passwords, auth tokens, candidate names, or raw resume files.
 */
export async function fetchLLMGeneratedMCQs({
  targetJob,
  level = 1,
  skills = [],
  questionCount = 10,
  companyContext = "",
  endpoint = null,
  workerBaseUrl = null,
} = {}) {
  const endpoints = resolveWorkerEndpoints(workerBaseUrl || endpoint);
  const targetEndpoint = endpoint || endpoints.generate;

  // Context minimization: clean and truncate strings
  const payload = {
    targetJob: (targetJob || "Software Engineer").slice(0, 80),
    level: Math.max(1, Math.min(3, parseInt(level, 10) || 1)),
    skills: skills.map((s) => String(s || "").trim().slice(0, 40)).filter(Boolean).slice(0, 10),
    questionCount: Math.min(20, Math.max(1, parseInt(questionCount, 10) || 10)),
    companyContext: (companyContext || "").slice(0, 100),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(targetEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP error ${res.status}`,
        fallbackRecommended: true,
      };
    }

    const data = await res.json();
    if (!data.success || !Array.isArray(data.questions)) {
      return {
        success: false,
        error: data.error || "Invalid response format from AI endpoint.",
        fallbackRecommended: true,
      };
    }

    // Validate the questions locally
    const validation = validateLLMQuestions(data.questions, payload.level, payload.skills);
    if (!validation.valid || validation.count === 0) {
      return {
        success: false,
        error: "Generated questions failed client schema validation.",
        fallbackRecommended: true,
      };
    }

    return {
      success: true,
      questions: validation.questions,
      attemptId: data.attemptId,
      attemptSecret: data.attemptSecret,
      submitEndpoint: endpoints.submit,
      source: "workers_ai_llm",
      model: data.model || "@cf/meta/llama-3.1-8b-instruct-fp8",
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === "AbortError";
    return {
      success: false,
      error: isTimeout ? "Workers AI request timed out (12s limit)." : (err.message || "Network error contacting Workers AI."),
      fallbackRecommended: true,
    };
  }
}

/**
 * Submits user answers to the server for secure scoring and retrieving answer explanations.
 * Requires both attemptId and secret attemptSecret to prove attempt ownership.
 */
export async function submitLLMAssessmentAnswers({
  attemptId,
  attemptSecret,
  answers = [],
  endpoint = null,
  workerBaseUrl = null,
} = {}) {
  if (!attemptId || typeof attemptId !== "string") {
    return {
      success: false,
      error: "Missing or invalid attemptId for assessment submission.",
    };
  }

  if (!attemptSecret || typeof attemptSecret !== "string") {
    return {
      success: false,
      error: "Missing or invalid attemptSecret for assessment submission.",
    };
  }

  const resolvedEndpoints = resolveWorkerEndpoints(workerBaseUrl);
  const targetEndpoint = endpoint || resolvedEndpoints.submit;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(targetEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ attemptId, attemptSecret, answers }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Submission failed with HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === "AbortError";
    return {
      success: false,
      error: isTimeout ? "Submission request timed out." : (err.message || "Network error submitting assessment."),
    };
  }
}

/**
 * Main assessment generation entrypoint.
 * Attempts fresh LLM generation first; seamlessly falls back to procedural question bank
 * if the network is offline, the endpoint times out, or the free-tier quota is reached.
 */
export async function generateAssessmentQuestionsAsync(params = {}) {
  const {
    targetJob = "Backend Developer",
    skills = ["Java", "Spring Boot", "REST API", "SQL", "Docker"],
    skillGaps = [],
    level = 1,
    assessmentHistory = [],
    activeJD = null,
    skillLevels = {},
    customEndpoint = null,
    workerBaseUrl = null,
  } = params;

  // 1. Compute the authoritative adaptive plan
  const selectedLevel = Math.max(1, Math.min(3, parseInt(level, 10) || 1));
  const adaptivePlan = calculateAdaptiveQuestionPlan({
    skills,
    skillGaps,
    level: selectedLevel,
    assessmentHistory,
    activeJD,
    skillLevels,
  });

  const targetCount = adaptivePlan.targetCount;
  const companyContext = activeJD?.companyName ? `for ${activeJD.companyName}` : "";
  const endpoints = resolveWorkerEndpoints(workerBaseUrl || customEndpoint);

  // 2. Attempt LLM generation from Cloudflare Workers AI
  const llmResult = await fetchLLMGeneratedMCQs({
    targetJob,
    level: selectedLevel,
    skills,
    questionCount: targetCount,
    companyContext,
    endpoint: customEndpoint || endpoints.generate,
    workerBaseUrl,
  });

  const LEVEL_FLOORS = { 1: 15, 2: 10, 3: 5 };
  const minRequiredForLevel = LEVEL_FLOORS[selectedLevel] || 10;

  if (llmResult.success && Array.isArray(llmResult.questions) && llmResult.questions.length >= minRequiredForLevel && llmResult.attemptId) {
    // Successfully received valid questions from Workers AI
    return {
      sessionId: `assessment-llm-${Date.now()}`,
      attemptId: llmResult.attemptId,
      attemptSecret: llmResult.attemptSecret,
      submitEndpoint: llmResult.submitEndpoint || endpoints.submit,
      targetJob,
      level: selectedLevel,
      levelName: adaptivePlan.levelName,
      generatedAt: new Date().toISOString(),
      totalQuestions: llmResult.questions.length,
      minQuestionsRequired: minRequiredForLevel,
      adaptivePlan,
      questions: llmResult.questions,
      source: "workers_ai_llm",
      model: llmResult.model,
    };
  }

  // 3. Fallback to existing question bank if LLM generation failed, timed out, or returned < minRequiredForLevel questions
  if (llmResult.fallbackRecommended) {
    console.info(`[questionGenerator] Workers AI notice: "${llmResult.error}". Falling back cleanly to local question generator.`);
  }

  const fallbackSession = generateDynamicQuestions(params);
  return {
    ...fallbackSession,
    fallbackReason: llmResult.error || "Local generation used",
  };
}

export default {
  QUESTION_GENERATORS,
  calculateAdaptiveQuestionPlan,
  generateDynamicQuestions,
  validateLLMQuestions,
  fetchLLMGeneratedMCQs,
  submitLLMAssessmentAnswers,
  generateAssessmentQuestionsAsync,
  resolveWorkerEndpoints,
  getWorkerEndpoints,
  WORKER_AI_ENDPOINT,
  WORKER_SUBMIT_ENDPOINT,
};

