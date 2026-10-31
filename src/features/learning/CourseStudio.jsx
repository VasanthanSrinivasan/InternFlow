import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Trash2, BookOpen, Pencil, ListVideo, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import api, { deleteWithDependents, getErrorMessage } from "../../api/client";
import PageState from "../../components/common/PageState";
import ConfirmModal from "../../components/common/ConfirmModal";
import { createId } from "../../utils/format";

import "./CourseStudio.css";

const DEFAULT_THUMBNAIL = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900";

const empty = {
  title: "",
  category: "Web Development",
  level: "Beginner",
  instructor: "",
  duration: "2h",
  skills: "",
  description: "",
  thumbnail: "",
};

const emptyLesson = { moduleTitle: "", title: "", duration: "10 min", videoUrl: "" };

function lessonCount(course) {
  return (course.modules ?? []).reduce((n, module) => n + module.lessons.length, 0);
}

export default function CourseStudio() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null); // course id while editing
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // /learning/studio?lessons=3 opens the lesson manager for course 3 (used by "Manage videos" links)
  const [searchParams] = useSearchParams();
  const [lessonCourseId, setLessonCourseId] = useState(() => Number(searchParams.get("lessons")) || null);
  const [editingLesson, setEditingLesson] = useState(null); // { lessonId } while editing a lesson
  const [lessonForm, setLessonForm] = useState(emptyLesson);

  // READ -> GET /courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get("/courses", { params: { _sort: "id", _order: "desc" } });
        setItems(response.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const lessonCourse = items.find((course) => course.id === lessonCourseId) ?? null;

  function startEdit(course) {
    setEditing(course.id);
    setForm({
      title: course.title,
      category: course.category,
      level: course.level,
      instructor: course.instructor,
      duration: course.duration,
      skills: (course.skills ?? []).join(", "),
      description: course.description,
      thumbnail: course.thumbnail ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditing(null);
    setForm(empty);
  }

  // CREATE (POST) or UPDATE (PATCH)
  async function submit(e) {
    e.preventDefault();

    const fields = {
      title: form.title.trim(),
      category: form.category,
      level: form.level,
      instructor: form.instructor.trim(),
      duration: form.duration.trim(),
      description: form.description.trim(),
      thumbnail: form.thumbnail.trim() || DEFAULT_THUMBNAIL,
      skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
    };

    setSaving(true);

    try {
      if (editing) {
        const response = await api.patch(`/courses/${editing}`, fields);
        setItems((old) => old.map((course) => (course.id === editing ? response.data : course)));
        toast.success("Course updated.");
      } else {
        const response = await api.post("/courses", { ...fields, rating: 0, students: 0, modules: [] });
        setItems((old) => [response.data, ...old]);
        toast.success("Course created. Use “Lessons” to add recorded classes.");
      }
      cancelEdit();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // DELETE -> also removes enrollments, progress, tasks and submissions of this course
  async function confirmDelete() {
    setSaving(true);

    try {
      await deleteWithDependents("courses", deleteTarget.id, ["progress", "enrollments", "assessments", "submissions"]);
      setItems((old) => old.filter((course) => course.id !== deleteTarget.id));
      if (editing === deleteTarget.id) cancelEdit();
      toast.success("Course deleted.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // Lessons live inside the course document (course.modules[].lessons[]) -> PATCH the modules array
  async function saveModules(course, modules, message) {
    try {
      const response = await api.patch(`/courses/${course.id}`, { modules });
      setItems((old) => old.map((item) => (item.id === course.id ? response.data : item)));
      toast.success(message);
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return false;
    }
  }

  // Add a new lesson/video, or save changes to the lesson being edited
  async function addLesson(e) {
    e.preventDefault();

    const moduleTitle = lessonForm.moduleTitle.trim();
    const lessonId = editingLesson?.lessonId ?? createId("lesson");
    const lesson = {
      id: lessonId,
      title: lessonForm.title.trim(),
      duration: lessonForm.duration.trim() || "Video lesson",
      videoUrl: lessonForm.videoUrl.trim(),
    };

    let modules = (lessonCourse.modules ?? []).map((module) => ({ ...module, lessons: [...module.lessons] }));
    const sameTitle = (module) => module.title.toLowerCase() === moduleTitle.toLowerCase();
    const currentModule = editingLesson ? modules.find((module) => module.lessons.some((item) => item.id === lessonId)) : null;

    if (currentModule && sameTitle(currentModule)) {
      // same module: replace in place so the lesson keeps its position
      currentModule.lessons = currentModule.lessons.map((item) => (item.id === lessonId ? lesson : item));
    } else {
      if (editingLesson) {
        modules = modules.map((module) => ({ ...module, lessons: module.lessons.filter((item) => item.id !== lessonId) }));
      }
      const target = modules.find(sameTitle);
      if (target) target.lessons.push(lesson);
      else modules.push({ id: createId("module"), title: moduleTitle, lessons: [lesson] });
      modules = modules.filter((module) => module.lessons.length > 0);
    }

    const saved = await saveModules(lessonCourse, modules, editingLesson ? "Lesson updated." : "Video lesson added.");
    if (saved) {
      setEditingLesson(null);
      setLessonForm({ ...emptyLesson, moduleTitle });
    }
  }

  function startEditLesson(module, lesson) {
    setEditingLesson({ lessonId: lesson.id });
    setLessonForm({
      moduleTitle: module.title,
      title: lesson.title,
      duration: lesson.duration ?? "",
      videoUrl: lesson.videoUrl ?? "",
    });
  }

  function closeLessonManager() {
    setLessonCourseId(null);
    setEditingLesson(null);
    setLessonForm(emptyLesson);
  }

  function removeLesson(moduleId, lessonId) {
    const modules = lessonCourse.modules
      .map((module) =>
        module.id === moduleId
          ? { ...module, lessons: module.lessons.filter((lesson) => lesson.id !== lessonId) }
          : module
      )
      .filter((module) => module.lessons.length > 0); // drop empty modules

    saveModules(lessonCourse, modules, "Lesson removed.");
  }

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">LEARNING MANAGEMENT</span>
          <h2>Course Studio</h2>
          <p>Create new courses, or open any existing course and add its recorded videos.</p>
        </div>
      </div>

      <section className="panel studio-form-panel">
        <div className="panel-heading">
          <div>
            <h3>{editing ? <><Pencil size={18} /> Edit Course</> : <><Plus size={18} /> Create Course</>}</h3>
            <p>{editing ? "Update the course details, then save." : "Set up a course, then add its recorded lessons."}</p>
          </div>
        </div>

        <form className="studio-form" onSubmit={submit}>
          <label className="form-field">Course title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="form-field">Instructor<input required value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} /></label>
          <label className="form-field">Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>Web Development</option><option>Programming</option><option>Design</option><option>Data</option><option>Career Skills</option>
            </select>
          </label>
          <label className="form-field">Difficulty
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
            </select>
          </label>
          <label className="form-field">Duration<input required value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></label>
          <label className="form-field">Skills (comma separated)<input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, Hooks, Routing" /></label>
          <label className="form-field">Thumbnail URL<input type="url" value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} placeholder="https://... (optional)" /></label>
          <label className="form-field studio-description">Description<textarea required rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="studio-form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {editing ? <><Save size={16} /> Save Changes</> : <><Plus size={16} /> Create Course</>}
            </button>
            {editing && (
              <button className="secondary-button" type="button" onClick={cancelEdit}>Cancel edit</button>
            )}
          </div>
        </form>
      </section>

      <PageState loading={loading} error={error} />

      {!loading && !error && (
        <section className="panel studio-list">
          <div className="panel-heading"><div><h3>Course Catalog</h3><p>{items.length} courses</p></div></div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Course</th><th>Category</th><th>Instructor</th><th>Lessons</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <div className="student-cell">
                        <div className="table-avatar"><BookOpen size={17} /></div>
                        <div><strong>{course.title}</strong><span>{course.level}</span></div>
                      </div>
                    </td>
                    <td>{course.category}</td>
                    <td>{course.instructor}</td>
                    <td>{lessonCount(course)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-button" onClick={() => { setLessonCourseId(course.id); setLessonForm(emptyLesson); }} aria-label="Manage lessons" title="Manage lessons"><ListVideo size={16} /></button>
                        <button className="icon-button" onClick={() => startEdit(course)} aria-label="Edit course" title="Edit course"><Pencil size={16} /></button>
                        <button className="icon-button danger-button" onClick={() => setDeleteTarget(course)} aria-label="Delete course" title="Delete course"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan="5" className="empty-cell">No courses yet. Create your first course above.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this course?"
        message={`"${deleteTarget?.title}" and all student progress for it will be removed.`}
        busy={saving}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {lessonCourse && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeLessonManager(); }}>
          <div className="modal-card lesson-manager">
            <div className="modal-header">
              <div>
                <h3>Lessons — {lessonCourse.title}</h3>
                <p>{lessonCount(lessonCourse)} recorded lesson(s)</p>
              </div>
              <button type="button" className="icon-button" onClick={closeLessonManager} aria-label="Close"><X size={19} /></button>
            </div>

            <div className="lesson-manager-list">
              {(lessonCourse.modules ?? []).map((module) => (
                <div key={module.id} className="lesson-manager-module">
                  <strong>{module.title}</strong>
                  {module.lessons.map((lesson) => (
                    <div className="lesson-manager-row" key={lesson.id}>
                      <span>{lesson.title}<small>{lesson.duration}{lesson.videoUrl ? " · video linked" : " · no video yet"}</small></span>
                      <div className="table-actions">
                        <button className="icon-button" onClick={() => startEditLesson(module, lesson)} aria-label="Edit lesson"><Pencil size={15} /></button>
                        <button className="icon-button danger-button" onClick={() => removeLesson(module.id, lesson.id)} aria-label="Remove lesson"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {lessonCount(lessonCourse) === 0 && <p className="muted-note">No lessons yet. Add the first one below.</p>}
            </div>

            <form onSubmit={addLesson} className="lesson-manager-form">
              <h4>{editingLesson ? "Edit lesson" : "Add a video lesson"}</h4>
              <label className="form-field">
                Module name
                <input required list="module-names" value={lessonForm.moduleTitle} onChange={(e) => setLessonForm({ ...lessonForm, moduleTitle: e.target.value })} placeholder="e.g. React Basics" />
                <datalist id="module-names">
                  {(lessonCourse.modules ?? []).map((module) => <option key={module.id} value={module.title} />)}
                </datalist>
              </label>
              <label className="form-field">Lesson title<input required value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} /></label>
              <div className="form-grid">
                <label className="form-field">Duration<input value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })} placeholder="12 min" /></label>
                <label className="form-field">Video link (YouTube, Vimeo or .mp4)<input type="url" value={lessonForm.videoUrl} onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." /></label>
              </div>
              <div className="modal-actions">
                {editingLesson && (
                  <button type="button" className="secondary-button" onClick={() => { setEditingLesson(null); setLessonForm({ ...emptyLesson, moduleTitle: lessonForm.moduleTitle }); }}>Cancel edit</button>
                )}
                <button type="submit" className="primary-button"><Plus size={16} /> {editingLesson ? "Save lesson" : "Add lesson"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
