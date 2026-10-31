import "./Courses.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Clock3, Star, PlayCircle, BookOpen, Hourglass, CheckCircle2, Video, Plus } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/client";
import PageState from "../../components/common/PageState";
import useAuth from "../../context/useAuth";

const categories = ["All Courses", "Web Development", "Programming", "Design", "Data"];

export default function Courses() {
  const { user, isStaff } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]); // my enrollment requests (students)
  const [enrollingId, setEnrollingId] = useState(null);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Courses");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // READ -> GET /courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const [coursesRes, enrollmentsRes] = await Promise.all([
          api.get("/courses"),
          isStaff ? Promise.resolve({ data: [] }) : api.get("/enrollments", { params: { userId: user.id } }),
        ]);
        setCourses(coursesRes.data);
        setEnrollments(enrollmentsRes.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [isStaff, user.id]);

  // SEARCH + CATEGORY filter
  useEffect(() => {
    const query = search.toLowerCase().trim();

    setFiltered(
      courses.filter(
        (course) =>
          (category === "All Courses" || course.category === category) &&
          [course.title, course.category, course.instructor, ...(course.skills ?? [])].some((value) =>
            String(value).toLowerCase().includes(query)
          )
      )
    );
  }, [courses, search, category]);

  // CREATE an enrollment request (status Pending) or ask again after a rejection
  async function enroll(course) {
    const existing = enrollments.find((item) => item.courseId === course.id);
    setEnrollingId(course.id);

    try {
      if (existing) {
        const response = await api.patch(`/enrollments/${existing.id}`, {
          status: "Pending",
          requestedAt: new Date().toISOString(),
          reviewedBy: null,
          reviewedAt: null,
        });
        setEnrollments((old) => old.map((item) => (item.id === existing.id ? response.data : item)));
      } else {
        const response = await api.post("/enrollments", {
          userId: user.id,
          courseId: course.id,
          status: "Pending",
          requestedAt: new Date().toISOString(),
          reviewedBy: null,
          reviewedAt: null,
        });
        setEnrollments((old) => [...old, response.data]);
      }
      toast.success("Enrollment requested. A trainer or admin will approve it.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEnrollingId(null);
    }
  }

  return (
    <div className="learning-page">
      <section className="learning-hero">
        <div className="learning-hero-copy">
          <span className="hero-eyebrow">YOUR LEARNING SPACE</span>
          <h1>Learn skills.<br />Build your future.</h1>
          <p>Explore recorded classes and prepare for your next internship.</p>
          <a className="hero-button" href="#course-catalog">Explore Courses ↗</a>
        </div>
        <div className="hero-decoration">
          <div className="hero-book"><BookOpen size={72} /></div>
        </div>
      </section>

      <PageState loading={loading} error={error} />

      {!loading && !error && (
      <>
      <div className="learning-stats">
        <div><span>Available courses</span><strong>{courses.length}</strong></div>
        <div><span>Categories</span><strong>{new Set(courses.map((c) => c.category)).size}</strong></div>
        <div><span>Recorded lessons</span><strong>{courses.reduce((n, c) => n + (c.modules ?? []).reduce((sum, m) => sum + m.lessons.length, 0), 0)}</strong></div>
      </div>

      <section id="course-catalog" className="catalog-section">
        <div className="catalog-heading">
          <div>
            <h2>Discover your next course</h2>
            <p>Learn at your own pace with recorded classes.</p>
          </div>
          {isStaff ? (
            <Link className="catalog-my-learning" to="/learning/studio"><Plus size={15} /> Add course / videos</Link>
          ) : (
            <Link className="catalog-my-learning" to="/learning/my-learning">My Learning</Link>
          )}
        </div>

        <label className="catalog-search">
          <Search size={19} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses and skills..." />
        </label>

        <div className="catalog-filters">
          <div className="category-tabs">
            {categories.map((item) => (
              <button
                key={item}
                className={`category-tab ${category === item ? "selected" : ""}`}
                onClick={() => setCategory(item)}
              >{item}</button>
            ))}
          </div>
        </div>

        <div className="course-grid">
          {filtered.map((course) => {
            const count = (course.modules ?? []).reduce((n, m) => n + m.lessons.length, 0);
            const enrollment = enrollments.find((item) => item.courseId === course.id);

            return (
              <article className="course-card" key={course.id}>
                <Link to={`/learning/courses/${course.id}`} className="course-image-link">
                  <img className="course-thumbnail" src={course.thumbnail} alt={course.title} loading="lazy" />
                  <span className="course-category">{course.category}</span>
                  <span className="course-play"><PlayCircle size={36} /></span>
                </Link>

                <div className="course-card-body">
                  <div className="course-meta">
                    <span>{course.level}</span>
                    <span><Star size={14} fill="#f6b94a" color="#f6b94a" /> {course.rating}</span>
                  </div>
                  <h3>{course.title}</h3>
                  <p className="course-description">{course.description}</p>
                  <div className="course-instructor">
                    <div className="instructor-avatar">{course.instructor.slice(0, 1)}</div>
                    <span>{course.instructor}</span>
                  </div>
                  <div className="course-footer">
                    <span><Clock3 size={15} /> {course.duration}</span>
                    <span>{count} lessons</span>
                  </div>
                  {isStaff ? (
                    <div className="course-actions-row">
                      <Link to={`/learning/courses/${course.id}`} className="course-action">Preview ↗</Link>
                      <Link to={`/learning/studio?lessons=${course.id}`} className="course-action course-action-alt"><Video size={15} /> Manage videos</Link>
                    </div>
                  ) : enrollment?.status === "Approved" ? (
                    <Link to={`/learning/courses/${course.id}`} className="course-action"><CheckCircle2 size={16} /> Start learning ↗</Link>
                  ) : enrollment?.status === "Pending" ? (
                    <button type="button" className="course-action course-action-pending" disabled><Hourglass size={15} /> Approval pending</button>
                  ) : (
                    <button
                      type="button"
                      className="course-action course-action-enroll"
                      disabled={enrollingId === course.id}
                      onClick={() => enroll(course)}
                    >
                      {enrollingId === course.id ? "Requesting..." : enrollment?.status === "Rejected" ? "Request again" : "Enroll now"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="catalog-empty">
            <h3>No matching courses</h3>
            <p>Try another keyword or category.</p>
          </div>
        )}
      </section>
      </>
      )}
    </div>
  );
}
