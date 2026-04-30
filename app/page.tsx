"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BookOpen, CheckCircle, Code, TrendingUp } from "lucide-react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/learn");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return null;
  }

  return (
    <div className="landing-page">
      <div className="landing-content">
        <div className="landing-hero">
          <h1 className="landing-logo">
            Drupal <span className="landing-slash">//</span> <span className="landing-learn">Learn</span>
          </h1>
          <p className="landing-tagline">
            Master Drupal development through structured, hands-on learning.
          </p>
          <p className="landing-description">
            A comprehensive curriculum designed to take you from beginner to advanced Drupal developer, 
            with guided lessons, quizzes, and practical exercises.
          </p>
        </div>

        <div className="landing-cta">
          <Link href="/register" className="landing-btn landing-btn-primary">
            Get Started
          </Link>
          <Link href="/login" className="landing-btn landing-btn-secondary">
            Sign In
          </Link>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon"><BookOpen size={48} /></div>
            <h3>Structured Curriculum</h3>
            <p>6 phases covering PHP basics to advanced Drupal development</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><CheckCircle size={48} /></div>
            <h3>Interactive Quizzes</h3>
            <p>Test your knowledge with built-in assessments</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Code size={48} /></div>
            <h3>Hands-On Practice</h3>
            <p>Real-world exercises and projects to build your skills</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><TrendingUp size={48} /></div>
            <h3>Track Progress</h3>
            <p>Monitor your learning journey and completed milestones</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--bg1) 0%, var(--bg2) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .landing-content {
          max-width: 1200px;
          width: 100%;
        }

        .landing-hero {
          text-align: center;
          margin-bottom: 3rem;
        }

        .landing-logo {
          font-size: 4rem;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 1rem 0;
          font-family: 'IBM Plex Mono', monospace;
        }

        .landing-slash {
          color: var(--accent);
          opacity: 0.6;
        }

        .landing-learn {
          color: var(--accent);
        }

        .landing-tagline {
          font-size: 1.5rem;
          color: var(--text);
          margin: 0 0 1rem 0;
          font-weight: 500;
        }

        .landing-description {
          font-size: 1.125rem;
          color: var(--text2);
          max-width: 700px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .landing-cta {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 4rem;
        }

        .landing-btn {
          padding: 1rem 2rem;
          font-size: 1.125rem;
          font-weight: 600;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.15s ease;
          display: inline-block;
        }

        .landing-btn-primary {
          background: var(--accent);
          color: var(--bg1);
        }

        .landing-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124, 108, 245, 0.4);
        }

        .landing-btn-secondary {
          background: transparent;
          color: var(--text);
          border: 2px solid var(--border);
        }

        .landing-btn-secondary:hover {
          border-color: var(--accent);
          background: var(--bg2);
        }

        .landing-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          transition: all 0.2s ease;
        }

        .feature-card:hover {
          border-color: var(--accent);
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .feature-icon {
          color: var(--accent);
          margin-bottom: 1rem;
          display: flex;
          justify-content: center;
        }

        .feature-card h3 {
          font-size: 1.25rem;
          color: var(--text);
          margin: 0 0 0.5rem 0;
          font-weight: 600;
        }

        .feature-card p {
          color: var(--text2);
          margin: 0;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .landing-logo {
            font-size: 2.5rem;
          }

          .landing-tagline {
            font-size: 1.25rem;
          }

          .landing-description {
            font-size: 1rem;
          }

          .landing-cta {
            flex-direction: column;
            align-items: center;
          }

          .landing-btn {
            width: 100%;
            max-width: 300px;
          }
        }
      `}</style>
    </div>
  );
}
