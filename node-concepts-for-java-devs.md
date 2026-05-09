# Node.js / React Concepts — Mapped to Spring Boot & Java

A reference for Java developers learning from the Pretty Efficient PWA codebase.
Each section shows what the JS/Node concept looks like here, then its Java equivalent.

---

## Table of Contents

1. [Tooling & Project Structure](#tooling--project-structure)
2. [JavaScript Language → Java](#javascript-language--java)
3. [Modules & Imports](#modules--imports)
4. [async / await & Promises](#async--await--promises)
5. [React Components](#react-components)
6. [React State — useState](#react-state--usestate)
7. [React Lifecycle — useEffect](#react-lifecycle--useeffect)
8. [Props (Component Parameters)](#props-component-parameters)
9. [JSX (The Template Language)](#jsx-the-template-language)
10. [The Data Layer — supabase.js](#the-data-layer--supabasejs)
11. [Architecture Patterns](#architecture-patterns)
12. [Hosting & Deployment](#hosting--deployment)

---

## Tooling & Project Structure

| Node / Vite | Spring Boot / Maven |
|---|---|
| `package.json` | `pom.xml` / `build.gradle` |
| `npm` | Maven / Gradle |
| `npm install` | `mvn dependency:resolve` |
| `node_modules/` | `~/.m2/repository/` (local Maven cache) |
| `npm run build` → `dist/` | `mvn package` → `target/*.jar` |
| `npm run dev` (Vite hot-reload server) | `mvn spring-boot:run` |
| Vite | Maven build lifecycle + embedded Tomcat |
| `vite.config.js` | `pom.xml` plugin config |
| `.env` / env vars in Vite | `application.properties` / `application-{profile}.properties` |
| `devDependencies` | Maven `<scope>test</scope>` or `provided` |

**package.json from this project:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.17.0"
  }
}
```

**Equivalent pom.xml flavor:**
```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
</dependencies>
<build>
  <plugins>
    <plugin>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-maven-plugin</artifactId>
    </plugin>
  </plugins>
</build>
```

---

## JavaScript Language → Java

### Variables

```js
const name = 'Kim'          // effectively final — prefer in JS
let count = 0               // reassignable
```
```java
final String name = "Kim";  // const → final
int count = 0;              // let → regular var (or var in Java 10+)
```

### Arrow Functions → Lambdas

```js
// Arrow function
const double = (n) => n * 2

// Multi-line
const save = async (data) => {
  const { error } = await upsertJob(data)
  if (error) throw error
}
```
```java
// Lambda
Function<Integer, Integer> double = n -> n * 2;

// Multi-line (method reference more common in Spring)
public void save(JobData data) throws Exception {
    jobRepository.save(data);
}
```

### Destructuring → Getters / Records

```js
// Object destructuring — pulling named fields out of an object
const { subcontractors: _nested, ...subFields } = jobSubModal

// Array destructuring
const [{ data: jobData }, { data: custData }] = await Promise.all([...])
```
```java
// Java 16+ record pattern (closest equivalent)
// More commonly: just call getters
String name = jobSubModal.getName();

// For the parallel result pattern, use individual CompletableFuture vars
CompletableFuture<List<Job>> jobsFuture = ...;
CompletableFuture<List<Customer>> custFuture = ...;
```

### Spread Operator → Builder / BeanUtils

```js
// Creates a new object merging an existing one with overrides
const updated = { ...jobSubModal, amount: 99.00, job_id: jobId }
```
```java
// Option 1: Lombok builder with toBuilder
Job updated = existing.toBuilder().amount(99.00).jobId(jobId).build();

// Option 2: BeanUtils (Spring)
Job updated = new Job();
BeanUtils.copyProperties(existing, updated);
updated.setAmount(99.00);
```

### Template Literals → String.format

```js
const path = `${jobId}/${Date.now()}.${ext}`
```
```java
String path = String.format("%s/%d.%s", jobId, System.currentTimeMillis(), ext);
// Or with Java 15+ text blocks for multi-line SQL
```

### Ternary & Nullish Coalescing

```js
const label = saving ? 'Saving…' : 'Save'
const amount = job.revenue || 0          // || as null/falsy guard
const amount = job.revenue ?? 0          // ?? only guards null/undefined
```
```java
String label = saving ? "Saving…" : "Save";
double amount = job.getRevenue() != null ? job.getRevenue() : 0.0;
// Or with Optional
double amount = Optional.ofNullable(job.getRevenue()).orElse(0.0);
```

### Array Methods → Stream API

```js
// map — transform each element
expenses.map(e => e.amount)

// filter — keep matching elements
expenses.filter(e => e.reimbursable)

// reduce — aggregate to a single value
expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

// find — first match
jobSubs.find(js => js.id === jobSubModal.id)

// some — any match?
jobSubs.some(js => js.subcontractor_id === s.id)
```
```java
// map
expenses.stream().map(Expense::getAmount).collect(Collectors.toList());

// filter
expenses.stream().filter(Expense::isReimbursable).collect(Collectors.toList());

// reduce / sum
expenses.stream().mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0).sum();

// findFirst
jobSubs.stream().filter(js -> js.getId().equals(jobSubModal.getId())).findFirst();

// anyMatch
jobSubs.stream().anyMatch(js -> js.getSubcontractorId().equals(s.getId()));
```

---

## Modules & Imports

JavaScript uses ES modules. Every file is its own module. Exports are explicit.

```js
// supabase.js — named exports (multiple per file)
export const getJob = (id) => supabase.from('jobs').select(...)
export const upsertJob = (data) => supabase.from('jobs').upsert(data)

// ui.jsx — named + default exports
export function Modal({ title, children }) { ... }  // named
export default function App() { ... }               // default (one per file)
```

```js
// Importing in another file
import { getJob, upsertJob } from '../lib/supabase.js'   // named
import App from './App.jsx'                               // default
```

**Java equivalent:** Every public class is its own file (enforced by the compiler).
There is no `export` — visibility is controlled by `public`/`package-private`.
Imports bring in fully-qualified class names:

```java
import com.prettyefficient.repository.JobRepository;
import com.prettyefficient.service.JobService;
```

The key difference: in JS you choose what to export. In Java everything public is
accessible; you control access with `public`/`protected`/`private`.

---

## async / await & Promises

JavaScript is single-threaded and uses an event loop. I/O (network, DB) is
non-blocking by default. `async/await` is syntactic sugar over Promises.

```js
// From saveJobSub in JobDetail.jsx
const saveJobSub = async () => {
  setSaving(true)
  const { error } = await upsertJobSubcontractor({ ...subFields, job_id: jobId })
  setSaving(false)
  if (error) return showToast('Save failed', 'error')
  showToast('Saved')
  reload()
}
```

The `await` keyword pauses *this function* until the Promise resolves, but does
not block the browser thread — other UI interactions continue.

**Java equivalent — synchronous (typical Spring MVC):**
```java
public void saveJobSubcontractor(JobSubcontractorDto dto) {
    try {
        jobSubcontractorRepository.save(dto.toEntity());
        // equivalent of showToast('Saved') would be a redirect with flash message
    } catch (Exception e) {
        throw new ServiceException("Save failed", e);
    }
}
```

**Java equivalent — truly async (Spring @Async):**
```java
@Async
public CompletableFuture<Void> saveJobSubcontractorAsync(JobSubcontractorDto dto) {
    jobSubcontractorRepository.save(dto.toEntity());
    return CompletableFuture.completedFuture(null);
}
```

### Promise.all → CompletableFuture.allOf

This is the most direct analog. Both run multiple async operations in parallel
and wait for all of them to finish.

```js
// App.jsx — loads three tables in parallel
const [{ data: jobData }, { data: custData }, { data: subData }] =
  await Promise.all([getJobs(), getCustomers(), getSubcontractors()])
```

```java
// Spring equivalent
CompletableFuture<List<Job>>          jobsFuture  = jobService.findAllAsync();
CompletableFuture<List<Customer>>     custFuture  = customerService.findAllAsync();
CompletableFuture<List<Subcontractor>> subFuture  = subService.findAllAsync();

CompletableFuture.allOf(jobsFuture, custFuture, subFuture).join();

List<Job>          jobs  = jobsFuture.get();
List<Customer>     custs = custFuture.get();
List<Subcontractor> subs = subFuture.get();
```

### The { data, error } Pattern

Supabase returns `{ data, error }` instead of throwing exceptions. This is a
common JS pattern called a "result type."

```js
const { error } = await upsertJobSubcontractor(payload)
if (error) return showToast('Save failed', 'error')
```

**Java equivalent:** Spring Data repositories throw exceptions; you catch them:
```java
try {
    repository.save(entity);
} catch (DataAccessException e) {
    // handle error
}
```
Or with `Optional` for "not found" cases:
```java
Optional<Job> job = repository.findById(id);
job.orElseThrow(() -> new EntityNotFoundException("Job not found"));
```

---

## React Components

A React component is a **function that returns UI**. It is re-run ("re-rendered")
whenever its state or props change.

```js
// JobDetail.jsx — a typical component
export default function JobDetail({ jobId, customers, onBack }) {
  const [job, setJob] = useState(null)
  // ... logic ...
  return (
    <div>...</div>   // JSX — see JSX section below
  )
}
```

**Mental model for Java developers:**

Think of a component as a class where:
- The function body = a `render()` method that runs on every state change
- `useState` variables = private instance fields
- Props = constructor parameters / method arguments
- The returned JSX = the HTML a Thymeleaf template would produce

```java
// Rough conceptual equivalent (not how you'd actually write Spring)
public class JobDetailView {
    private final Long jobId;
    private final List<Customer> customers;
    private Job job;               // useState(null)

    public JobDetailView(Long jobId, List<Customer> customers) {
        this.jobId = jobId;
        this.customers = customers;
        this.job = jobRepository.findById(jobId).orElse(null);
    }

    public String render(Model model) {
        model.addAttribute("job", job);
        model.addAttribute("customers", customers);
        return "job-detail";        // Thymeleaf template name
    }
}
```

The critical difference: in React this all happens **in the browser**. There is
no server round-trip for navigation between screens. The entire app is
JavaScript running on the user's device.

---

## React State — useState

State is how a component remembers values between re-renders.

```js
const [saving, setSaving] = useState(false)
// saving   — the current value (read-only, like a getter)
// setSaving — the setter; calling it triggers a re-render
```

**Array syntax explained:** `useState` returns a two-element array.
JavaScript destructuring unpacks it into two named variables.
In Java terms:
```java
// useState(false) is roughly:
class State<T> {
    private T value;
    public T getValue() { return value; }
    public void setValue(T v) { this.value = v; /* triggers re-render */ }
}
```

### Functional State Updates

```js
// Pass a function when the new value depends on the old value
setJobSubModal(prev => ({ ...prev, role: e.target.value }))
```
This is equivalent to a read-modify-write in Java — you read the current state,
mutate a copy, and write it back. React requires immutable updates (you never
mutate the existing object directly), so you always create a new object.

```java
// Java equivalent of the immutable update pattern
JobSubModal updated = new JobSubModal(current);  // copy constructor
updated.setRole(newRole);
// then "set" it somewhere
```

---

## React Lifecycle — useEffect

`useEffect` runs **after** the component renders. The dependency array `[deps]`
controls when it re-runs.

```js
// App.jsx — load data once when the component first mounts
useEffect(() => { loadData() }, [loadData])
//                               ^ dependency array — re-run if loadData changes
//                                 empty [] = run once on mount only
```

| `useEffect` pattern | Java / Spring equivalent |
|---|---|
| `useEffect(() => fn(), [])` — run once on mount | `@PostConstruct` |
| `useEffect(() => fn(), [id])` — run when `id` changes | Change listener / `@EventListener` |
| Cleanup function returned from effect | `@PreDestroy` / `DisposableBean` |

```js
// Run once on mount (empty deps) — equivalent to @PostConstruct
useEffect(() => {
  loadData()
}, [])

// Cleanup on unmount — equivalent to @PreDestroy
useEffect(() => {
  const sub = supabase.channel('jobs').subscribe(...)
  return () => sub.unsubscribe()     // cleanup
}, [])
```

```java
@PostConstruct
public void init() {
    loadData();
}

@PreDestroy
public void cleanup() {
    subscription.unsubscribe();
}
```

---

## Props (Component Parameters)

Props are how a parent component passes data and callbacks down to a child.
They are just function parameters in destructuring syntax.

```js
// Declaring props a component accepts
export default function JobDetail({ jobId, customers, subcontractors, onBack, onDeleted, onRefresh }) {
  // use jobId, customers, etc. directly as local variables
}

// Passing props from a parent
<JobDetail
  jobId={selectedJobId}
  customers={customers}
  subcontractors={subcontractors}
  onBack={handleBack}
  onDeleted={handleJobDeleted}
  onRefresh={loadData}
/>
```

**Java equivalent:** Constructor injection or method parameters.
Callback props (`onBack`, `onDeleted`) are equivalent to passing a functional
interface (like `Runnable` or `Consumer<T>`).

```java
public class JobDetailController {
    private final Long jobId;
    private final List<Customer> customers;
    private final Runnable onBack;           // onBack prop
    private final Consumer<Long> onDeleted;  // onDeleted prop

    public JobDetailController(Long jobId, List<Customer> customers,
                               Runnable onBack, Consumer<Long> onDeleted) {
        this.jobId = jobId;
        this.customers = customers;
        this.onBack = onBack;
        this.onDeleted = onDeleted;
    }
}
```

The difference from Spring `@Autowired` injection: props flow from parent
to child at runtime (data-driven), not from an IoC container at startup.

---

## JSX (The Template Language)

JSX looks like HTML but is actually JavaScript. It compiles to function calls.
Think of it as an inline Thymeleaf template that lives in the same file as the
controller logic.

```jsx
// JSX
<div style={{ padding: 16 }}>
  {loading ? <Spinner /> : <JobList jobs={jobs} />}
  {jobs.map(j => (
    <div key={j.id}>{j.description}</div>
  ))}
</div>
```

```html
<!-- Thymeleaf equivalent -->
<div style="padding: 16px">
  <div th:if="${loading}">
    <!-- Spinner fragment -->
  </div>
  <div th:unless="${loading}">
    <div th:each="j : ${jobs}" th:text="${j.description}"></div>
  </div>
</div>
```

| JSX | Thymeleaf |
|---|---|
| `{condition && <Comp />}` | `th:if="${condition}"` |
| `{!condition && <Comp />}` | `th:unless="${condition}"` |
| `{a ? <A/> : <B/>}` | `th:if` + `th:unless` pair |
| `{items.map(i => <Row key={i.id} />)}` | `th:each="i : ${items}"` |
| `style={{ color: 'red' }}` (JS object) | `style="color: red"` (string) |
| `className="active"` | `class="active"` |
| `onClick={handleClick}` | `th:onclick` or form submit |
| `{variable}` interpolation | `[[${variable}]]` or `th:text` |

**Key JSX rules:**
- Attributes use camelCase: `onClick`, `onChange`, `maxLength`
- `class` is reserved in JS, so JSX uses `className`
- `style` takes a JavaScript object with camelCase keys, not a CSS string
- Every list item needs a unique `key` prop (like a DB primary key for React's diff algorithm)
- Components start with a capital letter: `<Modal>` vs `<div>` (lowercase = native HTML)

---

## The Data Layer — supabase.js

This file is the repository layer. All database access is centralized here,
matching the Spring pattern of putting all data access in `@Repository` classes.

```js
// supabase.js — the "repository" module
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
// ↑ This is the DataSource / EntityManager equivalent
```

```java
// Spring equivalent configuration
@Configuration
public class DatabaseConfig {
    @Bean
    public DataSource dataSource() {
        return DataSourceBuilder.create()
            .url("jdbc:postgresql://...")
            .build();
    }
}
```

### Supabase Query API → Spring Data / JPA

The Supabase client uses a fluent builder API that maps closely to Spring Data:

```js
// SELECT * FROM jobs ORDER BY created_at DESC
supabase.from('jobs').select('*').order('created_at', { ascending: false })
```
```java
// Spring Data JPA
jobRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
// Or JPQL
@Query("SELECT j FROM Job j ORDER BY j.createdAt DESC")
List<Job> findAllOrderByCreatedAtDesc();
```

---

```js
// SELECT with JOIN (Supabase join syntax)
supabase.from('jobs').select(`
  *,
  customers(id, name, phone, email),
  expenses(*),
  job_subcontractors(*, subcontractors(*))
`).eq('id', id).single()
```
```java
// JPA with eager fetch / JOIN FETCH
@Query("SELECT j FROM Job j " +
       "LEFT JOIN FETCH j.customer " +
       "LEFT JOIN FETCH j.expenses " +
       "LEFT JOIN FETCH j.jobSubcontractors js " +
       "LEFT JOIN FETCH js.subcontractor " +
       "WHERE j.id = :id")
Optional<Job> findByIdWithRelations(@Param("id") Long id);
```
The Supabase select string is essentially a GraphQL-like projection. Nested
table names in the string (`customers(...)`) are foreign key joins resolved
automatically from the DB schema.

---

```js
// INSERT or UPDATE (upsert — if id present, update; else insert)
supabase.from('jobs').upsert(data).select().single()
```
```java
// JpaRepository.save() does the same thing:
// - no id → INSERT
// - id present → UPDATE (merge)
Job saved = jobRepository.save(entity);
```

---

```js
// UPDATE specific fields
supabase.from('job_media').update({ show_on_website: true }).eq('id', id)
```
```java
// Option 1: load-modify-save
JobMedia media = mediaRepository.findById(id).orElseThrow();
media.setShowOnWebsite(true);
mediaRepository.save(media);

// Option 2: @Modifying query
@Modifying
@Query("UPDATE JobMedia jm SET jm.showOnWebsite = :show WHERE jm.id = :id")
void updateShowOnWebsite(@Param("id") Long id, @Param("show") boolean show);
```

---

```js
// DELETE
supabase.from('jobs').delete().eq('id', id)
```
```java
jobRepository.deleteById(id);
```

---

### Supabase Storage → Spring Content / S3

```js
// Upload a file to object storage
await supabase.storage.from('job-media').upload(path, file)

// Get a public URL
supabase.storage.from('job-media').getPublicUrl(path).data.publicUrl
```

In Spring you'd use AWS S3 SDK, Spring Content, or MinIO:
```java
// AWS S3 SDK equivalent
s3Client.putObject(PutObjectRequest.builder()
    .bucket("job-media")
    .key(path)
    .build(), RequestBody.fromBytes(fileBytes));

String publicUrl = "https://bucket.s3.amazonaws.com/" + path;
```

---

## Architecture Patterns

### File / Folder → Spring Layer

| This project | Spring Boot equivalent |
|---|---|
| `src/lib/supabase.js` | `@Repository` / DAO layer |
| `src/pages/*.jsx` | `@Controller` classes (one per screen) |
| `src/components/ui.jsx` | Thymeleaf fragments / shared JSP partials |
| `src/App.jsx` | Root orchestrator / application shell |

### App.jsx as the Facade / Orchestrator

`App.jsx` owns all shared state (`jobs`, `customers`, `subcontractors`) and
passes it down to pages. This is the same pattern as a facade service that
calls multiple repositories and assembles a view model.

```js
// App.jsx — loads everything once, shares via props
const loadData = useCallback(async () => {
  const [{ data: jobData }, { data: custData }, { data: subData }] =
    await Promise.all([getJobs(), getCustomers(), getSubcontractors()])
  setJobs(jobData || [])
  setCustomers(custData || [])
  setSubcontractors(subData || [])
}, [])
```

```java
// Spring equivalent — an application service / facade
@Service
public class AppFacadeService {
    public AppViewModel loadAll() {
        List<Job> jobs         = jobRepository.findAllWithCustomers();
        List<Customer> custs   = customerRepository.findAll();
        List<Subcontractor> subs = subRepository.findAll();
        return new AppViewModel(jobs, custs, subs);
    }
}
```

### State Is Lifted to the Lowest Common Ancestor

In React, shared state lives in the closest parent that needs it. This maps to
the idea of a service bean holding state shared across multiple controllers, or
model attributes set at a `@ControllerAdvice` level.

### Navigation — No Router Library

This app doesn't use React Router. Instead, `App.jsx` tracks a `tab` state
variable and conditionally renders pages. This is like a `@Controller` with a
single `@GetMapping("/")` that returns different Thymeleaf templates based on
a query parameter.

---

## Hosting & Deployment

| This project | Spring Boot equivalent |
|---|---|
| `npm run build` | `mvn package` |
| `dist/` output folder | `target/app.jar` |
| Netlify (static CDN hosting) | PaaS / container (Render, Railway, Fly.io, AWS ECS) |
| `netlify deploy --prod --dir=dist` | `java -jar target/app.jar` / `docker push && deploy` |
| Service worker (PWA, offline cache) | `@Scheduled` background job / HTTP cache headers |
| Vite dev server + HMR | Spring Boot DevTools + LiveReload |

**Key difference:** The built output for this React app is static files
(HTML + JS + CSS). The server only serves files — there is no Java process
running per request. All logic runs in the browser. This is fundamentally
different from Spring MVC where the server processes every request.

Supabase plays the role of the Spring Boot backend: it handles the database,
file storage, authentication (when added), and REST API — it's just managed
infrastructure rather than code you write.

---

## Quick Reference Cheat Sheet

| JavaScript | Java |
|---|---|
| `const x = 5` | `final int x = 5` |
| `let x = 5` | `int x = 5` |
| `x => x * 2` | `x -> x * 2` |
| `{ ...obj, key: val }` | `builder.from(obj).key(val).build()` |
| `` `Hello ${name}` `` | `String.format("Hello %s", name)` |
| `arr.map(fn)` | `stream().map(fn)` |
| `arr.filter(fn)` | `stream().filter(fn)` |
| `arr.reduce(fn, init)` | `stream().reduce(init, fn)` |
| `arr.find(fn)` | `stream().filter(fn).findFirst()` |
| `arr.some(fn)` | `stream().anyMatch(fn)` |
| `obj?.field` | `Optional.ofNullable(obj).map(o -> o.field)` |
| `val ?? default` | `Optional.ofNullable(val).orElse(default)` |
| `async function` | `CompletableFuture<T>` / `@Async` |
| `await promise` | `future.get()` / `.join()` |
| `Promise.all([...])` | `CompletableFuture.allOf(...)` |
| `import { X } from './y'` | `import com.example.Y;` |
| `export const X` | `public static final X` |
| `export default function` | `public class` (one per file) |
| `useState(init)` | private field with getter/setter |
| `useEffect(() => fn, [])` | `@PostConstruct` |
| `props` | constructor parameters |
| JSX `<Component />` | Thymeleaf `th:replace` fragment |