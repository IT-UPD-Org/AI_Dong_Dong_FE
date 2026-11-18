export interface ProjectMember {
  id: string;
  number: string;
  name: string;
  role: string;
  contribution: string;
  photoSrc?: string;
}

// Ảnh đặt trong public/ được phục vụ từ gốc "/": ghi "/assets/...", KHÔNG ghi "/public/...".
// Để trống photoSrc sẽ giữ ô ảnh mẫu.
export const managerMember: ProjectMember = {
  id: "Project Manager",
  number: "01",
  name: "Thầy Nguyễn Mạnh Dũng",
  photoSrc: "/assets/images/Binhngu.png",
  role: "Project Manager",
  contribution:
    "Quản lý dự án, điều phối các thành viên và đảm bảo tiến độ. Đảm bảo chất lượng sản phẩm và sự hợp tác hiệu quả giữa các thành viên.",
};

export const backendMembers: ProjectMember[] = [
  {
    id: "backend-1",
    number: "01",
    name: "Sinh viên Nguyễn Dương Tuấn",
    photoSrc: "/assets/images/dev-avt/BE1dev.jpg",
    role: "Backend Developer",
    contribution: "Phát triển Backend.",
  },
  {
    id: "backend-2",
    number: "02",
    name: "Sinh viên Vương Đình Bình",
    photoSrc: "/assets/images/dev-avt/BE2dev.jpg",
    role: "Backend Developer",
    contribution: "Phát triển Backend.",
  },
  {
    id: "backend-3",
    number: "03",
    name: "Sinh viên Phan Thị Khánh Linh",
    photoSrc: "/assets/images/dev-avt/BE3dev.jpg",
    role: "Backend Developer",
    contribution: "Phát triển Backend.",
  },
];

export const frontendMembers: ProjectMember[] = [
  {
    id: "frontend-1",
    number: "04",
    name: "Sinh viên Chu Quốc Huy",
    photoSrc: "/assets/images/dev-avt/FE1dev.jpg",
    role: "Frontend Developer",
    contribution: "Phát triển giao diện người dùng.",
  },
];

export const databaseMembers: ProjectMember[] = [
  {
    id: "database-1",
    number: "05",
    name: "Sinh viên Phạm Thị Thu Trang",
    photoSrc: "/assets/images/dev-avt/DB1dev.jpg",
    role: "Database Developer",
    contribution: "Phụ trách cơ sở dữ liệu của dự án.",
  },
  {
    id: "database-2",
    number: "06",
    name: "Sinh viên ",
    photoSrc: "/assets/images/dev-avt/DB2dev.jpg",
    role: "Database Developer",
    contribution: "Phụ trách cơ sở dữ liệu của dự án.",
  },
  {
    id: "database-3",
    number: "07",
    name: "Thành viên Database 03",
    photoSrc: "",
    role: "Database Developer",
    contribution: "Phụ trách cơ sở dữ liệu của dự án.",
  },
];

export const projectClub: { photoSrc?: string } = {
  photoSrc: "/assets/images/dev-avt/all.jpg",
};

export const projectMemberCount = [
  managerMember,
  ...backendMembers,
  ...frontendMembers,
  ...databaseMembers,
].length;
