# Modern Tech Stacks Reference

A personal reference covering web, financial, and embedded/robotics software landscapes.

---

## Table of Contents

1. [Web Application Stacks](#web-application-stacks)
2. [Financial Application Stacks](#financial-application-stacks)
3. [Embedded & Robotics Software](#embedded--robotics-software)
4. [Robotics as a Hobby — Getting Started & Progression Path](#robotics-as-a-hobby--getting-started--progression-path)

---

## Web Application Stacks

### Frontend (Browser UI)
| Technology | Notes |
|---|---|
| **React + TypeScript** | Dominant across all industries; component-based, type-safe |
| **Next.js** | React with server-side rendering; SEO-friendly, full-stack capable |
| **Vue.js** | Popular alternative to React, gentler learning curve |
| **Svelte** | Compiles away the framework; very fast, growing adoption |
| Plain HTML + JS | Still valid for simple sites (like this project's public website) |

### Backend API
| Technology | Notes |
|---|---|
| **Node.js + TypeScript** | Same language front and back; massive ecosystem |
| **Python + FastAPI** | Fast, modern, great for data-heavy APIs |
| **Go (Golang)** | High performance, low memory; favored at scale |
| **Java / Kotlin + Spring Boot** | Enterprise standard; Kotlin reduces Java verbosity |
| **Ruby on Rails** | Convention-over-configuration; still popular at startups |
| Rust (Axum, Actix) | Emerging; extreme performance + memory safety |

### Backend-as-a-Service (BaaS) — Skip Writing a Backend
| Technology | Notes |
|---|---|
| **Supabase** | PostgreSQL + Auth + Storage + API (used in this project) |
| **Firebase** | Google's BaaS; NoSQL, real-time; dominant in mobile apps |
| **PocketBase** | Lightweight self-hosted alternative to Supabase |
| **Appwrite** | Open-source Firebase alternative |

> **Note:** The Pretty Efficient PWA uses this pattern — React talks directly to Supabase with no custom backend server. This is how most startup MVPs are built today.

### Build Tools & Bundlers
| Technology | Notes |
|---|---|
| **Vite** | Fast dev server + bundler; used in this project |
| **Next.js** | Has its own bundler (Turbopack) |
| Webpack | Older standard; still widespread in legacy projects |
| esbuild / Rollup | Low-level bundlers; Vite uses esbuild internally |

### Hosting & Deployment
| Technology | Notes |
|---|---|
| **Netlify** | Static + serverless; used in this project |
| **Vercel** | Optimal for Next.js (made by same team) |
| **Railway / Render** | Easy backend hosting; good Heroku replacement |
| AWS / GCP / Azure | Enterprise cloud; more control, more complexity |
| Fly.io | Container-based; great for globally distributed apps |

---

## Financial Application Stacks

### Enterprise / Legacy Financial Firms
*(Fidelity, JPMorgan, Goldman Sachs, Vanguard)*

| Layer | Technology | Why |
|---|---|---|
| Backend services | **Java + Spring Boot** | Explicit, auditable, compile-time safe |
| Complex rules engines | **Drools** | Business rules separate from code |
| Messaging / streaming | **Kafka** | High-throughput event processing |
| Architecture | **Microservices** | Independent deployability, team isolation |
| Database | Oracle, PostgreSQL | ACID compliance for financial data |
| Data processing | **Apache Spark** (Scala/Java) | Distributed batch processing |

> Java's verbosity is partly *the point* in this context — every type, every null check, every boundary is explicit and auditable. When a calculation is wrong it costs real money.

### Modern Fintech Startups

| Company | Backend | Frontend | Notes |
|---|---|---|---|
| **Stripe** | Go + Ruby | React | Payments infrastructure |
| **Robinhood** | Python + Go | React | Retail investing |
| **Plaid** | Go | React | Bank data connectivity |
| **Coinbase** | Go + Python | React | Crypto exchange |
| **Affirm** | Python + Kotlin | React | Buy-now-pay-later |
| **Chime** | Python + Ruby | React | Neobank |
| **Square / Block** | Java + Kotlin | React | Payments + commerce |

**Pattern:** React frontend is nearly universal. Backend is Go, Python, or Kotlin — rarely plain Java at greenfield startups.

### Where Each Language Lives in Finance

| Language | Role in Finance |
|---|---|
| **Python** | Data science, quant modeling, risk analytics, ML — dominant here |
| **Go** | High-performance APIs, payment processing, infrastructure |
| **Java / Kotlin** | Core banking systems, legacy modernization |
| **C++** | High-frequency trading (microsecond latency matters) |
| **R** | Statistical modeling, actuarial work |
| **SQL** | Everywhere — financial data is relational |
| COBOL | Still running at major banks (seriously) |
| **TypeScript** | Frontend and increasingly backend APIs |

### The AI / ML Layer in Finance
Python owns this space entirely:
- **pandas / NumPy** — data manipulation
- **scikit-learn** — classical ML (fraud detection, credit scoring)
- **PyTorch / TensorFlow** — deep learning
- **Jupyter notebooks** — quant research and analysis

---

## Embedded & Robotics Software

This is a distinct branch from web development — closer to your assembly and C background from school.

### The Two Layers of a Robot

A modern robot or autonomous machine typically has two separate software concerns:

```
┌─────────────────────────────────┐
│  AI / Training Layer            │  ← Runs on powerful cloud servers or workstations
│  (Python + PyTorch + CUDA)      │
├─────────────────────────────────┤
│  On-Board Embedded Layer        │  ← Runs on the robot itself, real-time
│  (C / C++ / Rust)               │
└─────────────────────────────────┘
```

---

### On-Board Embedded Software (The Robot / Machine Itself)

| Language | Role | Notes |
|---|---|---|
| **C** | Bare-metal microcontrollers | Still dominant for resource-constrained hardware; no OS, direct register access |
| **C++** | Robotics middleware, ROS nodes | Object-oriented on top of C performance; standard for ROS |
| **Rust** | Emerging embedded alternative | Memory safety *without* a garbage collector — no GC pauses means real-time safe |
| Assembly | Bootloaders, ISR timing loops | Still used for the most latency-critical code |
| MicroPython | Simple microcontrollers, prototyping | Python subset that runs on chips like the Raspberry Pi Pico |
| Ada | Aerospace, defense, medical devices | Safety-critical systems where failure = lives lost |

### Real-Time Operating Systems (RTOS)
Unlike a phone or laptop, embedded systems often run an RTOS instead of Linux:

| RTOS | Used In |
|---|---|
| **FreeRTOS** | Most popular open-source RTOS; consumer electronics, IoT |
| **Zephyr** | Linux Foundation project; growing in IoT and wearables |
| **VxWorks** | Military, aerospace (Mars rovers, F-35) |
| **QNX** | Automotive (used in most car infotainment systems) |
| **ThreadX** | Consumer electronics; acquired by Microsoft |

### Robotics Middleware — ROS

**ROS (Robot Operating System)** is not an OS — it's a middleware framework that handles communication between sensors, actuators, and control systems. Think of it as the "Spring Boot of robotics."

- **Languages:** C++ (performance-critical nodes) and Python (high-level logic)
- **ROS 1** — older, research-oriented
- **ROS 2** — modern rewrite with real-time support and better security
- Used by: research universities, Boston Dynamics, many industrial robots

```
Sensor Node (C++) → ROS Message Bus → Control Node (Python) → Actuator Node (C++)
```
This publish/subscribe pattern will look familiar from Kafka.

### Arduino & Maker Hardware
| Platform | Language | Notes |
|---|---|---|
| **Arduino** | C/C++ subset | Beginner-friendly; huge community |
| **Raspberry Pi** | Python / C++ | Full Linux computer; used for higher-level robot control |
| **ESP32** | C++ / MicroPython | Wi-Fi + Bluetooth chip; dominant in IoT |
| **NVIDIA Jetson** | Python + C++ | Edge AI inference; runs a full Ubuntu Linux |

---

### AI / Training Layer for Robotics

The model training happens offline on powerful machines, then the trained model is deployed to the robot.

| Technology | Role |
|---|---|
| **Python** | Universal language for all AI/ML training |
| **PyTorch** | Most popular deep learning framework (research + production) |
| **TensorFlow / Keras** | Google's framework; strong in mobile/edge deployment |
| **JAX** | Google's newer framework; favored by researchers for speed |
| **CUDA (C++ / Python)** | NVIDIA GPU programming; runs the actual matrix math |

### Simulation Environments
Training robots in the real world is expensive and slow. Simulators let you train in virtual physics:

| Simulator | Notes |
|---|---|
| **NVIDIA Isaac Sim** | Photo-realistic; trains with synthetic data |
| **Gazebo / Ignition** | Open-source; tightly integrated with ROS |
| **MuJoCo** | Physics simulation; popular in reinforcement learning research (now free via DeepMind) |
| **PyBullet** | Python-first physics engine; easy to get started |
| **Webots** | Open-source; good for academic use |

### Reinforcement Learning (How Robots Learn to Move)
RL is where a robot learns by trial and error in simulation — reward good behavior, penalize bad. This is how Boston Dynamics' robots learned to walk.

| Framework | Notes |
|---|---|
| **OpenAI Gym / Gymnasium** | Standard interface for RL environments |
| **Stable Baselines3** | Ready-made RL algorithms in Python |
| **Ray RLlib** | Distributed RL training at scale |
| **Isaac Lab** | NVIDIA's RL framework built on Isaac Sim |

### Edge Inference — Running AI On the Robot
After training, a compressed model runs on the robot's hardware:

| Technology | Notes |
|---|---|
| **TensorFlow Lite** | Compressed models for microcontrollers and phones |
| **ONNX Runtime** | Cross-platform model deployment |
| **NVIDIA Jetson** | Full GPU inference at the edge (used in many autonomous vehicles) |
| **Google Coral / Edge TPU** | Low-power dedicated ML chips |
| **OpenCV** | Computer vision library; C++ and Python; runs on-device |

---

### Who Uses What — Robotics Industry

| Company / System | On-Board | AI / Training |
|---|---|---|
| **Boston Dynamics** | C++ + ROS | Python + PyTorch + simulation |
| **Tesla Autopilot** | C++ (custom HW) | Python + PyTorch + CUDA |
| **NASA Mars Rovers** | C / C++ (VxWorks RTOS) | Python for science instruments |
| **iRobot (Roomba)** | C / C++ | Python for mapping algorithms |
| **DJI Drones** | C++ | Python + simulation |
| **FANUC / ABB / KUKA** (industrial) | Proprietary languages (Karel, RAPID, KRL) | Increasingly Python for AI add-ons |
| **Waymo / Cruise** (self-driving) | C++ | Python + TensorFlow/PyTorch |

---

### How It All Connects — The Full Picture

```
Cloud Training (Python + PyTorch + CUDA)
        ↓  export trained model
Edge Inference Hardware (Jetson / Coral)
        ↓  inference results
ROS 2 Message Bus (C++ / Python nodes)
    ↙           ↘
Sensors        Actuators
(cameras,      (motors,
 lidar, IMU)    servos, grippers)
        ↓
Bare-Metal Microcontrollers (C / C++ / Rust)
```

### The C / Assembly You Learned Still Matters
- Every layer above eventually compiles down to machine code
- CUDA kernels are written in C++
- ROS nodes are C++ under the hood
- The RTOS scheduler is C
- Memory management intuition from C transfers directly to Rust
- Understanding pointers makes you dangerous in embedded regardless of the language on top

---

## Summary — Language by Domain

| Domain | Primary Language(s) |
|---|---|
| Web frontend | TypeScript + React |
| Web backend (startup) | Go, Python, TypeScript |
| Web backend (enterprise) | Java, Kotlin |
| Financial data / quant | Python |
| High-frequency trading | C++ |
| Robotics on-board | C, C++, Rust |
| Robotics middleware | C++ + Python (ROS) |
| AI/ML training | Python |
| GPU programming | CUDA C++ |
| Safety-critical embedded | C, Ada, Rust |
| IoT / maker | C++, MicroPython |

---

## Robotics as a Hobby — Getting Started & Progression Path

A natural learning progression starting from an Arduino starter kit, aimed at a high school student with interest in circuits and math.

### Where You Are Now
**Arduino Uno starter kit** — digital/analog I/O, basic sensors, C++ fundamentals. Learning to think in terms of hardware + software together, which is the hard part. Most people never get this far.

---

### Next Step — Add Motion & Mechanical Thinking

**ELEGOO Smart Robot Car Kit (~$40–60)**
- Builds on Arduino directly
- Adds motors, motor drivers, ultrasonic sensors, IR sensors
- You write the code that makes it avoid obstacles, follow lines, respond to commands
- Good bridge between "blinking LEDs" and "something that moves in the world"

**Parallax BOE-Bot (~$120)**
- Slightly more serious than ELEGOO
- Better documentation, more structured curriculum
- Good if you learn well from guided projects

---

### Step Up — Real Robotics Platform

**LEGO Mindstorms EV3 / SPIKE Prime (~$350)**
- Don't let the LEGO brand fool you — this is what high school robotics competitions use
- Programmable in Python and a block language
- Immediately satisfying because the mechanical assembly is fast and the results are impressive
- FIRST Robotics teams use SPIKE Prime

**VEX Robotics IQ (~$250–400)**
- More engineering-focused than LEGO
- Used in VEX IQ competitions nationwide
- Competing is a legitimate path to college scholarships

---

### Serious Jump — Raspberry Pi + ROS

Once comfortable with Arduino, this is where it gets close to professional robotics:

**Raspberry Pi 5 starter kit (~$100–120)**
- Full Linux computer the size of a credit card
- Runs Python natively
- Can run ROS2 (the actual framework used in industry)
- Connect it to Arduino for the real-time motor control layer — exactly the two-tier architecture described in the Embedded section above

**TurtleBot 4 (~$1,200)**
- The standard ROS2 learning platform used in universities
- LIDAR, cameras, full navigation stack
- Jumps you directly into what professional robotics engineers use

---

### AI / Vision Layer

Once motion is comfortable, add perception:

**OpenCV + Raspberry Pi Camera (~$25 for the camera)**
- Computer vision library — object detection, color tracking, face detection
- Python-based, huge community, tons of tutorials
- Projects: follow a colored ball, identify objects, read signs

**NVIDIA Jetson Nano (~$150–200 used)**
- The serious edge AI board — runs neural networks on-device
- Worth it when getting into object detection and needing real performance
- The same hardware used in professional robotics products

---

### Competition Path

Competitions are transformative for a motivated high school student:

| Competition | Level | What It Is |
|---|---|---|
| **FIRST Robotics (FRC)** | High school | Full-size robots, 6-week build season, very prestigious |
| **VEX Robotics** | Middle + High school | Smaller robots, year-round competitions |
| **FIRST Tech Challenge (FTC)** | High school | Middle ground between VEX and FRC; uses Java/Android |
| **Science Olympiad** | K–12 | Includes robotics and engineering events |

FRC in particular is a direct pipeline to engineering scholarships and robotics internships. Worth checking if her school has an existing team.

---

### Suggested Progression Timeline

```
Now:        Arduino kit (circuits + C++ thinking)
Month 2-3:  ELEGOO robot car (add motion)
Month 4-6:  Raspberry Pi + Python (add Linux + real programming)
Month 6+:   OpenCV camera projects (add vision)
Year 2:     ROS2 on Pi + Arduino together (professional architecture)
Optionally: Join/start a FIRST Robotics team at her school
```

### Why Math Matters Here
Linear algebra — which hits in late high school or early college — is the direct mathematical foundation for:
- Robotics motion planning (transformation matrices, coordinate frames)
- Computer vision (image processing, geometric transforms)
- Neural networks (the math behind AI training)

A student who has interest in both circuits and math and gets this exposure early is well ahead of most engineering undergraduates.