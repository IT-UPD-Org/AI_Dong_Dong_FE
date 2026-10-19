import { ArrowUpRight, Image as ImageIcon, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import {
  backendMembers,
  databaseMember,
  dataMembers,
  frontendMember,
  projectClub,
  projectMemberCount,
  type ProjectMember,
} from "../data/projectTeam";
import "./ProjectTeamPage.css";

function MemberCard({
  member,
  group,
}: {
  member: ProjectMember;
  group: "frontend" | "backend" | "database" | "data";
}) {
  return (
    <article
      className={`project-team__member project-team__member--${group}`}
      data-member={member.id}
    >
      <div className="project-team__portrait">
        {member.photoSrc ? (
          <img
            src={member.photoSrc}
            alt={`Chân dung ${member.name}`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="project-team__placeholder"
            role="img"
            aria-label={`Vị trí ảnh chân dung: ${member.name}`}
          >
            <UserRound size={28} strokeWidth={1.2} aria-hidden="true" />
            <span>Ảnh chân dung</span>
          </div>
        )}
        <span className="project-team__photo-number" aria-hidden="true">
          {member.number}
        </span>
        <span className="project-team__photo-tag">
          {group === "data" ? "DỮ LIỆU" : group.toUpperCase()}
        </span>
      </div>
      <div className="project-team__caption">
        <h3>{member.name}</h3>
        <span>{member.role}</span>
      </div>
      <p className="project-team__bio">{member.contribution}</p>
    </article>
  );
}

function GroupHeading({
  id,
  index,
  title,
  count,
}: {
  id: string;
  index: string;
  title: string;
  count?: number;
}) {
  return (
    <div className="project-team__group-heading">
      <span className="project-team__index" aria-hidden="true">
        {index} /
      </span>
      <h2 id={id}>{title}</h2>
      {count !== undefined && (
        <span className="project-team__count">{count} thành viên</span>
      )}
    </div>
  );
}

export function ProjectTeamPage() {
  return (
    <div className="project-team">
      <nav className="project-team__mobile-nav" aria-label="Điều hướng trang">
        <Link to="/">Trang chủ</Link>
        <Link to="/donate" aria-current="page">
          Đóng góp
        </Link>
        <Link to="/approve">Cấp phép ngoài trường</Link>
      </nav>
      <main className="project-team__main">
        <section
          className="project-team__intro"
          aria-labelledby="project-team-title"
        >
          <p className="project-team__eyebrow">ĐỘI NGŨ / IT UPD GenAI</p>
          <div className="project-team__intro-row">
            <h1 id="project-team-title">
              Bảy mảnh ghép
              <br />
              <span>Một tầm nhìn.</span>
            </h1>
            <p>
              Một nền tảng học tập, được tạo nên từ những công việc khác nhau và
              một mục tiêu chung: đưa tri thức đến gần hơn.
            </p>
          </div>
          <ul
            className="project-team__roles"
            aria-label={`Vai trò của ${projectMemberCount} thành viên`}
          >
            <li>01 Frontend</li>
            <li>{String(backendMembers.length).padStart(2, "0")} Backend</li>
            <li>01 Database</li>
            <li>
              {String(dataMembers.length).padStart(2, "0")} Thu thập dữ liệu
            </li>
          </ul>
        </section>

        <div className="project-team__story">
          <section
            className="project-team__frontend"
            aria-labelledby="project-team-frontend"
          >
            <GroupHeading
              id="project-team-frontend"
              index="01"
              title="Frontend"
            />
            <MemberCard member={frontendMember} group="frontend" />
          </section>
          <section
            className="project-team__club"
            aria-labelledby="project-team-club"
          >
            <div className="project-team__club-photo">
              {projectClub.photoSrc ? (
                <img
                  src={projectClub.photoSrc}
                  alt="Tập thể câu lạc bộ IT UPD"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <>
                  <span className="project-team__club-mark" aria-hidden="true">
                    IT UPD
                  </span>
                  <div
                    className="project-team__placeholder"
                    role="img"
                    aria-label="Vị trí ảnh tập thể câu lạc bộ"
                  >
                    <ImageIcon size={28} strokeWidth={1.2} aria-hidden="true" />
                    <span>Ảnh tập thể câu lạc bộ</span>
                  </div>
                  <span className="project-team__club-label">
                    CÂU CHUYỆN CỦA CHÚNG TÔI
                  </span>
                </>
              )}
            </div>
            <div className="project-team__club-caption">
              <p className="project-team__eyebrow">CÙNG NHAU XÂY DỰNG</p>
              <h2 id="project-team-club">
                Từ ý tưởng chung,
                <br />
                đến từng phần việc.
              </h2>
              <p>
                Giao diện, hệ thống, cơ sở dữ liệu và nguồn tri thức — mỗi phần
                việc kết nối với nhau để tạo nên IT UPD GenAI.
              </p>
            </div>
          </section>
        </div>

        <div className="project-team__engineering">
          <section
            className="project-team__backend"
            aria-labelledby="project-team-backend"
          >
            <GroupHeading
              id="project-team-backend"
              index="02"
              title="Backend"
              count={backendMembers.length}
            />
            <p className="project-team__group-description">
              Xây dựng phần xử lý phía sau mỗi tương tác.
            </p>
            <div className="project-team__pair">
              {backendMembers.map((member) => (
                <MemberCard key={member.id} member={member} group="backend" />
              ))}
            </div>
          </section>
          <section
            className="project-team__database"
            aria-labelledby="project-team-database"
          >
            <GroupHeading
              id="project-team-database"
              index="03"
              title="Database"
            />
            <MemberCard member={databaseMember} group="database" />
          </section>
        </div>

        <section
          className="project-team__data"
          aria-labelledby="project-team-data"
        >
          <div className="project-team__data-intro">
            <GroupHeading
              id="project-team-data"
              index="04"
              title="Thu thập dữ liệu"
            />
            <p>
              Tri thức bắt đầu
              <br />
              từ những nguồn dữ liệu.
            </p>
            <span className="project-team__count">
              {dataMembers.length} thành viên
            </span>
          </div>
          <div className="project-team__trio">
            {dataMembers.map((member) => (
              <MemberCard key={member.id} member={member} group="data" />
            ))}
          </div>
        </section>
      </main>

      <footer className="project-team__footer">
        <div>
          <Link to="/" className="project-team__brand">
            IT UPD GenAI
          </Link>
          <p>Đại học Phương Đông</p>
        </div>
        <nav aria-label="Điều hướng cuối trang">
          <Link to="/">Trang chủ</Link>
          <Link to="/chat">
            Phòng chat <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/approve">Cấp phép ngoài trường</Link>
        </nav>
      </footer>
    </div>
  );
}
