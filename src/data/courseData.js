
export const courses = [
  {
    id: "react",
    title: "Complete React Development",
    category: "Web Development",
    level: "Beginner",
    instructor: "Arun Kumar",
    duration: "8h 30m",
    rating: 4.8,
    students: 1280,
    description: "Learn components, hooks, routing and real-world React projects.",
    skills: ["React", "JavaScript", "Hooks"],
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=900",
    modules: [
      {
        id: "react-m1",
        title: "React Fundamentals",
        lessons: [
          { id: "react-l1", title: "Introduction to React", duration: "12 min", videoUrl: "https://www.youtube.com/watch?v=SqcY0GlETPk" },
          { id: "react-l2", title: "Components and JSX", duration: "18 min", videoUrl: "https://www.youtube.com/watch?v=SqcY0GlETPk" },
        ],
      },
      {
        id: "react-m2",
        title: "React Hooks",
        lessons: [
          { id: "react-l3", title: "Understanding useState", duration: "22 min", videoUrl: "https://www.youtube.com/watch?v=SqcY0GlETPk" },
          { id: "react-l4", title: "Understanding useEffect", duration: "25 min", videoUrl: "https://www.youtube.com/watch?v=SqcY0GlETPk" },
        ],
      },
    ],
  },
  {
    id: "python",
    title: "Python Programming Essentials",
    category: "Programming",
    level: "Beginner",
    instructor: "Priya Sharma",
    duration: "6h 15m",
    rating: 4.7,
    students: 960,
    description: "Learn Python fundamentals, functions and data structures.",
    skills: ["Python", "Functions", "Data Structures"],
    thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=900",
    modules: [
      {
        id: "python-m1",
        title: "Python Basics",
        lessons: [
          { id: "python-l1", title: "Introduction to Python", duration: "15 min", videoUrl: "https://www.youtube.com/watch?v=kqtD5dpn9C8" },
          { id: "python-l2", title: "Variables and Data Types", duration: "20 min", videoUrl: "https://www.youtube.com/watch?v=kqtD5dpn9C8" },
        ],
      },
    ],
  },
  {
    id: "uiux",
    title: "UI/UX Design Fundamentals",
    category: "Design",
    level: "Beginner",
    instructor: "Meena Devi",
    duration: "5h 40m",
    rating: 4.9,
    students: 740,
    description: "Learn wireframing, design systems and prototyping.",
    skills: ["Figma", "Wireframes", "Prototyping"],
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=900",
    modules: [
      {
        id: "uiux-m1",
        title: "Design Foundations",
        lessons: [
          { id: "uiux-l1", title: "Introduction to UI/UX", duration: "16 min", videoUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU" },
          { id: "uiux-l2", title: "Wireframing", duration: "24 min", videoUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU" },
        ],
      },
    ],
  },
  {
    id: "sql",
    title: "SQL Database Masterclass",
    category: "Data",
    level: "Intermediate",
    instructor: "Karthik Raj",
    duration: "7h 10m",
    rating: 4.8,
    students: 850,
    description: "Master SQL queries, joins and relational database design.",
    skills: ["SQL", "PostgreSQL", "Database Design"],
    thumbnail: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=900",
    modules: [
      {
        id: "sql-m1",
        title: "SQL Basics",
        lessons: [
          { id: "sql-l1", title: "Introduction to Databases", duration: "14 min", videoUrl: "https://www.youtube.com/watch?v=HXV3zeQKqGY" },
          { id: "sql-l2", title: "SELECT Queries", duration: "20 min", videoUrl: "https://www.youtube.com/watch?v=HXV3zeQKqGY" },
        ],
      },
    ],
  },
];
