import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useHeroScroll } from "./useHeroScroll";
import "./HeroIntro.css";

const TITLE = "IT UPD GenAI";

export function HeroIntro() {
  const sectionRef = useHeroScroll();

  return (
    <section ref={sectionRef} className="hero-intro" aria-label="Giới thiệu IT UPD GenAI">
      <div className="hero-intro__stage">
        <div className="hero-intro__copy">
          <p className="hero-intro__eyebrow mono">
            University Artificial Intelligence
            <br />
            Barcode : UAI–01
          </p>

          <h1 className="hero-intro__title" aria-label={TITLE}>
            {Array.from(TITLE).map((letter, index) => (
              <span key={index} data-title-letter aria-hidden="true">{letter}</span>
            ))}
          </h1>

          <div className="hero-intro__reveal hero-intro__subtitle" data-start="0.16" data-end="0.49">
            <h2>Đạt những thành tựu học tập với sự trợ giúp của trí tuệ nhân tạo.</h2>
          </div>

          <div className="hero-intro__reveal hero-intro__description" data-start="0.35" data-end="0.74">
            <p>
              IT UPD GenAI là một nền tảng trí tuệ nhân tạo được thiết kế để hỗ trợ
              sinh viên và giảng viên trong việc tìm kiếm thông tin, giải đáp thắc
              mắc và nâng cao trải nghiệm học tập tại Đại học Phương Đông.
            </p>
          </div>

          <div className="hero-intro__reveal hero-intro__actions-mask" data-start="0.58" data-end="0.92">
            <div className="hero-intro__actions">
              <Link to="/login" className="hero-intro__primary">
                Thử Ngay <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/approve" className="hero-intro__secondary">
                Xin cấp phép ngoài
              </Link>
            </div>
          </div>
        </div>

        <div className="hero-intro__art" aria-hidden="true">
          <canvas className="hero-intro__canvas" />
        </div>

        <p className="hero-intro__scroll-hint mono" aria-hidden="true">
          <ArrowDown size={16} /> Cuộn để khám phá
        </p>
      </div>
    </section>
  );
}
