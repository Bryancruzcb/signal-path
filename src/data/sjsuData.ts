export type WeeklyTask = {
  id: string
  title: string
  detail: string
  duration: string
}

export type CourseModule = {
  id: string
  title: string
  subtitle: string
  duration: string
  deliverable: string
  why: string
  steps: string[]
  resources: Array<{ label: string; url: string }>
}

export type CourseInfo = {
  code: string
  title: string
  tone: 'os' | 'network'
  status: string
  official: string
  prereqs: string
  stack: string[]
  likelyStack: string
  assessment: string
  assessmentNote: string
  story: string
  evidenceNote: string
  modules: CourseModule[]
}

export type KnownCourse = {
  id: string
  label: string
  default: boolean
}

export type RoadmapCourse = {
  code: string
  title: string
  kind: 'ds' | 'critical' | 'plain'
}

export type RoadmapTerm = {
  year: string
  term: string
  courses: RoadmapCourse[]
  noteTitle: string
  note: string
}

export type SkillArea = {
  title: string
  detail: string
}

export type ProjectStage = {
  term: string
  title: string
  detail: string
}

export type ElectiveInfo = {
  course: string
  capability: string;
  payoff: string
  signal: string
}

export type SourceInfo = {
  type: 'official' | 'syllabus' | 'student' | 'resource'
  title: string
  description: string
  meta: string;
  url: string
}

export const WEEKLY_TASKS: WeeklyTask[] = [
  {
    id: "linux-workbench",
    title: "Set up your Linux workbench",
    detail: "Compile a C file with strict warnings and run it from the terminal.",
    duration: "45m",
  },
  {
    id: "process-tree",
    title: "Draw and run a process tree",
    detail: "Use fork, exec, and wait—then predict the output before running it.",
    duration: "55m",
  },
  {
    id: "dns-capture",
    title: "Capture one DNS lookup",
    detail: "Use Wireshark to label the query, response, addresses, and timing.",
    duration: "45m",
  },
  {
    id: "tcp-echo",
    title: "Build a Python TCP echo pair",
    detail: "Send bytes across localhost and handle a clean disconnect.",
    duration: "70m",
  },
  {
    id: "teach-back",
    title: "Record a two-minute teach-back",
    detail: "Explain process vs. thread and TCP vs. UDP without notes.",
    duration: "35m",
  },
]

export const COURSES: Record<string, CourseInfo> = {
  cs149: {
    code: "CS 149",
    title: "Operating Systems",
    tone: "os",
    status: "Waitlisted · Fall 2026",
    official:
      "Memory management, processor scheduling and interrupts, concurrent and synchronized processes, deadlocks, parallel computing, files, and substantial programming work.",
    prereqs: "CS 47 + CS 146 (C− or better)",
    stack: ["C", "Bash", "Linux / Ubuntu", "GCC", "GDB", "pthreads", "xv6 · section-dependent"],
    likelyStack: "C + Bash on Linux",
    assessment: "Programming-heavy; exams remain substantial",
    assessmentNote: "Latest public sections differ sharply in weighting.",
    story:
      "This course asks you to stop treating the operating system as background magic. You will reason about what happens between a program and the hardware: who gets the CPU, where bytes live, what can run at the same time, and how files survive. Recent public SJSU syllabi converge on C, Linux, processes, memory, concurrency, and filesystems—even when the exact project changes.",
    evidenceNote: "Strong current evidence",
    modules: [
      {
        id: "os-c-workbench",
        title: "C for systems",
        subtitle: "Pointers, memory, structs, compilation, and debugging",
        duration: "2–3 hours",
        deliverable: "A warning-clean dynamic vector with a memory-check report",
        why:
          "Every recent technical syllabus points toward C. Comfort with memory and compiler feedback removes avoidable friction before the operating-systems ideas get difficult.",
        steps: [
          "Compile with -Wall -Wextra -Wpedantic and explain every warning you fix.",
          "Implement a resizable integer vector using malloc, realloc, and free.",
          "Trigger one memory bug intentionally, find it with a debugger or sanitizer, and write a three-sentence postmortem.",
        ],
        resources: [
          { label: "Beej's Guide to C Programming", url: "https://beej.us/guide/bgc/" },
          { label: "GDB documentation", url: "https://sourceware.org/gdb/documentation/" },
        ],
      },
      {
        id: "os-linux",
        title: "Unix / Linux workbench",
        subtitle: "Files, permissions, pipes, redirection, Make, and man pages",
        duration: "2 hours",
        deliverable: "A multi-file C program built entirely from the terminal",
        why:
          "Spring 2026 CS 149 materials explicitly use Linux, the command line, C, and Bash. The terminal should become your instrument panel, not another assignment.",
        steps: [
          "Practice navigation, permissions, redirection, pipelines, grep, and process inspection.",
          "Split a small C program into header and source files, then build it with Make.",
          "Use man pages to answer one question without searching for a tutorial.",
        ],
        resources: [
          { label: "The Linux man-pages project", url: "https://www.kernel.org/doc/man-pages/" },
          { label: "The Linux Command Line", url: "https://linuxcommand.org/tlcl.php" },
        ],
      },
      {
        id: "os-processes",
        title: "Processes & system calls",
        subtitle: "fork, exec, waitpid, signals, and process trees",
        duration: "3 hours",
        deliverable: "A tiny command runner that reports child exit status",
        why:
          "Processes and system calls appear at the beginning of current SJSU schedules and form the base for later IPC, scheduling, and concurrency work.",
        steps: [
          "Draw the process tree for two nested fork calls before executing the program.",
          "Build a parent process that launches a command with fork + exec and waits for it.",
          "Add exit-status reporting and a SIGINT handler; document what belongs to the shell versus the child.",
        ],
        resources: [
          { label: "OSTEP · Processes", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf" },
          { label: "Linux process API man pages", url: "https://man7.org/linux/man-pages/man2/fork.2.html" },
        ],
      },
      {
        id: "os-ipc",
        title: "File descriptors & IPC",
        subtitle: "open, read, write, pipes, redirection, and shared memory",
        duration: "3 hours",
        deliverable: "A two-command pipeline with redirected output",
        why:
          "Current CS 149 syllabi name pipes, sockets, file I/O, and shared memory. File descriptors are the common language beneath them.",
        steps: [
          "Copy a file using open, read, write, and close—no stdio helpers.",
          "Connect two child processes with pipe and dup2.",
          "Explain which descriptors each process must close and why a forgotten close can hang the program.",
        ],
        resources: [
          { label: "OSTEP · Interlude: Process API", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-api.pdf" },
          { label: "pipe(2) manual page", url: "https://man7.org/linux/man-pages/man2/pipe.2.html" },
        ],
      },
      {
        id: "os-concurrency",
        title: "Threads & synchronization",
        subtitle: "pthreads, locks, condition variables, semaphores, and races",
        duration: "4 hours",
        deliverable: "A bounded producer–consumer queue with a race demonstration",
        why:
          "Race conditions, locks, condition variables, semaphores, and concurrent structures occupy a large block in the latest SJSU schedule.",
        steps: [
          "Create a reproducible race on a shared counter and explain why the output changes.",
          "Protect the invariant with a mutex, then compare correctness and timing.",
          "Implement a bounded queue using a mutex plus two condition variables; prove why each wait uses a loop.",
        ],
        resources: [
          { label: "OSTEP · Concurrency", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/#book-chapters" },
          { label: "pthreads overview", url: "https://man7.org/linux/man-pages/man7/pthreads.7.html" },
        ],
      },
      {
        id: "os-scheduling",
        title: "CPU scheduling",
        subtitle: "FCFS, SJF, round robin, MLFQ, response time, and fairness",
        duration: "3 hours",
        deliverable: "A scheduler simulator with a timeline and three metrics",
        why:
          "Scheduling is explicitly required and is a reliable source of both conceptual questions and small simulation projects.",
        steps: [
          "Simulate FCFS, shortest-job-first, and round robin over the same workload.",
          "Calculate turnaround, waiting, and response time for each policy.",
          "Write one paragraph explaining when the lowest average turnaround is still a bad user experience.",
        ],
        resources: [
          { label: "OSTEP · CPU Scheduling", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf" },
        ],
      },
      {
        id: "os-memory",
        title: "Virtual memory",
        subtitle: "Address spaces, paging, TLBs, allocation, and replacement",
        duration: "4 hours",
        deliverable: "A page-replacement simulator plus one hand-worked translation",
        why:
          "Memory hierarchy, locality, mapping, replacement, paging, and swapping are central official learning outcomes—not optional details.",
        steps: [
          "Translate virtual addresses through a small page table by hand.",
          "Implement FIFO and LRU page replacement over a reference string.",
          "Graph page faults as frame count changes and explain one surprising result.",
        ],
        resources: [
          { label: "OSTEP · Virtualization", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/#book-chapters" },
        ],
      },
      {
        id: "os-files",
        title: "Filesystems & I/O",
        subtitle: "Inodes, directories, allocation, disks, and crash consistency",
        duration: "3–4 hours",
        deliverable: "A toy block allocator or annotated filesystem trace",
        why:
          "Files, directories, disks, filesystem implementations, and direct I/O close the latest public CS 149 sequence.",
        steps: [
          "Trace path lookup from a filename to inode to data blocks.",
          "Compare contiguous, linked, and indexed allocation on access time and fragmentation.",
          "Inspect one real file with stat and explain at least five fields in operating-system terms.",
        ],
        resources: [
          { label: "OSTEP · Persistence", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/#book-chapters" },
          { label: "xv6 book", url: "https://pdos.csail.mit.edu/6.828/2023/xv6/book-riscv-rev3.pdf" },
        ],
      },
    ],
  },
  cs158: {
    code: "CS 158A",
    title: "Computer Networks",
    tone: "network",
    status: "Waitlisted · Fall 2026",
    official:
      "Layered architectures, LAN/WAN and wireless networks, TCP/IP, network programming, performance, resource management, security, and applications.",
    prereqs: "CS 146 + CS 47 (current catalog wording)",
    stack: ["Python · latest Ishigaki", "Wireshark", "TCP / UDP sockets", "ping", "traceroute", "DNS", "Docker · section-dependent"],
    likelyStack: "Python + Wireshark; language varies",
    assessment: "Concept breadth + packet work + socket coding",
    assessmentNote: "Public sections range from project-heavy to 75% exams.",
    story:
      "Computer networks is really a course about contracts between layers. You will follow data from an application into transport, routing, links, and back again, then test those ideas with packet captures and sockets. Wireshark and TCP/UDP programming are stable preparation targets. The programming language changes by instructor: the newest Ishigaki syllabus names Python, while older sections used Java.",
    evidenceNote: "Stable concepts; variable implementation",
    modules: [
      {
        id: "net-packet",
        title: "A packet's journey",
        subtitle: "Layers, encapsulation, latency, throughput, loss, and queueing",
        duration: "2–3 hours",
        deliverable: "An annotated browser-to-server journey plus delay calculations",
        why:
          "Every public syllabus begins with layered models and network performance. A mental map keeps protocols from becoming disconnected vocabulary.",
        steps: [
          "Draw application, transport, network, link, and physical layers for one web request.",
          "Calculate transmission and propagation delay for a small scenario.",
          "Explain where headers are added and removed, and which device reads each one.",
        ],
        resources: [
          { label: "Computer Networks: A Systems Approach", url: "https://book.systemsapproach.org/" },
          { label: "An Introduction to Computer Networks", url: "https://intronetworks.cs.luc.edu/" },
        ],
      },
      {
        id: "net-wireshark",
        title: "Wireshark & network CLI",
        subtitle: "Capture filters, display filters, DNS, TCP handshakes, and diagnostics",
        duration: "3 hours",
        deliverable: "An annotated DNS lookup and TCP handshake capture",
        why:
          "Wireshark appears across SJSU sections from 2021 through 2026. Seeing packets turns protocol diagrams into observable behavior.",
        steps: [
          "Run ping, traceroute, and a DNS lookup; predict the traffic each command creates.",
          "Capture a DNS query and label request, response, addresses, ports, and timing.",
          "Capture a TCP three-way handshake and explain every flag and sequence transition.",
        ],
        resources: [
          { label: "Official Wireshark User's Guide", url: "https://www.wireshark.org/docs/wsug_html_chunked/" },
          { label: "Wireshark display-filter reference", url: "https://www.wireshark.org/docs/dfref/" },
        ],
      },
      {
        id: "net-sockets",
        title: "Python sockets",
        subtitle: "Bytes, ports, framing, timeouts, exceptions, and concurrency",
        duration: "4 hours",
        deliverable: "UDP echo + concurrent TCP chat or file server",
        why:
          "The newest public Ishigaki syllabus explicitly requires Python, and socket programming is a current course outcome across sections.",
        steps: [
          "Build a UDP client/server pair and observe what happens when a datagram is lost.",
          "Build a TCP echo pair, handling partial reads and clean shutdown.",
          "Add length-prefixed framing and support two clients concurrently.",
        ],
        resources: [
          { label: "Python socket documentation", url: "https://docs.python.org/3/library/socket.html" },
          { label: "Beej's Guide to Network Programming", url: "https://beej.us/guide/bgnet/" },
        ],
      },
      {
        id: "net-apps",
        title: "Application protocols",
        subtitle: "HTTP, DNS, email, P2P, and CDNs",
        duration: "3 hours",
        deliverable: "A raw-socket HTTP client and a small DNS inspector",
        why:
          "Recent sections cover web, email, DNS, P2P, and content distribution before or alongside transport fundamentals.",
        steps: [
          "Send a valid HTTP request over a TCP socket and parse the status line plus headers.",
          "Use dig or nslookup to trace several DNS record types.",
          "Explain what a CDN changes—and what it cannot change—about a request path.",
        ],
        resources: [
          { label: "MDN · Overview of HTTP", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview" },
          { label: "Cloudflare Learning Center · DNS", url: "https://www.cloudflare.com/learning/dns/what-is-dns/" },
        ],
      },
      {
        id: "net-reliable",
        title: "Reliable transport",
        subtitle: "Checksums, sequence numbers, ACKs, retransmission, windows, and TCP",
        duration: "4 hours",
        deliverable: "Reliable transfer over deliberately lossy UDP",
        why:
          "Reliable data transfer, sliding windows, TCP/UDP, and flow control are stable exam and programming targets across the syllabus history.",
        steps: [
          "Simulate stop-and-wait over a link that randomly loses packets and ACKs.",
          "Add sequence numbers, timeouts, and retransmission.",
          "Extend to a small sliding window and compare throughput as RTT increases.",
        ],
        resources: [
          { label: "Systems Approach · Reliable byte stream", url: "https://book.systemsapproach.org/e2e/tcp.html" },
        ],
      },
      {
        id: "net-performance",
        title: "Congestion & performance",
        subtitle: "RTT, throughput, bottlenecks, congestion windows, and fairness",
        duration: "3 hours",
        deliverable: "A measured client/server experiment with two plots",
        why:
          "Performance and congestion are explicit parts of the official description and prominent in the newest top-down SJSU sequence.",
        steps: [
          "Measure RTT and throughput under at least three controlled conditions.",
          "Graph the results with uncertainty or repeated trials instead of one-off numbers.",
          "Identify the bottleneck and distinguish congestion control from flow control.",
        ],
        resources: [
          { label: "Systems Approach · Congestion control", url: "https://book.systemsapproach.org/congestion/tcpcc.html" },
        ],
      },
      {
        id: "net-routing",
        title: "IP, routing & LANs",
        subtitle: "IPv4/6, CIDR, forwarding, ICMP, ARP, Ethernet, VLANs, and Wi‑Fi",
        duration: "4 hours",
        deliverable: "Subnet drills, a forwarding table, and an LAN diagram",
        why:
          "Network-layer routing and link-layer LAN concepts occupy a large share of recent SJSU schedules and often require hand calculation.",
        steps: [
          "Complete ten CIDR/subnet exercises and check every network/broadcast boundary.",
          "Apply longest-prefix matching to a forwarding table.",
          "Trace a packet from one LAN to another, naming ARP, switch, router, and TTL behavior.",
        ],
        resources: [
          { label: "Systems Approach · Internetworking", url: "https://book.systemsapproach.org/internetworking/index.html" },
        ],
      },
      {
        id: "net-capstone",
        title: "Networking → data capstone",
        subtitle: "Collect, validate, analyze, and explain network measurements",
        duration: "5–6 hours",
        deliverable: "A reproducible notebook and three-minute technical briefing",
        why:
          "This lab bridges your intended data-science niche with networking while remaining grounded in current course outcomes: measurement, performance, programming, and explanation.",
        steps: [
          "Collect non-sensitive RTT or throughput observations at regular intervals.",
          "Clean and validate the measurements in pandas; keep the raw data immutable.",
          "Visualize distributions, time trends, and outliers, then explain what the network evidence can and cannot prove.",
        ],
        resources: [
          { label: "pandas user guide", url: "https://pandas.pydata.org/docs/user_guide/index.html" },
          { label: "Python socket documentation", url: "https://docs.python.org/3/library/socket.html" },
        ],
      },
    ],
  },
}

export const KNOWN_COURSES: KnownCourse[] = [
  { id: "cs46a", label: "CS 46A", default: true },
  { id: "cs46b", label: "CS 46B", default: true },
  { id: "cs47", label: "CS 47", default: true },
  { id: "cs146", label: "CS 146", default: true },
  { id: "cs151", label: "CS 151", default: true },
  { id: "cs100w", label: "CS 100W", default: false },
  { id: "cs147", label: "CS 147", default: false },
  { id: "math39", label: "MATH 39", default: false },
  { id: "math161a", label: "MATH 161A", default: false },
  { id: "cs157a", label: "CS 157A", default: false },
]

export const ROADMAP: RoadmapTerm[] = [
  {
    year: "YEAR 3 · FALL",
    term: "Fall 2026",
    courses: [
      { code: "CS 149", title: "Operating Systems", kind: "critical" },
      { code: "CS 158A", title: "Computer Networks", kind: "ds" },
      { code: "CS 100W", title: "Technical Writing gateway", kind: "critical" },
      { code: "MATH 39 / 161A", title: "Fill the math gap", kind: "ds" },
    ],
    noteTitle: "If a waitlist does not clear",
    note: "Use CS 157A first, then CS 147, then another required core. Keep one lighter requirement beside CS 149.",
  },
  {
    year: "YEAR 3 · SPRING",
    term: "Spring 2027",
    courses: [
      { code: "CS 147", title: "Computer Architecture", kind: "critical" },
      { code: "CS 157A", title: "Database Management", kind: "critical" },
      { code: "CS 152", title: "Programming Paradigms", kind: "critical" },
      { code: "CS 133", title: "Data Visualization", kind: "ds" },
    ],
    noteTitle: "Workload valve",
    note: "Four technical courses is aggressive. Move CS 133 to Fall 2027 if the rest of your degree audit is already dense.",
  },
  {
    year: "YEAR 4 · FALL",
    term: "Fall 2027",
    courses: [
      { code: "CS 160", title: "Software Engineering", kind: "critical" },
      { code: "CS 154", title: "Formal Languages", kind: "critical" },
      { code: "CS 171", title: "Machine Learning", kind: "ds" },
      { code: "LIGHTER", title: "GE / science / deferred CS 133", kind: "plain" },
    ],
    noteTitle: "Sequence protection",
    note: "Completing CS 100W earlier keeps CS 160 from becoming a graduation bottleneck.",
  },
  {
    year: "YEAR 4 · SPRING",
    term: "Spring 2028",
    courses: [
      { code: "CS 166", title: "Information Security", kind: "critical" },
      { code: "CS 157C", title: "NoSQL / distributed data", kind: "ds" },
      { code: "CS 122 / 131", title: "Python or Big Data", kind: "ds" },
      { code: "AUDIT GAPS", title: "Remaining elective / GE / science", kind: "plain" },
    ],
    noteTitle: "Catalog-year check",
    note: "A likely 2024–25 audit asks for 14 elective units; the current catalog asks for 17. MyProgress decides yours.",
  },
]

export const SKILLS: SkillArea[] = [
  { title: "Systems", detail: "CS 149 · CS 158A" },
  { title: "Data foundations", detail: "CS 157A · 157C · 131" },
  { title: "Modeling", detail: "CS 156 · 171 · MATH 161A" },
  { title: "Communication", detail: "CS 133 · CS 100W" },
]

export const PROJECT_STAGES: ProjectStage[] = [
  { term: "Y3 · FALL", title: "Collect", detail: "A networked Python service records non-sensitive campus or public data with timestamps and validation." },
  { term: "Y3 · SPRING", title: "Store", detail: "Move the observations into a relational schema, add indexes, and document data quality rules." },
  { term: "Y4 · FALL", title: "Model", detail: "Form one defensible ML question, build a baseline, and report uncertainty—not just accuracy." },
  { term: "Y4 · SPRING", title: "Scale & explain", detail: "Add a distributed or NoSQL layer only where the workload earns it, then publish a technical case study." },
]

export const ELECTIVES: ElectiveInfo[] = [
  { course: "CS 157A", capability: "Relational databases", payoff: "SQL, schema design, transactions, indexes—the foundation beneath most real datasets.", signal: "Required core · prioritize" },
  { course: "CS 171", capability: "Machine learning", payoff: "Classic ML, neural networks, labs, and a major project.", signal: "High-value elective" },
  { course: "CS 133", capability: "Analysis & visualization", payoff: "Turn exploration and findings into interpretable visual evidence.", signal: "High-value elective" },
  { course: "CS 122", capability: "Advanced Python", payoff: "Stronger software habits for data tooling and substantial Python projects.", signal: "Practical elective" },
  { course: "CS 157C", capability: "Distributed / NoSQL data", payoff: "CAP, replication, sharding, cloud, and system tradeoffs after CS 157A.", signal: "Data engineering lane" },
  { course: "CS 131", capability: "Big-data tooling", payoff: "Unix pipelines, shell, reproducibility, and data-intensive computation.", signal: "Data engineering lane" },
  { course: "MATH 161A", capability: "Probability & statistics", payoff: "Inference, confidence intervals, and hypothesis testing for responsible analysis.", signal: "Best math choice if available" },
]

export const SOURCES: SourceInfo[] = [
  {
    type: "official",
    title: "Fall 2026 class schedule",
    description: "Live SJSU schedule for sections and instructors. Seat and reserve-capacity information is volatile; verify MySJSU.",
    meta: "SJSU · updated nightly",
    url: "https://www.sjsu.edu/classes/schedules/fall-2026.php",
  },
  {
    type: "official",
    title: "BS Computer Science · current catalog",
    description: "The 2026–27 degree requirements. Useful for comparison, but your catalog rights may be older.",
    meta: "SJSU catalog · 2026–27",
    url: "https://catalog.sjsu.edu/preview_program.php?catoid=23&poid=18783&returnto=8470",
  },
  {
    type: "official",
    title: "BS Computer Science · likely entry-year catalog",
    description: "The 2024–25 program page, likely relevant to a student who entered in Fall 2024. Confirm in MyProgress.",
    meta: "SJSU catalog · 2024–25",
    url: "https://catalog.sjsu.edu/preview_program.php?catoid=15&poid=9497&returnto=5383",
  },
  {
    type: "official",
    title: "MyProgress instructions",
    description: "SJSU's degree-audit tool. This—not a generic roadmap—is the authority for your remaining requirements.",
    meta: "SJSU Undergraduate Education",
    url: "https://www.sjsu.edu/ue/student-resources/myprogress.php",
  },
  {
    type: "official",
    title: "BSCS prerequisite diagram",
    description: "Department map of the major's prerequisite structure, with a warning to check individual catalog entries.",
    meta: "SJSU CS · effective Fall 2022",
    url: "https://www.sjsu.edu/cs/docs/pdfs/prerequisite-chart-fall22.pdf",
  },
  {
    type: "official",
    title: "Course-offering patterns",
    description: "Department planning table. CS 149 and CS 158A are listed with one or more sections in both fall and spring, subject to staffing and enrollment.",
    meta: "SJSU CS · Apr 2026",
    url: "https://www.sjsu.edu/cs/students/course-offering-patterns.php",
  },
  {
    type: "syllabus",
    title: "CS 149 · Andreopoulos",
    description: "Current C/Linux/Bash evidence, weekly worksheets, assignments, two midterms, a cumulative final, and a detailed topic schedule.",
    meta: "Spring 2026 · official PDF",
    url: "https://www.sjsu.edu/cs/docs/syllabi/spring26/Operating_Systems_CS_149_Spring_2026_Andreopoulos.pdf",
  },
  {
    type: "syllabus",
    title: "CS 149 · Mortezaie",
    description: "A second Spring 2026 implementation covering C, Linux commands, processes, IPC, concurrency, memory, and filesystems.",
    meta: "Spring 2026 · official PDF",
    url: "https://www.sjsu.edu/cs/docs/syllabi/spring26/CS149_02_SP26_Mortezaie.pdf",
  },
  {
    type: "syllabus",
    title: "CS 149 · Butt",
    description: "Newest public Butt syllabus: GCC C/C++ toolchain in Docker and an unusually high section-specific workload estimate.",
    meta: "Spring 2025 · official PDF",
    url: "https://www.sjsu.edu/cs/docs/spring25_syllabi/Spring2025_CS149_Sec2.pdf",
  },
  {
    type: "syllabus",
    title: "CS 149 · Rao",
    description: "C, xv6, QEMU, Ubuntu, GitHub, OSTEP, and demanding individual kernel labs. Useful section-specific project evidence.",
    meta: "Fall 2024 · official PDF",
    url: "https://www.sjsu.edu/cs/docs/fall24_syllabi/Sriram_Rao_CS-149_Sec_03_Operating_Systems_FALL_2024.pdf",
  },
  {
    type: "syllabus",
    title: "CS 158A · Ishigaki",
    description: "Newest public networking syllabus: Python, Wireshark, three programming assignments, quizzes, exams, and a presented project.",
    meta: "Summer 2026 · official PDF",
    url: "https://www.sjsu.edu/cs/docs/syllabi/summer26/Computer_Networks_CS_158A_Summer_2026_Ishigaki.pdf",
  },
  {
    type: "syllabus",
    title: "CS 158A · Mortezaie",
    description: "Bottom-up physical-to-application sequence with client/server programming; 75% of the grade across two midterms and a final.",
    meta: "Spring 2026 · official PDF",
    url: "https://gcp-web.sjsu.edu/cs/docs/syllabi/spring26/CS158_02_SP26_Mortezaie.pdf",
  },
  {
    type: "syllabus",
    title: "CS 158A · Reed",
    description: "Historical Java implementation with TCP/UDP, Wireshark, HTTP, TLS, gRPC, and seven programming assignments. Evidence that language varies.",
    meta: "Spring 2023 · official PDF",
    url: "https://www.sjsu.edu/cs/docs/spring_2023_syllabi/SP23_%20CS-158A%20Sec%2003%20-%20Computer%20Networks.pdf",
  },
  {
    type: "student",
    title: "Student-made guide to SJSU CS",
    description: "Anecdotal but detailed: describes CS 149 as difficult, time-intensive, and highly educational with Ben Reed. Older and professor-specific.",
    meta: "Reddit · May 2021",
    url: "https://www.reddit.com/r/SJSU/comments/n2kso2/",
  },
  {
    type: "student",
    title: "Most difficult CS / CMPE classes",
    description: "An older discussion where several students name CS 149 among the harder courses. Self-selected opinions, not representative data.",
    meta: "Reddit · May 2020",
    url: "https://www.reddit.com/r/SJSU/comments/gqj3gw/",
  },
  {
    type: "student",
    title: "Learn C before the systems sequence",
    description: "Student advice to arrive comfortable with C before CS 47, 147, and 149; this aligns with recent official syllabi.",
    meta: "Reddit · Dec 2023",
    url: "https://www.reddit.com/r/SJSU/comments/18fj2i1/",
  },
  {
    type: "student",
    title: "Ishigaki student ratings",
    description: "A small, self-selected sample with conflicting CS 158A experiences. Useful only as a weak signal about practical work and high-stakes tests.",
    meta: "Rate My Professors · anecdotal",
    url: "https://www.ratemyprofessors.com/professor/2804449",
  },
  {
    type: "resource",
    title: "Operating Systems: Three Easy Pieces",
    description: "Free official home of OSTEP, the primary text in the newest CS 149 syllabus used for this dashboard.",
    meta: "University of Wisconsin–Madison",
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/",
  },
  {
    type: "resource",
    title: "xv6 book",
    description: "MIT's small teaching operating system. Excellent integration practice; exact xv6 assignments remain section-dependent.",
    meta: "MIT PDOS",
    url: "https://pdos.csail.mit.edu/6.828/2023/xv6/book-riscv-rev3.pdf",
  },
  {
    type: "resource",
    title: "Computer Networks: A Systems Approach",
    description: "Open textbook named by the newest public CS 158A syllabus, with strong systems-first explanations.",
    meta: "Open source textbook",
    url: "https://book.systemsapproach.org/",
  },
  {
    type: "resource",
    title: "Wireshark User's Guide",
    description: "Official documentation for the packet-analysis tool that repeatedly appears in SJSU networking sections.",
    meta: "Wireshark Foundation",
    url: "https://www.wireshark.org/docs/wsug_html_chunked/",
  },
  {
    type: "resource",
    title: "Python socket documentation",
    description: "Primary API reference for the language explicitly required in Ishigaki's Summer 2026 CS 158A section.",
    meta: "Python Software Foundation",
    url: "https://docs.python.org/3/library/socket.html",
  },
]
