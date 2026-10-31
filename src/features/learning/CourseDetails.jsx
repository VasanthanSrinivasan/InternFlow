import "./CourseDetails.css";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import {
  BookOpen,
  CheckCircle2,
  Play,
  ChevronDown,
  ChevronRight,
  Video,
  Clock3,
  ArrowLeft,
  Lock,
  Hourglass,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";

import api, { getErrorMessage } from "../../api/client";
import useAuth from "../../context/useAuth";
import PageState from "../../components/common/PageState";

export default function CourseDetails() {
  const { courseId } = useParams();

  const { user, isStaff } = useAuth();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null); // my enrollment for this course (students)
  const [requesting, setRequesting] = useState(false);
  const [progressRecord, setProgressRecord] = useState(null); // { id, userId, courseId, lessonIds }
  const [lessons, setLessons] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // READ -> the course + this user's progress for it
  useEffect(() => {
    let ignore = false;

    const fetchCourse = async () => {
      try {
        const [courseRes, progressRes, enrollmentRes] = await Promise.all([
          api.get("/courses", { params: { id: courseId } }),
          api.get("/progress", { params: { userId: user.id, courseId } }),
          // trainers and admins can always open a course; students need an approved enrollment
          isStaff
            ? Promise.resolve({ data: [{ status: "Approved" }] })
            : api.get("/enrollments", { params: { userId: user.id, courseId } }),
        ]);

        if (ignore) return;

        const found = courseRes.data[0] ?? null;
        const allLessons = found?.modules?.flatMap((module) => module.lessons ?? []) ?? [];

        setCourse(found);
        setLessons(allLessons);
        setActiveId(allLessons[0]?.id ?? "");
        setExpanded({});
        setProgressRecord(progressRes.data[0] ?? null);
        setEnrollment(enrollmentRes.data[0] ?? null);
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchCourse();
    return () => {
      ignore = true;
    };
  }, [courseId, user.id, isStaff]);

  // Student asks for access (status Pending until a trainer / admin approves)
  async function requestAccess() {
    setRequesting(true);

    try {
      const body = {
        status: "Pending",
        requestedAt: new Date().toISOString(),
        reviewedBy: null,
        reviewedAt: null,
      };
      const response = enrollment
        ? await api.patch(`/enrollments/${enrollment.id}`, body)
        : await api.post("/enrollments", { ...body, userId: user.id, courseId: course.id });

      setEnrollment(response.data);
      toast.success("Enrollment requested. A trainer or admin will approve it.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRequesting(false);
    }
  }

  if (loading || error) {
    return <PageState loading={loading} error={error} />;
  }

  if (!course) {
    return (
      <section className="panel learning-not-found">
        <h2>Course not found</h2>
        <p>
          The requested course does not exist or may have been removed.
        </p>
        <Link to="/learning/courses" className="primary-button">
          <ArrowLeft size={16} />
          Back to Courses
        </Link>
      </section>
    );
  }

  // Not approved yet -> students cannot open the lessons
  if (!isStaff && enrollment?.status !== "Approved") {
    const pending = enrollment?.status === "Pending";
    const rejected = enrollment?.status === "Rejected";

    return (
      <section className="panel locked-course">
        <div className="locked-icon">{pending ? <Hourglass size={34} /> : <Lock size={34} />}</div>
        <h2>{course.title}</h2>
        <p>
          {pending
            ? "Your enrollment request is waiting for approval. You will see this course in My Learning as soon as a trainer or admin approves it."
            : rejected
            ? "Your last request was not approved. You can ask again."
            : "Enroll in this course to unlock its recorded classes, tasks and tests."}
        </p>
        <div className="locked-actions">
          {!pending && (
            <button className="primary-button" onClick={requestAccess} disabled={requesting}>
              <Send size={16} /> {requesting ? "Requesting..." : rejected ? "Request again" : "Request enrollment"}
            </button>
          )}
          <Link to="/learning/courses" className="secondary-button"><ArrowLeft size={16} /> Back to courses</Link>
        </div>
      </section>
    );
  }

  const completed = progressRecord?.lessonIds ?? [];

  const active = lessons.find(
    (lesson) => String(lesson.id) === String(activeId)
  );

  const percent = lessons.length
    ? Math.round((completed.length / lessons.length) * 100)
    : 0;

  // CREATE the progress row the first time, UPDATE (PATCH) afterwards
  async function markComplete() {
    if (!active || completed.includes(active.id)) {
      return;
    }

    const lessonIds = [...completed, active.id];

    try {
      const response = progressRecord
        ? await api.patch(`/progress/${progressRecord.id}`, { lessonIds })
        : await api.post("/progress", { userId: user.id, courseId: course.id, lessonIds });

      setProgressRecord(response.data);
      toast.success("Lesson completed successfully!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function toggleModule(moduleId) {
    setExpanded((previous) => ({
      ...previous,
      [moduleId]: !(previous[moduleId] ?? true),
    }));
  }

  function selectLesson(lessonId) {
    setActiveId(lessonId);
  }

  return (
    <div className="lesson-page">
      {/* Breadcrumb */}
      <nav className="lesson-breadcrumb" aria-label="Breadcrumb">
        <Link to="/learning/courses">
          <ArrowLeft size={15} />
          All Courses
        </Link>

        <span>/</span>

        <span>{course.title}</span>
      </nav>

      {/* Course Header */}
      <header className="lesson-course-header">
        <div className="lesson-course-intro">
          <span className="eyebrow">
            {(course.category || "General").toUpperCase()}
          </span>

          <h1>{course.title}</h1>

          <p>
            {course.description || "Explore the lessons in this course."}
          </p>

          <div className="lesson-header-meta">
            <span>
              <BookOpen size={15} />
              {lessons.length} lessons
            </span>

            <span>
              <Clock3 size={15} />
              {course.duration || "Self-paced"}
            </span>

            {course.instructor && (
              <span>Instructor: {course.instructor}</span>
            )}
          </div>
        </div>

        <div className="course-completion-card">
          <span>{isStaff ? "Preview mode" : "Your progress"}</span>

          <strong>{isStaff ? `${lessons.length}` : `${percent}%`}</strong>

          <div
            className="progress-track"
            role="progressbar"
            aria-label="Course completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div style={{ width: `${percent}%` }} />
          </div>

          <small>
            {isStaff ? "lessons in this course" : `${completed.length} of ${lessons.length} completed`}
          </small>
        </div>
      </header>

      {/* Main Learning Layout */}
      <div className="lesson-layout">
        <main className="lesson-main">
          {/* Video Player */}
          <section className="video-frame">
            {active?.videoUrl ? (
              <ReactPlayer
                key={active.id}
                src={active.videoUrl}
                controls
                width="100%"
                height="100%"
                style={{ aspectRatio: "16 / 9" }}
                onError={() => {
                  toast.error(
                    "Video unavailable. Check the video URL."
                  );
                }}
              />
            ) : (
              <div className="video-placeholder">
                <Video size={44} />

                <h3>
                  {active ? "Video not available" : "Select a lesson"}
                </h3>

                <p>
                  {active
                    ? "Add a valid video URL to this lesson in Course Studio."
                    : "Choose a lesson from the course curriculum."}
                </p>
              </div>
            )}
          </section>

          {/* Active Lesson */}
          <section className="active-lesson-details">
            <div>
              <span className="eyebrow">NOW LEARNING</span>

              <h2>{active?.title || "No lesson selected"}</h2>

              <p>
                {course.instructor || "Course Instructor"}
                {active?.duration ? ` · ${active.duration}` : ""}
              </p>
            </div>

            {isStaff ? (
              <Link to={`/learning/studio?lessons=${course.id}`} className="primary-button">
                <Video size={17} /> Add / edit videos
              </Link>
            ) : (
              <button
                type="button"
                className="primary-button"
                onClick={markComplete}
                disabled={!active || completed.includes(active.id)}
              >
                <CheckCircle2 size={17} />

                {active && completed.includes(active.id)
                  ? "Completed"
                  : "Mark Complete"}
              </button>
            )}
          </section>

          {/* Course Information */}
          <section className="lesson-info-panel">
            <h3>About this course</h3>

            <p>
              {course.description ||
                "Learn new skills through structured lessons and practical examples."}
            </p>

            <h4>Skills you will learn</h4>

            <div className="skill-chips">
              {(course.skills ?? []).map((skill) => (
                <span key={skill}>{skill}</span>
              ))}

              {(!course.skills || course.skills.length === 0) && (
                <span>Skills will be added soon</span>
              )}
            </div>
          </section>
        </main>

        {/* Course Curriculum */}
        <aside className="curriculum-panel">
          <div className="curriculum-header">
            <div>
              <h2>Course Content</h2>

              <p>
                {completed.length}/{lessons.length} lessons complete
              </p>
            </div>

            <BookOpen size={21} />
          </div>

          {course.modules?.length > 0 ? (
            course.modules.map((module, index) => {
              const isExpanded = expanded[module.id] ?? true;

              return (
                <section
                  className="curriculum-module"
                  key={module.id ?? index}
                >
                  <button
                    type="button"
                    className="module-heading"
                    onClick={() => toggleModule(module.id ?? index)}
                    aria-expanded={isExpanded}
                  >
                    <div>
                      <strong>Module {index + 1}</strong>

                      <span>{module.title}</span>

                      <small>
                        {module.lessons?.length ?? 0} lessons
                      </small>
                    </div>

                    {isExpanded ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="module-lessons">
                      {(module.lessons ?? []).map((lesson) => {
                        const isCompleted = completed.includes(lesson.id);

                        const isActive =
                          String(activeId) === String(lesson.id);

                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            className={`lesson-item ${
                              isActive ? "lesson-active" : ""
                            }`}
                            onClick={() => selectLesson(lesson.id)}
                            aria-current={isActive ? "true" : undefined}
                          >
                            <span className="lesson-status-icon">
                              {isCompleted ? (
                                <CheckCircle2 size={17} />
                              ) : (
                                <Play size={15} />
                              )}
                            </span>

                            <span className="lesson-item-text">
                              <strong>{lesson.title}</strong>

                              <small>
                                <Video size={13} />
                                {lesson.duration || "Video lesson"}
                              </small>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })
          ) : (
            <div className="empty-state">
              <BookOpen size={30} />

              <h3>No modules available</h3>

              <p>Add modules and lessons using Course Studio.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}