export interface ProjectMember {
  id: string;
  number: string;
  name: string;
  role: string;
  contribution: string;
  photoSrc?: string;
}

// Điền link ảnh trực tiếp vào photoSrc, ví dụ: "https://example.com/anh.jpg".
// Hoặc đặt ảnh trong public/assets/team rồi dùng: "/assets/team/anh.jpg".
// Để trống photoSrc sẽ giữ ô ảnh mẫu.
export const frontendMember: ProjectMember = {
  id: "frontend",
  number: "01",
  name: "Thành viên Frontend",
  photoSrc: "/public/assets/images/Binhngu.png",
  role: "Frontend developer",
  contribution:
    "Mang ý tưởng lên màn hình, chăm chút giao diện và trải nghiệm sử dụng.",
};

export const backendMembers: ProjectMember[] = [
  {
    id: "backend-1",
    number: "02",
    name: "Thành viên Backend 01",
    photoSrc: "/public/assets/images/anh2.png",
    role: "Backend developer",
    contribution: "Phát triển Backend.",
  },
  {
    id: "backend-2",
    number: "03",
    name: "Thành viên Backend 02",
    photoSrc: "",
    role: "Backend developer",
    contribution: "Phát triển Backend.",
  },
];

export const databaseMember: ProjectMember = {
  id: "database",
  number: "04",
  name: "Thành viên Database",
  photoSrc: "",
  role: "Database",
  contribution: "Phụ trách cơ sở dữ liệu của dự án.",
};

export const dataMembers: ProjectMember[] = [
  {
    id: "data-1",
    number: "05",
    name: "Thành viên dữ liệu 01",
    photoSrc: "",
    role: "Thu thập dữ liệu",
    contribution: "Thu thập dữ liệu.",
  },
  {
    id: "data-2",
    number: "06",
    name: "Thành viên dữ liệu 02",
    photoSrc: "",
    role: "Thu thập dữ liệu",
    contribution: "Thu thập dữ liệu.",
  },
  {
    id: "data-3",
    number: "07",
    name: "Thành viên dữ liệu 03",
    photoSrc: "",
    role: "Thu thập dữ liệu",
    contribution: "Thu thập dữ liệu.",
  },
];

export const projectClub: { photoSrc?: string } = {
  photoSrc: "",
};

export const projectMemberCount = [
  frontendMember,
  ...backendMembers,
  databaseMember,
  ...dataMembers,
].length;
