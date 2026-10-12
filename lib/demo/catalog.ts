// Demo catalogue: curated learning paths built from free lectures on YouTube.
// Every video ID, title, channel and duration was checked against YouTube.
// Lessons embed the original video and credit its channel.

export type DemoQuestion =
  | { type: "MULTIPLE_CHOICE"; text: string; options: string[]; answer: string }
  | { type: "TRUE_FALSE"; text: string; answer: "True" | "False" }
  | {
      type: "MULTIPLE_SELECT";
      text: string;
      options: string[];
      answer: string[];
    };

export type DemoLesson = {
  youtubeId: string;
  title: string;
  /** Original YouTube title, shown with the credit. */
  videoTitle: string;
  channel: string;
  seconds: number;
  summary: string;
  free?: boolean;
  quiz?: { title: string; passingScore?: number; questions: DemoQuestion[] };
};

export type DemoCourse = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  instructor: keyof typeof INSTRUCTORS;
  status?: "PUBLISHED" | "DRAFT";
  lessons: DemoLesson[];
};

export const INSTRUCTORS = {
  omar: {
    name: "Omar Nabil",
    email: "omar@learnhub.demo",
    bio: "Front-end lead who has mentored junior developers in Cairo for eight years. Curates the web development paths.",
  },
  yara: {
    name: "Yara Mansour",
    email: "yara@learnhub.demo",
    bio: "Data scientist working on Arabic NLP. Curates the Python, data and machine learning paths.",
  },
  salma: {
    name: "Dr. Salma Adel",
    email: "salma@learnhub.demo",
    bio: "Lecturer in computer science. Curates the algorithms, databases and CS foundations paths.",
  },
  karim: {
    name: "Karim Fouad",
    email: "karim@learnhub.demo",
    bio: "DevOps engineer. Curates the tooling paths: Git, containers and shipping code.",
  },
} as const;

const tf = (text: string, answer: "True" | "False"): DemoQuestion => ({
  type: "TRUE_FALSE",
  text,
  answer,
});
const mc = (text: string, options: string[], answer: string): DemoQuestion => ({
  type: "MULTIPLE_CHOICE",
  text,
  options,
  answer,
});
const ms = (
  text: string,
  options: string[],
  answer: string[],
): DemoQuestion => ({ type: "MULTIPLE_SELECT", text, options, answer });

export const COURSES: DemoCourse[] = [
  {
    slug: "web-from-scratch",
    title: "The Web, From Scratch",
    shortDescription:
      "HTML, CSS and JavaScript in the order you actually need them, ending with a real multi-page site.",
    description:
      "Start with the structure of a page, make it look good with CSS, then make it interactive with JavaScript. Each lesson is a complete lecture from a teacher who explains it well, followed by a short quiz so you know it stuck. By the end you build a full website from a blank file.",
    category: "Web Development",
    level: "BEGINNER",
    instructor: "omar",
    lessons: [
      {
        youtubeId: "UB1O30fR-EE",
        title: "HTML: structure and semantics",
        videoTitle: "HTML Crash Course For Absolute Beginners",
        channel: "Traversy Media",
        seconds: 3642,
        summary:
          "Tags, attributes, forms and the semantic elements that make a page readable to people and search engines.",
        free: true,
      },
      {
        youtubeId: "yfoY53QXEnI",
        title: "CSS: selectors, the box model and layout",
        videoTitle: "CSS Crash Course For Absolute Beginners",
        channel: "Traversy Media",
        seconds: 5111,
        summary:
          "How selectors match elements, how margin, border and padding work, and how to position things on the page.",
        quiz: {
          title: "CSS essentials",
          questions: [
            mc(
              "Which property controls the space between an element's content and its border?",
              ["margin", "padding", "border-spacing", "gap"],
              "padding",
            ),
            mc(
              'Which selector targets the element with id="nav"?',
              [".nav", "#nav", "nav", "*nav"],
              "#nav",
            ),
            tf("Margins are part of an element's background area.", "False"),
            ms(
              "Which of these are valid ways to write a colour in CSS?",
              [
                "#e4f95b",
                "rgb(228, 249, 91)",
                "hsl(68, 92%, 67%)",
                "colour(lime)",
              ],
              ["#e4f95b", "rgb(228, 249, 91)", "hsl(68, 92%, 67%)"],
            ),
          ],
        },
      },
      {
        youtubeId: "W6NZfCO5SIk",
        title: "JavaScript: your first program",
        videoTitle:
          "JavaScript Course for Beginners – Your First Step to Web Development",
        channel: "Programming with Mosh",
        seconds: 2897,
        summary:
          "Variables, types, operators and functions, with the browser console as your playground.",
        quiz: {
          title: "JavaScript basics",
          questions: [
            mc(
              "Which keyword declares a variable that can't be reassigned?",
              ["var", "let", "const", "static"],
              "const",
            ),
            mc(
              "What does typeof [] return?",
              ["array", "object", "list", "undefined"],
              "object",
            ),
            tf("The === operator compares both value and type.", "True"),
            mc(
              "Which method adds an item to the end of an array?",
              ["push()", "shift()", "unshift()", "pop()"],
              "push()",
            ),
            ms(
              "Which of these values are falsy?",
              ["0", '"" (empty string)', "null", '"false"'],
              ["0", '"" (empty string)', "null"],
            ),
          ],
        },
      },
      {
        youtubeId: "hdI2bqOjy3c",
        title: "JavaScript: the DOM and events",
        videoTitle: "JavaScript Crash Course For Beginners",
        channel: "Traversy Media",
        seconds: 6030,
        summary:
          "Arrays, objects, loops and conditionals, then reaching into the page with the DOM and reacting to clicks.",
      },
      {
        youtubeId: "pQN-pnXPaVg",
        title: "Project: build a complete website",
        videoTitle: "HTML Full Course - Build a Website Tutorial",
        channel: "freeCodeCamp.org",
        seconds: 7351,
        summary:
          "Put it together: plan the pages, write the markup and ship a multi-page site.",
      },
    ],
  },
  {
    slug: "react-practical",
    title: "React, the Practical Way",
    shortDescription:
      "Components, state and hooks, then TypeScript and a full course to build real apps.",
    description:
      "Learn React the way teams use it: small components, state that lives in the right place, and hooks for side effects. Three teachers build the same ideas from different angles, then the TypeScript lecture shows how to keep a growing codebase safe.",
    category: "Web Development",
    level: "INTERMEDIATE",
    instructor: "omar",
    lessons: [
      {
        youtubeId: "SqcY0GlETPk",
        title: "Thinking in components",
        videoTitle: "React Tutorial for Beginners",
        channel: "Programming with Mosh",
        seconds: 4804,
        summary:
          "JSX, components and props, and how React decides what to re-render.",
        free: true,
        quiz: {
          title: "React fundamentals",
          questions: [
            mc(
              "What does useState return?",
              [
                "The current value only",
                "A setter function only",
                "An array with the current value and a setter",
                "A promise",
              ],
              "An array with the current value and a setter",
            ),
            tf(
              "A component should treat the props it receives as read-only.",
              "True",
            ),
            mc(
              "Why does React ask for a key on list items?",
              [
                "To style each item",
                "To identify items between renders",
                "To make items clickable",
                "To sort the list",
              ],
              "To identify items between renders",
            ),
            mc(
              "Which hook runs code after render, for example to fetch data?",
              ["useMemo", "useRef", "useEffect", "useId"],
              "useEffect",
            ),
          ],
        },
      },
      {
        youtubeId: "w7ejDZ8SWv8",
        title: "Build a task tracker",
        videoTitle: "React JS Crash Course",
        channel: "Traversy Media",
        seconds: 6527,
        summary:
          "A full small app: forms, lists, state updates and talking to a mock API.",
      },
      {
        youtubeId: "Ke90Tje7VS0",
        title: "Rendering, events and forms in depth",
        videoTitle: "React JS - React Tutorial for Beginners",
        channel: "Programming with Mosh",
        seconds: 8727,
        summary:
          "Lifting state up, controlled inputs and composing components cleanly.",
      },
      {
        youtubeId: "30LWjhZzg50",
        title: "TypeScript for React developers",
        videoTitle: "Learn TypeScript – Full Tutorial",
        channel: "freeCodeCamp.org",
        seconds: 17185,
        summary:
          "Types, interfaces, generics and narrowing, so your components say what they expect.",
      },
      {
        youtubeId: "bMknfKXIFA8",
        title: "Capstone: the full React course",
        videoTitle:
          "React Course - Beginner's Tutorial for React JavaScript Library [2022]",
        channel: "freeCodeCamp.org",
        seconds: 42927,
        summary:
          "Eight projects from start to finish. Pick the ones that match what you want to build.",
      },
    ],
  },
  {
    slug: "node-backend",
    title: "Backend with Node.js",
    shortDescription:
      "Servers, routing and REST APIs with Node and Express, then shipping them in containers.",
    description:
      "Move from the browser to the server. You will build HTTP servers, structure an Express API, connect a database and package the whole thing with Docker so it runs the same everywhere.",
    category: "Web Development",
    level: "INTERMEDIATE",
    instructor: "omar",
    lessons: [
      {
        youtubeId: "fBNz5xF-Kx4",
        title: "Node.js fundamentals",
        videoTitle: "Node.js Crash Course",
        channel: "Traversy Media",
        seconds: 5407,
        summary:
          "Modules, the file system, the event loop and a server built without any framework.",
        free: true,
        quiz: {
          title: "Node and Express",
          questions: [
            mc(
              "Which JavaScript engine does Node.js run on?",
              ["SpiderMonkey", "V8", "JavaScriptCore", "Chakra"],
              "V8",
            ),
            mc(
              "In Express, which line registers a handler for GET /users?",
              [
                "app.get('/users', handler)",
                "app.route('GET /users')",
                "app.fetch('/users')",
                "app.on('/users')",
              ],
              "app.get('/users', handler)",
            ),
            tf(
              "npm install express adds express to the dependencies in package.json.",
              "True",
            ),
            mc(
              "Which HTTP status code means Not Found?",
              ["200", "301", "404", "500"],
              "404",
            ),
          ],
        },
      },
      {
        youtubeId: "Oe421EPjeBE",
        title: "REST APIs with Express",
        videoTitle: "Node.js and Express.js - Full Course",
        channel: "freeCodeCamp.org",
        seconds: 29807,
        summary:
          "Routing, middleware, error handling and a complete task manager API with MongoDB.",
      },
      {
        youtubeId: "3c-iBn73dDE",
        title: "Shipping it with Docker",
        videoTitle: "Docker Tutorial for Beginners [FULL COURSE in 3 Hours]",
        channel: "TechWorld with Nana",
        seconds: 9975,
        summary:
          "Images, containers, volumes and Docker Compose for a Node app and its database.",
      },
    ],
  },
  {
    slug: "python-from-zero",
    title: "Python from Zero",
    shortDescription:
      "From your first print() to classes and objects, at the pace of a good university course.",
    description:
      "Python is the friendliest first language and the one used most in data and AI. This path starts with a one-hour overview, goes deep with two complete courses, and finishes with object-oriented programming so you can read and write real-world code.",
    category: "Programming",
    level: "BEGINNER",
    instructor: "yara",
    lessons: [
      {
        youtubeId: "kqtD5dpn9C8",
        title: "Python in one hour",
        videoTitle: "Python for Beginners - Learn Coding with Python in 1 Hour",
        channel: "Programming with Mosh",
        seconds: 3606,
        summary:
          "Variables, input, conditions and loops, with a few small programs to get comfortable.",
        free: true,
        quiz: {
          title: "Python basics",
          questions: [
            mc(
              "What does print(type(3.0)) show?",
              [
                "<class 'int'>",
                "<class 'float'>",
                "<class 'str'>",
                "<class 'decimal'>",
              ],
              "<class 'float'>",
            ),
            mc("What is 7 // 2 in Python?", ["3.5", "3", "4", "1"], "3"),
            tf("Python uses indentation to define code blocks.", "True"),
            ms(
              "Which of these types are mutable?",
              ["list", "dict", "tuple", "str"],
              ["list", "dict"],
            ),
          ],
        },
      },
      {
        youtubeId: "_uQrJ0TkZlc",
        title: "The complete Python course",
        videoTitle: "Python Full Course for Beginners",
        channel: "Programming with Mosh",
        seconds: 22447,
        summary:
          "Functions, exceptions, modules, packages and the standard library, built up step by step.",
      },
      {
        youtubeId: "rfscVS0vtbw",
        title: "Practice: small programs and games",
        videoTitle: "Learn Python - Full Course for Beginners [Tutorial]",
        channel: "freeCodeCamp.org",
        seconds: 16012,
        summary:
          "A second teacher and dozens of small exercises: calculators, a guessing game and a quiz app.",
      },
      {
        youtubeId: "ZDa-Z5JzLYM",
        title: "Classes and objects",
        videoTitle: "Python OOP Tutorial 1: Classes and Instances",
        channel: "Corey Schafer",
        seconds: 924,
        summary:
          "Why classes exist, __init__, instance attributes and methods.",
        quiz: {
          title: "Object-oriented Python",
          questions: [
            mc(
              "What is __init__ used for?",
              [
                "Deleting an object",
                "Initialising a new instance",
                "Importing a module",
                "Defining a class variable",
              ],
              "Initialising a new instance",
            ),
            mc(
              "Inside a method, what does self refer to?",
              [
                "The class",
                "The current instance",
                "The parent class",
                "The module",
              ],
              "The current instance",
            ),
            tf(
              "A class variable is shared by every instance of the class.",
              "True",
            ),
          ],
        },
      },
    ],
  },
  {
    slug: "data-analysis-python",
    title: "Data Analysis with Python",
    shortDescription:
      "Load, clean, group and question real datasets with pandas, then take your first step into machine learning.",
    description:
      "Most data work is reading a messy file and answering a question about it. You will learn pandas from a hands-on tutorial, see the whole data science workflow, and finish with a gentle introduction to machine learning models.",
    category: "Data Science",
    level: "INTERMEDIATE",
    instructor: "yara",
    lessons: [
      {
        youtubeId: "vmEHCJofslg",
        title: "pandas in one sitting",
        videoTitle:
          "Complete Python Pandas Data Science Tutorial! (Reading CSV/Excel files, Sorting, Filtering, Groupby)",
        channel: "Keith Galli",
        seconds: 3626,
        summary:
          "Reading CSV and Excel files, filtering, sorting and groupby on a real dataset.",
        free: true,
        quiz: {
          title: "pandas essentials",
          questions: [
            mc(
              "Which function reads a CSV file into a DataFrame?",
              ["pd.read_csv()", "pd.open_csv()", "pd.load()", "pd.csv()"],
              "pd.read_csv()",
            ),
            mc(
              "What does df.groupby('city')['sales'].sum() return?",
              [
                "Total sales for each city",
                "The first sale in each city",
                "The number of cities",
                "Sales sorted by city",
              ],
              "Total sales for each city",
            ),
            mc(
              "Which expression selects the rows where price is over 100?",
              [
                "df[df['price'] > 100]",
                "df.price > 100",
                "df.filter(price > 100)",
                "df.where('price > 100')",
              ],
              "df[df['price'] > 100]",
            ),
            tf("df.head() shows the first five rows by default.", "True"),
          ],
        },
      },
      {
        youtubeId: "ua-CiDNNj30",
        title: "The data science workflow",
        videoTitle: "Learn Data Science Tutorial - Full Course for Beginners",
        channel: "freeCodeCamp.org",
        seconds: 21128,
        summary:
          "Asking good questions, gathering data, exploring it and communicating what you found.",
      },
      {
        youtubeId: "i_LwzRVP7bg",
        title: "Machine learning for everybody",
        videoTitle: "Machine Learning for Everybody – Full Course",
        channel: "freeCodeCamp.org",
        seconds: 14033,
        summary:
          "Classification and regression from scratch, with the intuition behind each model.",
      },
    ],
  },
  {
    slug: "neural-networks-visually",
    title: "Neural Networks, Visually",
    shortDescription:
      "The clearest explanation of deep learning on the internet, from a single neuron to the transformers behind LLMs.",
    description:
      "3Blue1Brown's deep learning series builds the ideas with animation instead of equations first. Start with what AI is, follow the series chapter by chapter, then write your own networks in TensorFlow.",
    category: "AI & Machine Learning",
    level: "INTERMEDIATE",
    instructor: "yara",
    lessons: [
      {
        youtubeId: "2ePf9rue1Ao",
        title: "What is artificial intelligence?",
        videoTitle:
          "What is Artificial Intelligence? In 5 minutes.(Part 2 link in Description)",
        channel: "Dr. Raj Ramesh",
        seconds: 327,
        summary:
          "A five-minute map of the field before we zoom in on neural networks.",
        free: true,
      },
      {
        youtubeId: "aircAruvnKk",
        title: "What is a neural network?",
        videoTitle: "But what is a neural network? | Deep learning chapter 1",
        channel: "3Blue1Brown",
        seconds: 1120,
        summary:
          "Neurons, layers, weights and biases, through a network that reads handwritten digits.",
        free: true,
        quiz: {
          title: "Inside a neural network",
          questions: [
            mc(
              "In the handwritten digit network, how many input neurons are there?",
              ["10", "784", "16", "256"],
              "784",
            ),
            mc(
              "How many output neurons does that network have?",
              ["1", "9", "10", "784"],
              "10",
            ),
            mc(
              "Which function squashes a weighted sum into the range 0 to 1?",
              ["Sigmoid", "ReLU", "Tanh", "Linear"],
              "Sigmoid",
            ),
          ],
        },
      },
      {
        youtubeId: "IHZwWFHWa-w",
        title: "How networks learn: gradient descent",
        videoTitle:
          "Gradient descent, how neural networks learn | Deep Learning Chapter 2",
        channel: "3Blue1Brown",
        seconds: 1233,
        summary:
          "The cost function and how nudging every weight downhill makes the network better.",
        quiz: {
          title: "Gradient descent",
          questions: [
            mc(
              "Gradient descent changes the weights in the direction that…",
              [
                "increases the cost fastest",
                "decreases the cost fastest",
                "keeps the cost constant",
                "randomises the cost",
              ],
              "decreases the cost fastest",
            ),
            mc(
              "What does the cost function measure?",
              [
                "How wrong the network's outputs are",
                "How many layers the network has",
                "How long training takes",
                "The learning rate",
              ],
              "How wrong the network's outputs are",
            ),
            tf(
              "Backpropagation is the algorithm used to compute the gradient.",
              "True",
            ),
          ],
        },
      },
      {
        youtubeId: "Ilg3gGewQ5U",
        title: "Backpropagation, intuitively",
        videoTitle: "Backpropagation, intuitively | Deep Learning Chapter 3",
        channel: "3Blue1Brown",
        seconds: 767,
        summary:
          "Which weights to change, and by how much, explained without calculus first.",
      },
      {
        youtubeId: "tIeHLnjs5U8",
        title: "The calculus of backpropagation",
        videoTitle: "Backpropagation calculus | Deep Learning Chapter 4",
        channel: "3Blue1Brown",
        seconds: 617,
        summary: "The chain rule behind it, for when you want the maths.",
      },
      {
        youtubeId: "wjZofJX0v4M",
        title: "Transformers, the tech behind LLMs",
        videoTitle:
          "Transformers, the tech behind LLMs | Deep Learning Chapter 5",
        channel: "3Blue1Brown",
        seconds: 1634,
        summary:
          "Tokens, embeddings and attention: how models like ChatGPT predict the next word.",
      },
      {
        youtubeId: "tPYj3fFJGjk",
        title: "Hands-on: neural networks in TensorFlow",
        videoTitle:
          "TensorFlow 2.0 Complete Course - Python Neural Networks for Beginners Tutorial",
        channel: "freeCodeCamp.org",
        seconds: 24728,
        summary:
          "Train real models in Python: classification, image recognition and text.",
      },
    ],
  },
  {
    slug: "databases-sql",
    title: "Databases & SQL",
    shortDescription:
      "Query, join and design relational databases, from SELECT to PostgreSQL in production.",
    description:
      "Every app keeps its data somewhere. Learn to ask a database questions with SQL, combine tables with joins, and design schemas that stay correct as they grow. You finish with PostgreSQL, the database most companies reach for.",
    category: "Data",
    level: "BEGINNER",
    instructor: "salma",
    lessons: [
      {
        youtubeId: "7S_tz1z_5bA",
        title: "SQL from the ground up",
        videoTitle: "SQL Course for Beginners [Full Course]",
        channel: "Programming with Mosh",
        seconds: 11419,
        summary:
          "SELECT, WHERE, ORDER BY, joins, grouping and changing data, on a realistic sample database.",
        free: true,
        quiz: {
          title: "SQL essentials",
          questions: [
            mc(
              "Which clause filters rows before they are grouped?",
              ["WHERE", "HAVING", "ORDER BY", "LIMIT"],
              "WHERE",
            ),
            mc(
              "Which join returns only rows that have a match in both tables?",
              ["INNER JOIN", "LEFT JOIN", "FULL OUTER JOIN", "CROSS JOIN"],
              "INNER JOIN",
            ),
            mc(
              "What does SELECT COUNT(*) FROM orders; return?",
              [
                "The number of rows in orders",
                "The sum of all order totals",
                "The columns in orders",
                "The first order",
              ],
              "The number of rows in orders",
            ),
            tf("A PRIMARY KEY column can contain duplicate values.", "False"),
          ],
        },
      },
      {
        youtubeId: "HXV3zeQKqGY",
        title: "Database design and relationships",
        videoTitle: "SQL Tutorial - Full Database Course for Beginners",
        channel: "freeCodeCamp.org",
        seconds: 15639,
        summary:
          "Keys, relationships and ER diagrams, turned into a working company database.",
      },
      {
        youtubeId: "qw--VYLpxG4",
        title: "PostgreSQL in practice",
        videoTitle: "Learn PostgreSQL Tutorial - Full Course for Beginners",
        channel: "freeCodeCamp.org",
        seconds: 15574,
        summary:
          "Data types, constraints, indexes and the psql shell on the database used in production.",
      },
    ],
  },
  {
    slug: "algorithms-data-structures",
    title: "Algorithms & Data Structures",
    shortDescription:
      "The interview canon: complexity, core data structures, graphs and dynamic programming.",
    description:
      "A university-level path through the ideas behind efficient software. You will learn to reason about running time, pick the right data structure, traverse graphs and break hard problems into overlapping subproblems.",
    category: "Computer Science",
    level: "ADVANCED",
    instructor: "salma",
    lessons: [
      {
        youtubeId: "8hly31xKli0",
        title: "Algorithms and Big-O",
        videoTitle:
          "Algorithms and Data Structures Tutorial - Full Course for Beginners",
        channel: "freeCodeCamp.org",
        seconds: 19328,
        summary:
          "Linear and binary search, recursion, sorting and how to describe running time.",
        free: true,
        quiz: {
          title: "Complexity and structures",
          questions: [
            mc(
              "Binary search on a sorted array of n items runs in…",
              ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
              "O(log n)",
            ),
            mc(
              "Which structure is first-in, first-out?",
              ["Stack", "Queue", "Tree", "Hash map"],
              "Queue",
            ),
            mc(
              "Average lookup time in a hash table is…",
              ["O(1)", "O(log n)", "O(n)", "O(n²)"],
              "O(1)",
            ),
            tf(
              "Dynamic programming reuses the answers to overlapping subproblems.",
              "True",
            ),
          ],
        },
      },
      {
        youtubeId: "RBSGKlAvoiM",
        title: "Data structures, easy to advanced",
        videoTitle:
          "Data Structures Easy to Advanced Course - Full Tutorial from a Google Engineer",
        channel: "freeCodeCamp.org",
        seconds: 28997,
        summary:
          "Arrays, linked lists, stacks, queues, heaps, hash tables, trees and union-find.",
      },
      {
        youtubeId: "09_LlHjoEiY",
        title: "Graph theory",
        videoTitle:
          "Algorithms Course - Graph Theory Tutorial from a Google Engineer",
        channel: "freeCodeCamp.org",
        seconds: 24279,
        summary:
          "BFS, DFS, shortest paths, topological sort and minimum spanning trees.",
      },
      {
        youtubeId: "oBt53YbR9Kk",
        title: "Dynamic programming",
        videoTitle:
          "Dynamic Programming - Learn to Solve Algorithmic Problems & Coding Challenges",
        channel: "freeCodeCamp.org",
        seconds: 18602,
        summary:
          "Memoisation and tabulation, worked through classic interview problems.",
      },
    ],
  },
  {
    slug: "cs-foundations",
    title: "Computer Science Foundations",
    shortDescription:
      "How computers and programs really work, ending with Harvard's CS50 in full.",
    description:
      "Before frameworks and languages come the ideas they share: binary, memory, algorithms and abstraction. Start with a short introduction, then take Harvard's CS50, one of the most respected introductory courses in the world.",
    category: "Computer Science",
    level: "BEGINNER",
    instructor: "salma",
    lessons: [
      {
        youtubeId: "zOjov-2OZ0E",
        title: "Introduction to programming and CS",
        videoTitle:
          "Introduction to Programming and Computer Science - Full Course",
        channel: "freeCodeCamp.org",
        seconds: 7149,
        summary:
          "What programming is, how computers represent data and the building blocks every language shares.",
        free: true,
        quiz: {
          title: "Bits and basics",
          questions: [
            mc(
              "How many distinct values can 8 bits represent?",
              ["8", "128", "255", "256"],
              "256",
            ),
            mc(
              "What is the binary number 1010 in decimal?",
              ["8", "10", "12", "20"],
              "10",
            ),
            tf(
              "An algorithm is a step-by-step procedure for solving a problem.",
              "True",
            ),
          ],
        },
      },
      {
        youtubeId: "8mAITcNt710",
        title: "Harvard CS50, the full course",
        videoTitle: "Harvard CS50 – Full Computer Science University Course",
        channel: "freeCodeCamp.org",
        seconds: 89497,
        summary:
          "C, memory, data structures, Python, SQL and the web, taught by David J. Malan.",
      },
    ],
  },
  {
    slug: "git-docker-shipping",
    title: "Git, Docker & Shipping Code",
    shortDescription:
      "Version control and containers: the two tools every team expects you to know on day one.",
    description:
      "Learn Git well enough to work on a team without fear: commits, branches, pull requests and fixing mistakes. Then package any app in a container so it runs the same on your laptop and in production.",
    category: "Tools",
    level: "BEGINNER",
    instructor: "karim",
    lessons: [
      {
        youtubeId: "SWYqp7iY_Tc",
        title: "Git in 30 minutes",
        videoTitle: "Git & GitHub Crash Course For Beginners",
        channel: "Traversy Media",
        seconds: 1962,
        summary: "init, add, commit, branches and pushing to GitHub, fast.",
        free: true,
        quiz: {
          title: "Git and containers",
          questions: [
            mc(
              "Which command stages changes for the next commit?",
              ["git add", "git commit", "git push", "git status"],
              "git add",
            ),
            mc(
              "Which command creates a new branch and switches to it?",
              [
                "git switch -c feature",
                "git branch -d feature",
                "git merge feature",
                "git push feature",
              ],
              "git switch -c feature",
            ),
            tf(
              "git push uploads your local commits to a remote repository.",
              "True",
            ),
            mc(
              "What is a Docker image?",
              [
                "A running container",
                "A read-only template used to create containers",
                "A virtual machine",
                "A Dockerfile command",
              ],
              "A read-only template used to create containers",
            ),
          ],
        },
      },
      {
        youtubeId: "RGOj5yH7evk",
        title: "Working with GitHub",
        videoTitle: "Git and GitHub for Beginners - Crash Course",
        channel: "freeCodeCamp.org",
        seconds: 4110,
        summary:
          "Remotes, pull requests, merge conflicts and undoing mistakes.",
      },
      {
        youtubeId: "fqMOX6JJhGo",
        title: "Containers with Docker",
        videoTitle:
          "Docker Tutorial for Beginners - A Full DevOps Course on How to Run Applications in Containers",
        channel: "freeCodeCamp.org",
        seconds: 7818,
        summary:
          "Images, containers, Dockerfiles, networking and Compose, with a real app.",
      },
    ],
  },
  {
    slug: "php-modern",
    title: "PHP for the Modern Web",
    shortDescription:
      "A draft path: the language behind a large share of the web, from syntax to forms.",
    description:
      "Work in progress. One lesson so far; quizzes and a project are coming.",
    category: "Web Development",
    level: "BEGINNER",
    instructor: "karim",
    status: "DRAFT",
    lessons: [
      {
        youtubeId: "OK_JCtrrv-c",
        title: "PHP from the beginning",
        videoTitle: "PHP Programming Language Tutorial - Full Course",
        channel: "freeCodeCamp.org",
        seconds: 16599,
        summary:
          "Syntax, variables, arrays, functions, classes and handling form input.",
      },
    ],
  },
];
