import {
  BachelorCurriculumStats,
  CareerNode,
  CareerEdge,
} from "../types/careerUniverse";

export const BACHELOR_STATS: BachelorCurriculumStats = {
  degreeName: "Bachelor of Information Technology (Cử nhân CNTT)",
  totalCourses: 52,
  completedCourses: 6,
  remainingCourses: 46,
  progressPercent: 11.54, // (6 / 52) * 100
  gpa: 3.25,
  completedList: [
    "IT101 - Nhập môn Công nghệ Thông tin",
    "IT102 - Cơ sở Lập trình C/C++",
    "IT201 - Toán Rời rạc & Đại số tuyến tính",
    "IT202 - Cấu trúc Dữ liệu & Giải thuật",
    "IT203 - Kiến trúc Máy tính & Hệ điều hành",
    "IT204 - Lập trình Hướng đối tượng (OOP)",
  ],
};

export const INITIAL_DOMAINS = [
  "Software Engineering",
  "Data & Artificial Intelligence",
  "Business & Product",
  "Cybersecurity",
  "Infrastructure, Cloud & Network",
  "UI/UX & Digital Design",
  "Software Testing & QA",
  "IT Operations & Consulting",
  "Research & Education",
] as const;

export type DomainName = (typeof INITIAL_DOMAINS)[number];

export interface DomainRawDefinition {
  id: string;
  name: DomainName;
  vietnameseName: string;
  icon: string;
  description: string;
  occupations: {
    id: string;
    name: string;
    vietnameseName: string;
    description: string;
    coreSkills: string[];
    supportingSkills: string[];
    priorityCourses: string[];
    relevantCourses: { code: string; name: string; credits: number; completed?: boolean; relevanceWeight: number }[];
    recommendedProjects: { title: string; description: string; difficulty: "beginner" | "intermediate" | "advanced"; techStack: string[] }[];
    specializations: {
      id: string;
      name: string;
      vietnameseName: string;
      description: string;
      technologies: string[];
      coreSkills: string[];
      recommendedCourses: string[];
      suggestedProjects: { title: string; description: string; difficulty: "beginner" | "intermediate" | "advanced"; techStack: string[] }[];
      skillGaps: string[];
    }[];
  }[];
}

export const CAREER_UNIVERSE_CATALOG: DomainRawDefinition[] = [
  {
    id: "domain-se",
    name: "Software Engineering",
    vietnameseName: "Kỹ nghệ Phần mềm",
    icon: "Code2",
    description: "Thiết kế, xây dựng, kiểm thử và bảo trì các hệ thống phần mềm quy mô lớn, từ web, mobile đến hệ thống phân tán và nhúng.",
    occupations: [
      {
        id: "occ-backend",
        name: "Backend Developer",
        vietnameseName: "Lập trình viên Backend",
        description: "Xây dựng kiến trúc máy chủ, API, cơ sở dữ liệu và logic xử lý nghiệp vụ cho ứng dụng.",
        coreSkills: ["RESTful API", "Database Design", "System Architecture", "Concurrency", "Security"],
        supportingSkills: ["Docker", "CI/CD", "Unit Testing", "Caching (Redis)", "Message Queues"],
        priorityCourses: ["IT301 - Cơ sở Dữ liệu Nâng cao", "IT304 - Phát triển Web Backend", "IT401 - Kiến trúc Hệ thống Phân tán"],
        relevantCourses: [
          { code: "IT202", name: "Cấu trúc Dữ liệu & Giải thuật", credits: 3, completed: true, relevanceWeight: 1.0 },
          { code: "IT204", name: "Lập trình Hướng đối tượng (OOP)", credits: 3, completed: true, relevanceWeight: 0.95 },
          { code: "IT301", name: "Hệ Quản trị Cơ sở Dữ liệu", credits: 4, completed: false, relevanceWeight: 0.9 },
          { code: "IT304", name: "Lập trình Web & Dịch vụ Mạng", credits: 3, completed: false, relevanceWeight: 0.85 },
          { code: "IT401", name: "Kiến trúc Phần mềm Phân tán", credits: 3, completed: false, relevanceWeight: 0.8 },
        ],
        recommendedProjects: [
          {
            title: "Hệ thống Quản lý Thư viện / E-Commerce API",
            description: "Xây dựng RESTful API bảo mật với JWT, RBAC, phân trang, caching Redis và PostgreSQL.",
            difficulty: "intermediate",
            techStack: ["Java Spring Boot", "PostgreSQL", "Docker", "Redis"],
          },
          {
            title: "Microservices Event-Driven Platform",
            description: "Hệ thống dịch vụ phân tán giao tiếp qua Apache Kafka với Transactional Outbox Pattern.",
            difficulty: "advanced",
            techStack: ["Node.js / Go", "Kafka", "PostgreSQL", "Kubernetes"],
          },
        ],
        specializations: [
          {
            id: "spec-java-backend",
            name: "Java Backend Developer",
            vietnameseName: "Lập trình viên Java Backend",
            description: "Chuyên sâu hệ sinh thái Java Enterprise, Spring Boot, Hibernate/JPA và kiến trúc Microservices doanh nghiệp.",
            technologies: ["Java 21", "Spring Boot 3", "Spring Cloud", "JPA/Hibernate", "PostgreSQL", "Kafka"],
            coreSkills: ["Dependency Injection", "Spring Security", "ORM Optimization", "Transaction Management"],
            recommendedCourses: ["IT304 - Lập trình Java Nâng cao", "IT401 - Kiến trúc Phần mềm Doanh nghiệp"],
            suggestedProjects: [
              {
                title: "Hệ thống Thanh toán Trực tuyến",
                description: "Tích hợp cổng thanh toán ngân hàng với Idempotency Key, logging và audit trail chuẩn bảo mật PCI-DSS.",
                difficulty: "intermediate",
                techStack: ["Spring Boot", "MySQL", "Redis", "Docker"],
              },
            ],
            skillGaps: ["Tối ưu hóa GC (Garbage Collection) và JVM Memory", "Spring Cloud Eureka / Gateway trong kiến trúc Microservices"],
          },
          {
            id: "spec-python-backend",
            name: "Python Backend Developer",
            vietnameseName: "Lập trình viên Python Backend",
            description: "Phát triển web APIs hiệu năng cao với FastAPI, Django, tích hợp các pipeline dữ liệu và AI/LLM agents.",
            technologies: ["Python 3.12", "FastAPI", "Django REST Framework", "SQLAlchemy", "Celery", "Redis"],
            coreSkills: ["Asynchronous Programming (asyncio)", "Pydantic Validation", "RESTful / GraphQL APIs", "Background Workers"],
            recommendedCourses: ["IT305 - Lập trình Python Ứng dụng", "IT301 - Cơ sở Dữ liệu"],
            suggestedProjects: [
              {
                title: "AI Agent Orchestration API",
                description: "Backend FastAPI hỗ trợ streaming SSE câu trả lời từ LLM và lưu trữ vector database.",
                difficulty: "intermediate",
                techStack: ["FastAPI", "Qdrant", "Redis", "Celery"],
              },
            ],
            skillGaps: ["Quản lý Asynchronous Task Queue với Celery & RabbitMQ", "Tối ưu hóa Database Connection Pooling với asyncpg"],
          },
          {
            id: "spec-nodejs-backend",
            name: "Node.js Backend Developer",
            vietnameseName: "Lập trình viên Node.js Backend",
            description: "Xây dựng realtime APIs, microservices với NestJS/Express và TypeScript hướng đối tượng vững chắc.",
            technologies: ["TypeScript", "NestJS", "Express", "Prisma / TypeORM", "Socket.io", "MongoDB / Postgres"],
            coreSkills: ["Event Loop Architecture", "TypeScript Typings", "WebSocket Realtime", "Microservices Transport"],
            recommendedCourses: ["IT304 - Phát triển Web Backend", "IT204 - OOP"],
            suggestedProjects: [
              {
                title: "Realtime Collaboration Chat & Document Platform",
                description: "Hệ thống tin nhắn và cộng tác theo thời gian thực với Socket.io và Redis Pub/Sub.",
                difficulty: "intermediate",
                techStack: ["NestJS", "TypeScript", "PostgreSQL", "Socket.io"],
              },
            ],
            skillGaps: ["Debugging memory leaks trong Node.js V8 engine", "Domain-Driven Design (DDD) trong NestJS"],
          },
        ],
      },
      {
        id: "occ-frontend",
        name: "Frontend Developer",
        vietnameseName: "Lập trình viên Frontend",
        description: "Thiết kế và xây dựng giao diện người dùng trực quan, tối ưu trải nghiệm và hiệu năng ứng dụng web.",
        coreSkills: ["HTML/CSS/JS", "TypeScript", "React / Vue", "Responsive Design", "State Management", "Web Performance"],
        supportingSkills: ["Tailwind CSS", "Accessibility (a11y)", "Vite / Webpack", "Testing (Vitest/Jest)", "SEO Basics"],
        priorityCourses: ["IT205 - Thiết kế Giao diện Người dùng", "IT303 - Lập trình Web Frontend", "IT308 - Tương tác Người - Máy (HCI)"],
        relevantCourses: [
          { code: "IT202", name: "Cấu trúc Dữ liệu & Giải thuật", credits: 3, completed: true, relevanceWeight: 0.8 },
          { code: "IT204", name: "Lập trình Hướng đối tượng", credits: 3, completed: true, relevanceWeight: 0.85 },
          { code: "IT205", name: "Thiết kế Web Cơ bản", credits: 3, completed: false, relevanceWeight: 0.95 },
          { code: "IT303", name: "Phát triển Ứng dụng Web Hiện đại", credits: 3, completed: false, relevanceWeight: 1.0 },
        ],
        recommendedProjects: [
          {
            title: "Trang Dashboard Quản lý Sinh viên",
            description: "Dashboard quản lý kết quả học tập với biểu đồ tương tác, dark/light theme và i18n.",
            difficulty: "intermediate",
            techStack: ["React 19", "TypeScript", "Tailwind CSS", "Recharts"],
          },
        ],
        specializations: [
          {
            id: "spec-react-dev",
            name: "React Developer",
            vietnameseName: "Lập trình viên React & Next.js",
            description: "Chuyên sâu React ecosystem, Next.js App Router, Server Components và tối ưu hóa Core Web Vitals.",
            technologies: ["React 19", "Next.js", "TypeScript", "Tailwind CSS", "Zustand", "TanStack Query"],
            coreSkills: ["React Server Components", "Client State Optimization", "Bundle Size Splitting", "Accessibility"],
            recommendedCourses: ["IT303 - Phát triển Web Hiện đại", "IT205 - UI/UX Web"],
            suggestedProjects: [
              {
                title: "Nền tảng Tuyển dụng IT Hiện đại",
                description: "Single Page App với tìm kiếm lọc nhanh, infinite scroll và cache TanStack Query.",
                difficulty: "intermediate",
                techStack: ["React", "TypeScript", "Tailwind CSS", "TanStack Query"],
              },
            ],
            skillGaps: ["Tối ưu Largest Contentful Paint (LCP) & Interaction to Next Paint (INP)", "Unit Test giao diện với React Testing Library"],
          },
          {
            id: "spec-flutter-mobile",
            name: "Mobile App Developer",
            vietnameseName: "Lập trình viên Ứng dụng Di động",
            description: "Phát triển ứng dụng di động đa nền tảng iOS & Android với Flutter hoặc React Native.",
            technologies: ["Flutter", "Dart", "React Native", "Firebase", "SQLite", "REST APIs"],
            coreSkills: ["Mobile State Management", "Offline-first Sync", "Native Bridge Integration", "App Store Deployment"],
            recommendedCourses: ["IT405 - Phát triển Ứng dụng Di động", "IT204 - OOP"],
            suggestedProjects: [
              {
                title: "Ứng dụng Lịch học & Điểm danh Thông minh",
                description: "App di động nhắc lịch học, xem điểm rèn luyện và điểm số sinh viên.",
                difficulty: "intermediate",
                techStack: ["Flutter", "Dart", "Firebase Cloud Messaging"],
              },
            ],
            skillGaps: ["Xử lý Background Sync & Local Notifications", "Tối ưu hóa bộ nhớ và Frame Rate (60-120fps)"],
          },
        ],
      },
      {
        id: "occ-fullstack",
        name: "Full-stack Developer",
        vietnameseName: "Lập trình viên Full-stack",
        description: "Bao quát toàn bộ quy trình phát triển sản phẩm, từ cơ sở dữ liệu, API máy chủ đến giao diện người dùng và triển khai cloud.",
        coreSkills: ["End-to-end Architecture", "Frontend + Backend", "Database & ORM", "DevOps Basics", "API Security"],
        supportingSkills: ["Docker", "Git Workflow", "Automated Testing", "Cloud Deployment"],
        priorityCourses: ["IT303 - Phát triển Web Frontend", "IT304 - Phát triển Web Backend", "IT402 - Quản lý Dự án Phần mềm"],
        relevantCourses: [
          { code: "IT202", name: "Cấu trúc Dữ liệu & Giải thuật", credits: 3, completed: true, relevanceWeight: 0.9 },
          { code: "IT204", name: "Lập trình Hướng đối tượng", credits: 3, completed: true, relevanceWeight: 0.9 },
          { code: "IT301", name: "Hệ Quản trị Cơ sở Dữ liệu", credits: 4, completed: false, relevanceWeight: 0.95 },
          { code: "IT304", name: "Lập trình Web & Dịch vụ Mạng", credits: 3, completed: false, relevanceWeight: 1.0 },
        ],
        recommendedProjects: [
          {
            title: "Hệ thống Quản lý Đào tạo Trực tuyến (LMS)",
            description: "Nền tảng quản lý khóa học, bài tập, chấm điểm tự động và trao đổi thảo luận.",
            difficulty: "advanced",
            techStack: ["React", "FastAPI / Spring Boot", "PostgreSQL", "Docker"],
          },
        ],
        specializations: [
          {
            id: "spec-mern-stack",
            name: "TypeScript Full-stack Engineer",
            vietnameseName: "Kỹ sư Full-stack TypeScript",
            description: "Phát triển toàn diện với TypeScript từ Frontend (React/Next) đến Backend (Node.js/NestJS).",
            technologies: ["TypeScript", "Next.js", "NestJS", "PostgreSQL", "Prisma", "Docker"],
            coreSkills: ["Shared Type Definitions", "Monorepo Setup", "E2E Testing", "CI/CD Deployment"],
            recommendedCourses: ["IT303 - Web Frontend", "IT304 - Web Backend"],
            suggestedProjects: [
              {
                title: "Nền tảng Quản trị Doanh nghiệp SaaS",
                description: "Multi-tenant SaaS dashboard với phân quyền vai trò phức tạp và thanh toán Stripe.",
                difficulty: "advanced",
                techStack: ["Next.js", "NestJS", "PostgreSQL", "Tailwind CSS"],
              },
            ],
            skillGaps: ["Kiến trúc Monorepo với Turborepo / Nx", "Container hóa và triển khai Docker Swarm / Kubernetes"],
          },
        ],
      },
    ],
  },
  {
    id: "domain-data-ai",
    name: "Data & Artificial Intelligence",
    vietnameseName: "Dữ liệu & Trí tuệ Nhân tạo",
    icon: "BrainCircuit",
    description: "Khai thác dữ liệu lớn, xây dựng mô hình máy học, mạng nơ-ron sâu và hệ thống Generative AI thông minh.",
    occupations: [
      {
        id: "occ-data-analyst",
        name: "Data Analyst",
        vietnameseName: "Chuyên viên Phân tích Dữ liệu",
        description: "Thu thập, làm sạch dữ liệu và tạo bảng điều khiển trực quan để hỗ trợ ra quyết định kinh doanh.",
        coreSkills: ["SQL Nâng cao", "Power BI / Tableau", "Excel Phân tích", "Thống kê Ứng dụng", "Data Storytelling"],
        supportingSkills: ["Python (Pandas, Numpy)", "Data Cleaning", "A/B Testing", "Business Acumen"],
        priorityCourses: ["IT201 - Xác suất Thống kê", "IT301 - Cơ sở Dữ liệu", "IT310 - Khai phá Dữ liệu & BI"],
        relevantCourses: [
          { code: "IT201", name: "Toán Rời rạc & Đại số tuyến tính", credits: 3, completed: true, relevanceWeight: 0.9 },
          { code: "IT301", name: "Hệ Quản trị Cơ sở Dữ liệu", credits: 4, completed: false, relevanceWeight: 1.0 },
          { code: "IT310", name: "Khai phá Dữ liệu", credits: 3, completed: false, relevanceWeight: 0.95 },
        ],
        recommendedProjects: [
          {
            title: "Phân tích Xu hướng Học tập & Điểm số Sinh viên",
            description: "Trực quan hóa tỷ lệ hoàn thành môn học, dự báo sinh viên có nguy cơ cảnh báo học vụ bằng Power BI.",
            difficulty: "intermediate",
            techStack: ["SQL", "Power BI", "Python (Pandas)"],
          },
        ],
        specializations: [
          {
            id: "spec-bi-analyst",
            name: "Business Intelligence Analyst",
            vietnameseName: "Chuyên viên Business Intelligence",
            description: "Chuyên sâu thiết kế Data Mart, Star Schema, DAX metrics và báo cáo điều hành tự động hóa.",
            technologies: ["Power BI", "DAX", "SQL Server", "Tableau", "Excel VBA"],
            coreSkills: ["Data Modeling (Kimball)", "DAX Calculations", "Dashboard UX", "Automated ETL"],
            recommendedCourses: ["IT310 - Khai phá Dữ liệu & BI"],
            suggestedProjects: [
              {
                title: "Enterprise Sales & Customer BI Dashboard",
                description: "Dashboard phân tích doanh thu đa chiều, cohort analysis và customer retention.",
                difficulty: "intermediate",
                techStack: ["Power BI", "DAX", "PostgreSQL"],
              },
            ],
            skillGaps: ["Kỹ thuật tối ưu hóa mô hình dữ liệu lớn trong Power BI", "Viết câu lệnh DAX phức tạp theo ngữ cảnh lọc"],
          },
        ],
      },
      {
        id: "occ-ai-engineer",
        name: "AI Engineer",
        vietnameseName: "Kỹ sư Trí tuệ Nhân tạo",
        description: "Huấn luyện mô hình Machine Learning, Deep Learning, ứng dụng LLM và triển khai hệ thống AI thông minh vào thực tế.",
        coreSkills: ["Python", "Machine Learning", "Deep Learning (PyTorch/TensorFlow)", "LLM & RAG", "Prompt Engineering"],
        supportingSkills: ["MLOps", "Vector Databases", "Docker", "Model Evaluation", "CUDA / GPU Optimization"],
        priorityCourses: ["IT312 - Trí tuệ Nhân tạo", "IT410 - Học máy (Machine Learning)", "IT412 - Thị giác Máy tính / Xử lý Ngôn ngữ Tự nhiên"],
        relevantCourses: [
          { code: "IT201", name: "Đại số Tuyến tính & Giải tích", credits: 3, completed: true, relevanceWeight: 0.95 },
          { code: "IT202", name: "Cấu trúc Dữ liệu & Giải thuật", credits: 3, completed: true, relevanceWeight: 0.9 },
          { code: "IT312", name: "Trí tuệ Nhân tạo Cơ sở", credits: 3, completed: false, relevanceWeight: 1.0 },
          { code: "IT410", name: "Học máy & Học sâu", credits: 4, completed: false, relevanceWeight: 1.0 },
        ],
        recommendedProjects: [
          {
            title: "Trợ lý Ảo Học vụ Đông Đông AI",
            description: "Xây dựng hệ thống RAG kết hợp tra cứu tài liệu học tập trường ĐH Phương Đông với LLM.",
            difficulty: "advanced",
            techStack: ["Python", "FastAPI", "LangChain", "Qdrant", "PyTorch"],
          },
        ],
        specializations: [
          {
            id: "spec-ml-engineer",
            name: "Machine Learning Engineer",
            vietnameseName: "Kỹ sư Machine Learning",
            description: "Chuyên sâu xây dựng đường ống huấn luyện mô hình, kiểm thử SAR/ADMET, phân loại và dự báo chuỗi thời gian.",
            technologies: ["PyTorch", "Scikit-Learn", "XGBoost", "MLflow", "Docker"],
            coreSkills: ["Feature Engineering", "Model Evaluation & Cross-validation", "Hyperparameter Tuning", "Model Serving"],
            recommendedCourses: ["IT410 - Học máy"],
            suggestedProjects: [
              {
                title: "Hệ thống Phân loại Ý định Người dùng Tự động",
                description: "Mô hình phân loại đa nhãn phát hiện ý định câu hỏi sinh viên với độ chính xác > 92%.",
                difficulty: "intermediate",
                techStack: ["PyTorch", "Transformers", "FastAPI"],
              },
            ],
            skillGaps: ["MLOps và giám sát mô hình trôi dạt (Data/Concept Drift)", "Tối ưu hóa mô hình với ONNX Runtime và TensorRT"],
          },
          {
            id: "spec-nlp-engineer",
            name: "NLP / LLM Engineer",
            vietnameseName: "Kỹ sư Xử lý Ngôn ngữ Tự nhiên & LLM",
            description: "Xây dựng hệ thống RAG, fine-tuning mô hình ngôn ngữ lớn tiếng Việt và thiết kế Agentic AI.",
            technologies: ["Hugging Face", "LangChain", "LlamaIndex", "vLLM", "Qdrant / Milvus"],
            coreSkills: ["Retrieval-Augmented Generation (RAG)", "Vector Embeddings", "Context Window Optimization", "Agent Tool Calling"],
            recommendedCourses: ["IT412 - Xử lý Ngôn ngữ Tự nhiên"],
            suggestedProjects: [
              {
                title: "Trợ lý Tra cứu Quy chế Đào tạo ĐH Phương Đông",
                description: "Agent tự động phân rã câu hỏi, tìm kiếm semantic search trong văn bản pháp quy và trích dẫn điều khoản.",
                difficulty: "advanced",
                techStack: ["Python", "LangChain", "OpenAI / Gemini API", "VectorDB"],
              },
            ],
            skillGaps: ["Fine-tuning LoRA/QLoRA cho mô hình tiếng Việt", "Đánh giá chất lượng RAG với framework Ragas"],
          },
        ],
      },
      {
        id: "occ-data-engineer",
        name: "Data Engineer",
        vietnameseName: "Kỹ sư Dữ liệu",
        description: "Xây dựng hạ tầng dữ liệu, đường ống dẫn ETL/ELT quy mô lớn, kho dữ liệu Data Warehouse và Data Lakehouse.",
        coreSkills: ["SQL Nâng cao", "Python / Scala", "Apache Spark", "Airflow / Prefect", "Data Warehouse (BigQuery/Snowflake)"],
        supportingSkills: ["Kafka", "dbt", "Data Modeling", "Cloud Storage", "CI/CD Data Pipelines"],
        priorityCourses: ["IT301 - Cơ sở Dữ liệu", "IT415 - Kiến trúc Dữ liệu Lớn (Big Data)", "IT401 - Hệ thống Phân tán"],
        relevantCourses: [
          { code: "IT202", name: "Cấu trúc Dữ liệu & Giải thuật", credits: 3, completed: true, relevanceWeight: 0.9 },
          { code: "IT301", name: "Hệ Quản trị Cơ sở Dữ liệu", credits: 4, completed: false, relevanceWeight: 1.0 },
          { code: "IT415", name: "Công nghệ Dữ liệu Lớn", credits: 3, completed: false, relevanceWeight: 1.0 },
        ],
        recommendedProjects: [
          {
            title: "Đường ống Dữ liệu Tự động hóa với Apache Spark & Airflow",
            description: "Thu thập, làm sạch và tổng hợp dữ liệu giao dịch hằng ngày, nạp vào Data Warehouse với dbt.",
            difficulty: "advanced",
            techStack: ["PySpark", "Apache Airflow", "PostgreSQL", "dbt", "Docker"],
          },
        ],
        specializations: [
          {
            id: "spec-bigdata-pipeline",
            name: "Data Pipeline & Lakehouse Engineer",
            vietnameseName: "Kỹ sư Pipeline & Lakehouse",
            description: "Chuyên sâu xây dựng kiến trúc Lakehouse với Apache Iceberg, Spark và dbt trên Cloud.",
            technologies: ["Apache Spark", "Apache Airflow", "dbt", "Google BigQuery", "Docker"],
            coreSkills: ["Data Partitioning", "Idempotent Pipeline Design", "Data Quality Testing", "Schema Evolution"],
            recommendedCourses: ["IT415 - Big Data"],
            suggestedProjects: [
              {
                title: "Lakehouse Batch & Stream Processing Engine",
                description: "Pipeline xử lý streaming log sự kiện và lưu trữ vào Iceberg tables với CDC.",
                difficulty: "advanced",
                techStack: ["Kafka", "Spark Streaming", "BigQuery"],
              },
            ],
            skillGaps: ["Tối ưu bộ nhớ Spark Executor và xử lý Data Skew", "Quản trị phân quyền dữ liệu tuân thủ GDPR/ISO 27001"],
          },
        ],
      },
    ],
  },
  {
    id: "domain-business-product",
    name: "Business & Product",
    vietnameseName: "Kinh doanh & Sản phẩm Công nghệ",
    icon: "Briefcase",
    description: "Cầu nối giữa nhu cầu nghiệp vụ của khách hàng và giải pháp công nghệ; quản lý vòng đời sản phẩm số.",
    occupations: [
      {
        id: "occ-ba",
        name: "Business Analyst",
        vietnameseName: "Chuyên viên Phân tích Nghiệp vụ (IT BA)",
        description: "Khảo sát yêu cầu khách hàng, phân tích quy trình nghiệp vụ và xây dựng tài liệu kỹ thuật BRD/SRS.",
        coreSkills: ["Requirement Elicitation", "BPMN Diagram", "Use Case / User Story", "UML Modeling", "SQL Querying"],
        supportingSkills: ["Agile/Scrum", "Wireframing (Figma)", "Jira / Confluence", "Data Analysis"],
        priorityCourses: ["IT302 - Phân tích & Thiết kế Hệ thống", "IT306 - Quản lý Dự án Phần mềm", "IT301 - Cơ sở Dữ liệu"],
        relevantCourses: [
          { code: "IT101", name: "Nhập môn CNTT", credits: 3, completed: true, relevanceWeight: 0.8 },
          { code: "IT204", name: "Lập trình Hướng đối tượng", credits: 3, completed: true, relevanceWeight: 0.85 },
          { code: "IT302", name: "Phân tích & Thiết kế Hệ thống", credits: 4, completed: false, relevanceWeight: 1.0 },
          { code: "IT306", name: "Quy trình & Quản lý Dự án", credits: 3, completed: false, relevanceWeight: 0.95 },
        ],
        recommendedProjects: [
          {
            title: "Bộ Tài liệu BRD/SRS cho Hệ thống Quản lý Ký túc xá",
            description: "Xây dựng sơ đồ quy trình nghiệp vụ BPMN, User Stories, Acceptance Criteria và prototype giao diện.",
            difficulty: "intermediate",
            techStack: ["Figma", "Draw.io", "Jira", "Notion"],
          },
        ],
        specializations: [
          {
            id: "spec-core-ba",
            name: "Digital Product Business Analyst",
            vietnameseName: "Chuyên viên BA Sản phẩm Số",
            description: "Chuyên sâu phân tích nghiệp vụ cho các nền tảng thương mại điện tử, EdTech và ứng dụng Fintech.",
            technologies: ["Jira", "Confluence", "Figma", "Postman", "Draw.io"],
            coreSkills: ["Gap Analysis", "API Specification Review", "User Acceptance Testing (UAT)", "Backlog Grooming"],
            recommendedCourses: ["IT302 - Phân tích & Thiết kế Hệ thống"],
            suggestedProjects: [
              {
                title: "Đặc tả Yêu cầu Kỹ thuật Hệ thống Đăng ký Môn học",
                description: "Phân tích quy trình xử lý cao điểm đăng ký tín chỉ sinh viên và thiết kế biểu đồ trạng thái.",
                difficulty: "intermediate",
                techStack: ["UML", "BPMN", "Jira"],
              },
            ],
            skillGaps: ["Hiểu sâu kiến trúc API và luồng dữ liệu Backend", "Kỹ năng phỏng vấn lấy yêu cầu với các bên liên quan phức tạp"],
          },
        ],
      },
      {
        id: "occ-pm",
        name: "Product Owner / IT Project Manager",
        vietnameseName: "Quản lý Sản phẩm / Quản lý Dự án CNTT",
        description: "Định hình tầm nhìn sản phẩm, quản lý phạm vi, tiến độ, chi phí và điều phối đội ngũ phát triển Agile.",
        coreSkills: ["Product Roadmapping", "Agile/Scrum Framework", "Risk Management", "Stakeholder Communication"],
        supportingSkills: ["Metrics (OKRs/KPIs)", "Budgeting", "Product Analytics", "Team Leadership"],
        priorityCourses: ["IT306 - Quản lý Dự án Phần mềm", "IT302 - Phân tích Hệ thống"],
        relevantCourses: [
          { code: "IT101", name: "Nhập môn CNTT", credits: 3, completed: true, relevanceWeight: 0.8 },
          { code: "IT306", name: "Quản lý Dự án Phần mềm", credits: 3, completed: false, relevanceWeight: 1.0 },
        ],
        recommendedProjects: [
          {
            title: "Kế hoạch Vận hành & Lộ trình Sản phẩm Đông Đông AI",
            description: "Xây dựng Product Backlog, kế hoạch Sprint 1-4 và bảng chỉ số đánh giá thành công (OKRs).",
            difficulty: "intermediate",
            techStack: ["Jira", "Miro", "Google Analytics"],
          },
        ],
        specializations: [
          {
            id: "spec-scrum-master",
            name: "Agile Project Manager / Scrum Master",
            vietnameseName: "Quản lý Dự án Agile / Scrum Master",
            description: "Dẫn dắt các nghi thức Scrum, tháo gỡ khó khăn cho team và tối ưu hóa hiệu suất giao hàng phần mềm.",
            technologies: ["Jira Agile", "Confluence", "Trello", "Mural"],
            coreSkills: ["Sprint Planning", "Burndown Analysis", "Retrospective Facilitation", "Conflict Resolution"],
            recommendedCourses: ["IT306 - Quản lý Dự án Phần mềm"],
            suggestedProjects: [
              {
                title: "Thiết lập Quy trình Scrum cho Dự án Nghiên cứu Khoa học",
                description: "Tổ chức Sprint 2 tuần với tracking tự động qua Jira và GitHub Projects.",
                difficulty: "intermediate",
                techStack: ["Jira", "GitHub"],
              },
            ],
            skillGaps: ["Chứng chỉ quốc tế Professional Scrum Master (PSM I)", "Kỹ năng định giá ngân sách và dự báo rủi ro dự án"],
          },
        ],
      },
    ],
  },
  {
    id: "domain-cybersecurity",
    name: "Cybersecurity",
    vietnameseName: "An toàn Thông tin & An ninh Mạng",
    icon: "ShieldCheck",
    description: "Bảo vệ hệ thống mạng, dữ liệu, phần mềm và cơ sở hạ tầng trước các cuộc tấn công mạng nguy hiểm.",
    occupations: [
      {
        id: "occ-security-engineer",
        name: "Security Engineer",
        vietnameseName: "Kỹ sư An toàn Thông tin",
        description: "Thiết kế kiến trúc bảo mật, rà soát lỗ hổng, cấu hình tường lửa và bảo vệ ứng dụng web.",
        coreSkills: ["Network Security", "Cryptography", "OWASP Top 10", "Vulnerability Assessment", "Linux Security"],
        supportingSkills: ["Python Scripting", "Wireshark", "Burp Suite", "Identity Access Management (IAM)"],
        priorityCourses: ["IT307 - Mạng Máy tính", "IT315 - An toàn & Bảo mật Thông tin", "IT420 - Mật mã học & Ứng dụng"],
        relevantCourses: [
          { code: "IT203", name: "Kiến trúc Máy tính & HĐH", credits: 3, completed: true, relevanceWeight: 0.9 },
          { code: "IT307", name: "Mạng Máy tính & Truyền thông", credits: 4, completed: false, relevanceWeight: 0.95 },
          { code: "IT315", name: "An toàn Cơ sở Dữ liệu & Mạng", credits: 3, completed: false, relevanceWeight: 1.0 },
        ],
        recommendedProjects: [
          {
            title: "Đánh giá An ninh & Khắc phục Lỗ hổng Ứng dụng Web",
            description: "Thực hiện penetration testing ứng dụng mẫu, phát hiện lỗ hổng SQLi, XSS, CSRF và viết tài liệu khắc phục.",
            difficulty: "intermediate",
            techStack: ["Burp Suite", "Kali Linux", "OWASP ZAP", "Python"],
          },
        ],
        specializations: [
          {
            id: "spec-appsec",
            name: "Application Security (AppSec) Specialist",
            vietnameseName: "Chuyên gia Bảo mật Ứng dụng",
            description: "Tích hợp kiểm thử bảo mật tự động (SAST/DAST) vào quy trình CI/CD và rà soát mã nguồn an toàn.",
            technologies: ["SonarQube", "Snyk", "Burp Suite", "Docker Security", "OAuth 2.0 / OIDC"],
            coreSkills: ["Secure Code Review", "DevSecOps Integration", "Threat Modeling", "Authentication Hardening"],
            recommendedCourses: ["IT315 - An toàn Thông tin", "IT304 - Web Backend"],
            suggestedProjects: [
              {
                title: "Pipeline DevSecOps Tự động Quét Lỗ hổng Mã nguồn",
                description: "Cấu hình GitHub Actions tích hợp SonarQube và Snyk tự động chặn PR vi phạm quy tắc bảo mật.",
                difficulty: "intermediate",
                techStack: ["GitHub Actions", "SonarQube", "Docker"],
              },
            ],
            skillGaps: ["Threat Modeling nâng cao theo chuẩn STRIDE", "Chứng chỉ bảo mật CompTIA Security+ / CEH"],
          },
        ],
      },
    ],
  },
  {
    id: "domain-infra-cloud",
    name: "Infrastructure, Cloud & Network",
    vietnameseName: "Hạ tầng, Điện toán Đám mây & Mạng",
    icon: "Cloud",
    description: "Quản trị hệ thống máy chủ, mạng lưới viễn thông và triển khai kiến trúc điện toán đám mây ổn định, mở rộng linh hoạt.",
    occupations: [
      {
        id: "occ-devops",
        name: "DevOps & Cloud Engineer",
        vietnameseName: "Kỹ sư DevOps & Điện toán Đám mây",
        description: "Tự động hóa triển khai phần mềm (CI/CD), quản lý container Kubernetes và hạ tầng dưới dạng mã (IaC).",
        coreSkills: ["Linux / Bash Scripting", "Docker & Kubernetes", "CI/CD Pipelines", "Terraform / Ansible", "Cloud (AWS/GCP)"],
        supportingSkills: ["Prometheus & Grafana", "Networking (DNS, VPN, CDN)", "Security Hardening", "GitOps"],
        priorityCourses: ["IT203 - Hệ điều hành", "IT307 - Mạng Máy tính", "IT425 - Điện toán Đám mây"],
        relevantCourses: [
          { code: "IT203", name: "Hệ điều hành & Hạt nhân Linux", credits: 3, completed: true, relevanceWeight: 0.95 },
          { code: "IT307", name: "Mạng Máy tính", credits: 4, completed: false, relevanceWeight: 0.95 },
          { code: "IT425", name: "Điện toán Đám mây & Ảo hóa", credits: 3, completed: false, relevanceWeight: 1.0 },
        ],
        recommendedProjects: [
          {
            title: "Triển khai Ứng dụng Microservices lên Cụm Kubernetes",
            description: "Cấu hình Helm chart, Ingress Controller, SSL Cert-Manager và giám sát tải với Prometheus/Grafana.",
            difficulty: "advanced",
            techStack: ["Kubernetes (k3s)", "Helm", "Prometheus", "Grafana", "GitHub Actions"],
          },
        ],
        specializations: [
          {
            id: "spec-cloud-architect",
            name: "Cloud Solutions Architect",
            vietnameseName: "Kiến trúc sư Giải pháp Đám mây",
            description: "Thiết kế hệ thống chịu tải cao, High Availability (HA) và phục hồi sau sự cố (Disaster Recovery) trên AWS/GCP.",
            technologies: ["AWS (EC2, S3, RDS, ECS)", "GCP", "Terraform", "Nginx", "PostgreSQL"],
            coreSkills: ["Multi-region Architecture", "Cost Optimization", "Infrastructure as Code", "Auto-scaling"],
            recommendedCourses: ["IT425 - Điện toán Đám mây"],
            suggestedProjects: [
              {
                title: "Kiến trúc Multi-AZ Cloud Infrastructure với Terraform",
                description: "Tự động hóa cấp phát VPC, Private Subnets, NAT Gateways và Application Load Balancer.",
                difficulty: "advanced",
                techStack: ["Terraform", "AWS", "Nginx"],
              },
            ],
            skillGaps: ["Chứng chỉ AWS Certified Solutions Architect Associate", "Chiến lược FinOps tối ưu chi phí hạ tầng Cloud"],
          },
        ],
      },
    ],
  },
  {
    id: "domain-ui-ux",
    name: "UI/UX & Digital Design",
    vietnameseName: "Thiết kế Giao diện & Trải nghiệm Người dùng",
    icon: "Palette",
    description: "Nghiên cứu hành vi người dùng, kiến tạo giao diện sản phẩm số thẩm mỹ, tiện dụng và hiện đại.",
    occupations: [
      {
        id: "occ-product-designer",
        name: "Product & UI/UX Designer",
        vietnameseName: "Nhà thiết kế Sản phẩm & UI/UX",
        description: "Xây dựng Design System, User Journey Map, wireframe tương tác và kiểm thử trải nghiệm người dùng.",
        coreSkills: ["Figma / FigJam", "Design Systems", "User Research", "Wireframing & Prototyping", "Information Architecture"],
        supportingSkills: ["Usability Testing", "HTML/CSS Basics", "Accessibility (WCAG)", "Design Tokens"],
        priorityCourses: ["IT205 - Thiết kế Web & Đồ họa", "IT308 - Tương tác Người - Máy (HCI)"],
        relevantCourses: [
          { code: "IT101", name: "Nhập môn CNTT", credits: 3, completed: true, relevanceWeight: 0.8 },
          { code: "IT205", name: "Thiết kế Đồ họa & Web", credits: 3, completed: false, relevanceWeight: 1.0 },
          { code: "IT308", name: "Tương tác Người - Máy", credits: 3, completed: false, relevanceWeight: 1.0 },
        ],
        recommendedProjects: [
          {
            title: "Thiết kế Toàn diện Ứng dụng Cây Nghề Nghiệp Đông Đông AI",
            description: "Xây dựng Design System màu xanh Đông Đông AI, tương tác radial graph và prototype hoàn chỉnh trên Figma.",
            difficulty: "intermediate",
            techStack: ["Figma", "Auto Layout", "Component Variants", "Design Tokens"],
          },
        ],
        specializations: [
          {
            id: "spec-design-system",
            name: "Design System & UI Specialist",
            vietnameseName: "Chuyên gia Design System & Giao diện",
            description: "Chuyên sâu xây dựng thư viện thành phần tái sử dụng, chuẩn hóa token màu sắc và accessibility.",
            technologies: ["Figma", "Storybook", "Tailwind CSS", "Zeroheight"],
            coreSkills: ["Component Architecture", "Design Token Management", "Micro-interactions", "Responsive Grid"],
            recommendedCourses: ["IT308 - Tương tác Người - Máy"],
            suggestedProjects: [
              {
                title: "Thư viện Thành phần IT UPD Design System",
                description: "Hệ thống hơn 50 components chuẩn chỉnh với dark mode và biến thể trạng thái hoàn chỉnh.",
                difficulty: "intermediate",
                techStack: ["Figma", "Tailwind CSS"],
              },
            ],
            skillGaps: ["Kiểm thử độ tương phản màu sắc và hỗ trợ screen reader", "Chuyển giao thiết kế cho Dev (Design Handoff) hiệu quả"],
          },
        ],
      },
    ],
  },
  {
    id: "domain-qa-testing",
    name: "Software Testing & QA",
    vietnameseName: "Kiểm thử & Đảm bảo Chất lượng Phần mềm",
    icon: "CheckCircle2",
    description: "Đảm bảo chất lượng phần mềm thông qua kiểm thử thủ công, kiểm thử tự động, kiểm thử hiệu năng và bảo mật.",
    occupations: [
      {
        id: "occ-qa-automation",
        name: "Automation QA Engineer",
        vietnameseName: "Kỹ sư Kiểm thử Tự động",
        description: "Lập trình kịch bản kiểm thử tự động cho Web, API và Mobile; tích hợp kiểm thử vào pipeline CI/CD.",
        coreSkills: ["Playwright / Selenium / Cypress", "API Testing (Postman/RestAssured)", "Test Planning & Test Cases", "CI/CD Integration"],
        supportingSkills: ["Performance Testing (JMeter)", "Bug Tracking (Jira)", "Git", "Python / TypeScript"],
        priorityCourses: ["IT309 - Kiểm thử Phần mềm", "IT204 - Lập trình Hướng đối tượng"],
        relevantCourses: [
          { code: "IT202", name: "Cấu trúc Dữ liệu & Giải thuật", credits: 3, completed: true, relevanceWeight: 0.8 },
          { code: "IT204", name: "Lập trình Hướng đối tượng", credits: 3, completed: true, relevanceWeight: 0.85 },
          { code: "IT309", name: "Kiểm chứng & Kiểm thử Phần mềm", credits: 3, completed: false, relevanceWeight: 1.0 },
        ],
        recommendedProjects: [
          {
            title: "Khung Kiểm thử Tự động E2E cho Nền tảng Chat",
            description: "Viết kịch bản kiểm thử tự động quy trình đăng nhập, gửi tin nhắn, đính kèm file và xác thực token với Playwright.",
            difficulty: "intermediate",
            techStack: ["Playwright", "TypeScript", "GitHub Actions"],
          },
        ],
        specializations: [
          {
            id: "spec-e2e-tester",
            name: "Web & API Test Automation Specialist",
            vietnameseName: "Chuyên viên Tự động hóa Test Web & API",
            description: "Xây dựng framework kiểm thử tự động mở rộng theo mô hình Page Object Model (POM).",
            technologies: ["Playwright", "Postman", "Jest / Vitest", "Docker"],
            coreSkills: ["Page Object Model", "Mocking & Stubbing", "Visual Regression Testing", "Load Testing Basics"],
            recommendedCourses: ["IT309 - Kiểm thử Phần mềm"],
            suggestedProjects: [
              {
                title: "Bộ Test Suite Hồi quy Tự động cho Đông Đông AI",
                description: "Kiểm thử tự động giao diện chat, chuyển đổi theme, ngôn ngữ và bộ lọc nghề nghiệp.",
                difficulty: "intermediate",
                techStack: ["Playwright", "TypeScript"],
              },
            ],
            skillGaps: ["Kiểm thử hiệu năng tải đồng thời với k6 / JMeter", "Chứng chỉ kiểm thử quốc tế ISTQB Foundation Level"],
          },
        ],
      },
    ],
  },
  {
    id: "domain-it-consulting",
    name: "IT Operations & Consulting",
    vietnameseName: "Vận hành & Tư vấn Giải pháp CNTT",
    icon: "Headphones",
    description: "Tư vấn chuyển đổi số, triển khai hệ thống ERP/CRM và quản trị dịch vụ công nghệ thông tin cho doanh nghiệp.",
    occupations: [
      {
        id: "occ-it-consultant",
        name: "IT Consultant & System Admin",
        vietnameseName: "Chuyên viên Tư vấn & Quản trị Hệ thống",
        description: "Khảo sát và tư vấn kiến trúc phần mềm, quản trị mạng văn phòng, máy chủ dịch vụ và hỗ trợ kỹ thuật.",
        coreSkills: ["Enterprise Architecture", "ITIL / ITSM", "Windows Server / Linux Admin", "Troubleshooting", "Vendor Management"],
        supportingSkills: ["Cloud Migration", "Database Admin", "Communication", "Cost Benefit Analysis"],
        priorityCourses: ["IT203 - Hệ điều hành", "IT307 - Mạng Máy tính", "IT430 - Hệ thống Thông tin Doanh nghiệp"],
        relevantCourses: [
          { code: "IT101", name: "Nhập môn CNTT", credits: 3, completed: true, relevanceWeight: 0.8 },
          { code: "IT203", name: "Hệ điều hành", credits: 3, completed: true, relevanceWeight: 0.9 },
          { code: "IT430", name: "Hệ thống Thông tin Doanh nghiệp (ERP)", credits: 3, completed: false, relevanceWeight: 1.0 },
        ],
        recommendedProjects: [
          {
            title: "Đề án Chuyển đổi Số cho Trung tâm Đào tạo",
            description: "Xây dựng phương án tích hợp phần mềm quản lý học viên, thanh toán hóa đơn điện tử và lưu trữ đám mây.",
            difficulty: "intermediate",
            techStack: ["ITIL", "ERP Odoo", "Microsoft 365"],
          },
        ],
        specializations: [
          {
            id: "spec-erp-specialist",
            name: "ERP / CRM Solution Specialist",
            vietnameseName: "Chuyên viên Giải pháp ERP & CRM",
            description: "Tùy biến và triển khai hệ thống quản trị nguồn lực doanh nghiệp (Odoo/SAP) theo đặc thù khách hàng.",
            technologies: ["Odoo", "Python", "PostgreSQL", "Salesforce"],
            coreSkills: ["Business Process Mapping", "ERP Module Customization", "User Training", "Data Migration"],
            recommendedCourses: ["IT430 - ERP"],
            suggestedProjects: [
              {
                title: "Triển khai Phân hệ Quản lý Tài sản Nhà trường trên Odoo",
                description: "Cấu hình module kiểm kê thiết bị phòng máy thực hành và luân chuyển tài sản.",
                difficulty: "intermediate",
                techStack: ["Odoo", "Python", "PostgreSQL"],
              },
            ],
            skillGaps: ["Hiểu biết kế toán tài chính doanh nghiệp", "Kỹ năng lập trình module Odoo nâng cao"],
          },
        ],
      },
    ],
  },
  {
    id: "domain-research-education",
    name: "Research & Education",
    vietnameseName: "Nghiên cứu Khoa học & Giáo dục CNTT",
    icon: "GraduationCap",
    description: "Nghiên cứu các thuật toán tiên tiến, công bố bài báo khoa học và đào tạo thế hệ kỹ sư công nghệ tương lai.",
    occupations: [
      {
        id: "occ-ai-researcher",
        name: "AI & CS Researcher / Lecturer",
        vietnameseName: "Nhà nghiên cứu / Giảng viên CNTT",
        description: "Thực hiện các đề tài nghiên cứu khoa học, thử nghiệm mô hình trí tuệ nhân tạo và giảng dạy chuyên ngành.",
        coreSkills: ["Scientific Writing (LaTeX)", "Algorithm Design", "Mathematical Modeling", "Deep Learning Research", "Experimentation"],
        supportingSkills: ["Teaching", "Public Speaking", "Data Analysis", "Python / PyTorch"],
        priorityCourses: ["IT201 - Toán Rời rạc", "IT202 - Cấu trúc Dữ liệu & Giải thuật", "IT450 - Phương pháp Nghiên cứu Khoa học"],
        relevantCourses: [
          { code: "IT201", name: "Toán Rời rạc & Đại số tuyến tính", credits: 3, completed: true, relevanceWeight: 1.0 },
          { code: "IT202", name: "Cấu trúc Dữ liệu & Giải thuật", credits: 3, completed: true, relevanceWeight: 1.0 },
          { code: "IT450", name: "Phương pháp Nghiên cứu Khoa học CNTT", credits: 2, completed: false, relevanceWeight: 1.0 },
        ],
        recommendedProjects: [
          {
            title: "Bài báo Nghiên cứu Ứng dụng Mô hình Học sâu trong Giáo dục",
            description: "Thử nghiệm mô hình đánh giá năng lực học tập sinh viên dựa trên đồ thị tri thức và viết bài báo khoa học.",
            difficulty: "advanced",
            techStack: ["LaTeX", "PyTorch", "Python", "Overleaf"],
          },
        ],
        specializations: [
          {
            id: "spec-academic-researcher",
            name: "Computational Science Researcher",
            vietnameseName: "Nghiên cứu viên Khoa học Máy tính",
            description: "Chuyên sâu công bố bài báo khoa học trên các tạp chí và hội thảo chuyên ngành (Scopus/ISI).",
            technologies: ["PyTorch", "LaTeX", "Google Colab", "Zotero"],
            coreSkills: ["Literature Review", "Statistical Validation", "Benchmarking", "Peer Review"],
            recommendedCourses: ["IT450 - NCKH CNTT"],
            suggestedProjects: [
              {
                title: "Đề tài NCKH Sinh viên Cấp Trường: Trợ lý AI Hỗ trợ Đào tạo",
                description: "Nghiên cứu kiến trúc RAG tiếng Việt tối ưu cho dữ liệu văn bản quy chế đại học.",
                difficulty: "advanced",
                techStack: ["PyTorch", "LaTeX", "FastAPI"],
              },
            ],
            skillGaps: ["Kỹ năng viết tiếng Anh học thuật cho hội nghị quốc tế", "Kỹ thuật tối ưu hóa thuật toán song song trên siêu máy tính"],
          },
        ],
      },
    ],
  },
];
