import "./MyLearning.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, PlayCircle, CheckCircle2 } from "lucide-react";
import api, { getErrorMessage } from "../../api/client";
import useAuth from "../../context/useAuth";
import PageState from "../../components/common/PageState";

export default function MyLearning() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({}); // { [courseId]: [lessonId, ...] }
  const [enrollments, setEnrollments] = useState([]); // my enrollment requests
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // READ -> all courses + only MY progress rows
  useEffect(() => {
    const fetchLearning = async () => {
      try {
        const [coursesRes, progressRes, enrollmentsRes] = await Promise.all([
          api.get("/courses"),
          api.get("/progress", { params: { userId: user.id } }),
          api.get("/enrollments", { params: { userId: user.id } }),
        ]);

        const map = {};
        progressRes.data.forEach((row) => {
          map[row.courseId] = row.lessonIds;
        });

        setCourses(coursesRes.data);
        setProgress(map);
        setEnrollments(enrollmentsRes.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchLearning();
  }, [user.id]);

  // Only courses with an APPROVED enrollment appear in My Learning
  const approvedIds = enrollments.filter((item) => item.status === "Approved").map((item) => item.courseId);
  const enrolled = courses.filter((course) => approvedIds.includes(course.id));
  const waiting = enrollments
    .filter((item) => item.status !== "Approved")
    .map((item) => ({ ...item, course: courses.find((course) => course.id === item.courseId) }))
    .filter((item) => item.course);
  const started = enrolled.filter((course) => (progress[course.id] ?? []).length > 0);

  const completed = started.filter((course) => {
    const count = (course.modules ?? []).reduce((n, module) => n + module.lessons.length, 0);
    return count > 0 && (progress[course.id] ?? []).length >= count;
  });

  return (
    <div className="learning-page">
      <div className="page-header">
        <div><span className="eyebrow">STUDENT WORKSPACE</span><h2>My Learning</h2><p>Continue your lessons and track your progress.</p></div>
        <Link to="/learning/courses" className="primary-button"><BookOpen size={17} /> Browse Courses</Link>
      </div>

      <PageState loading={loading} error={error} />

      {!loading && !error && (
      <>
      <div className="learning-stats">
        <div><span>Enrolled courses</span><strong>{enrolled.length}</strong></div>
        <div><span>Courses started</span><strong>{started.length}</strong></div>
        <div><span>Courses completed</span><strong>{completed.length}</strong></div>
        <div><span>Lessons completed</span><strong>{Object.values(progress).reduce((n, list) => n + list.length, 0)}</strong></div>
      </div>

      <section className="catalog-section">
        <div className="catalog-heading"><div><h2>Continue Learning</h2><p>Pick up where you left off.</p></div></div>

        {enrolled.length === 0 ? (
          <div className="catalog-empty">
            <BookOpen size={35} />
            <h3>Your learning journey starts here</h3>
            <p>Enroll in a course. Once a trainer or admin approves it, it appears here.</p>
            <Link to="/learning/courses" className="primary-button">Explore Courses</Link>
          </div>
        ) : (
          <div className="course-grid">
            {enrolled.map((course) => {
              const count = (course.modules ?? []).reduce((n, m) => n + m.lessons.length, 0);
              const done = (progress[course.id] ?? []).length;
              const percent = count ? Math.min(100, Math.round(done / count * 100)) : 0;

              return (
                <article className="course-card" key={course.id}>
                  <Link to={`/learning/courses/${course.id}`}><img className="course-thumbnail" src={course.thumbnail} alt={course.title} /></Link>
                  <div className="course-card-body">
                    <span className="eyebrow">{course.category}</span>
                    <h3>{course.title}</h3>
                    <p className="course-description">{done} of {count} lessons completed</p>
                    <div className="progress-track"><div style={{ width: `${percent}%` }} /></div>
                    <div className="my-learning-progress"><span>{percent}% complete</span>{percent === 100 && <CheckCircle2 size={17} />}</div>
                    <Link to={`/learning/courses/${course.id}`} className="course-action"><PlayCircle size={16} /> {percent === 100 ? "Review Course" : "Continue Learning"}</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {waiting.length > 0 && (
        <section className="panel">
          <div className="panel-heading">
            <div><h3>Enrollment requests</h3><p>Courses waiting for approval from a trainer or admin</p></div>
          </div>
          <ul className="mini-list">
            {waiting.map((item) => (
              <li key={item.id}>
                <div className="table-avatar"><BookOpen size={17} /></div>
                <div><strong>{item.course.title}</strong><span>Requested {new Date(item.requestedAt).toLocaleDateString("en-IN")}</span></div>
                <span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      </>
      )}
    </div>
  );
}
