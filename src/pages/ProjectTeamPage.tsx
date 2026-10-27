import { ArrowUpRight, Image as ImageIcon, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import {
  backendMembers,
  databaseMembers,
  frontendMembers,
  managerMember,
  projectClub,
  projectMemberCount,
  type ProjectMember,
} from "../data/projectTeam";
import "./ProjectTeamPage.css";

type MemberGroup = "frontend" | "backend" | "database";

/** Mỗi nhóm dev luôn hiển thị ít nhất 3 ô; ô thiếu là skeleton trống. */
const GROUP_SLOTS = 3;

const VIETNAMESE_COUNTS = [
  "Không",
  "Một",
  "Hai",
  "Ba",
  "Bốn",
  "Năm",
  "Sáu",
  "Bảy",
  "Tám",
  "Chín",
  "Mười",
];

function padCount(count: number) {
  return String(count).padStart(2, "0");
}

function MemberCard({
  member,
  group,
}: {
  member: ProjectMember;
  group: MemberGroup;
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
        <span className="project-team__photo-tag">{group.toUpperCase()}</span>
      </div>
      <div className="project-team__caption">
        <h3>{member.name}</h3>
        <span>{member.role}</span>
      </div>
      <p className="project-team__bio">{member.contribution}</p>
    </article>
  );
}

/** Ô trống giữ chỗ để nhóm ít người vẫn đủ 3 cột bậc thang. */
function SkeletonCard() {
  return (
    <div
      className="project-team__member project-team__skeleton"
      aria-hidden="true"
    >
      <div className="project-team__portrait" />
      <div className="project-team__caption">
        <span className="project-team__skeleton-line project-team__skeleton-line--title" />
        <span className="project-team__skeleton-line project-team__skeleton-line--role" />
      </div>
      <span className="project-team__skeleton-line project-team__skeleton-line--bio" />
    </div>
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

function TeamGroup({
  id,
  index,
  title,
  description,
  group,
  members,
}: {
  id: string;
  index: string;
  title: string;
  description: string;
  group: MemberGroup;
  members: ProjectMember[];
}) {
  const emptySlots = Math.max(0, GROUP_SLOTS - members.length);
  return (
    <section
      className={`project-team__group project-team__group--${group}`}
      aria-labelledby={id}
    >
      <GroupHeading
        id={id}
        index={index}
        title={title}
        count={members.length}
      />
      <p className="project-team__group-description">{description}</p>
      <div className="project-team__trio">
        {members.map((member) => (
          <MemberCard key={member.id} member={member} group={group} />
        ))}
        {Array.from({ length: emptySlots }, (_, slot) => (
          <SkeletonCard key={`empty-${slot}`} />
        ))}
      </div>
    </section>
  );
}

export function ProjectTeamPage() {
  const memberCountWord =
    VIETNAMESE_COUNTS[projectMemberCount] ?? String(projectMemberCount);

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
              {memberCountWord} mảnh ghép
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
            <li>01 Project Manager</li>
            <li>{padCount(backendMembers.length)} Backend Developer</li>
            <li>{padCount(frontendMembers.length)} Frontend Developer</li>
            <li>{padCount(databaseMembers.length)} Database Developer</li>
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
              title="Project Manager"
            />
            <MemberCard member={managerMember} group="frontend" />
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

        {/* Mỗi nhóm: 3 ô thụt dần xuống, nhóm thiếu người được bù skeleton. */}
        <div className="project-team__groups">
          <TeamGroup
            id="project-team-backend"
            index="02"
            title="Backend Developer"
            description="Xây dựng phần xử lý phía sau mỗi tương tác."
            group="backend"
            members={backendMembers}
          />
          <TeamGroup
            id="project-team-frontend-dev"
            index="03"
            title="Frontend Developer"
            description="Thiết kế giao diện người dùng."
            group="frontend"
            members={frontendMembers}
          />
          <TeamGroup
            id="project-team-database"
            index="04"
            title="Database Developer"
            description="Thiết kế và vận hành nơi lưu trữ tri thức."
            group="database"
            members={databaseMembers}
          />
        </div>
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
