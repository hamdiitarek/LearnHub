"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  price: number;
  level: string;
  category: string;
  instructor: {
    name: string;
  };
  _count: {
    lessons: number;
    enrollments: number;
  };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    fetchCourses();
  }, [search, category, level]);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (level) params.append("level", level);

      const response = await fetch(`/api/courses?${params.toString()}`);
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    "Programming",
    "Web Development",
    "Mobile Development",
    "Data Science",
    "Machine Learning",
    "Design",
    "Business",
    "Marketing",
  ];

  const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

  const getLevelColor = (level: string) => {
    switch (level) {
      case "BEGINNER":
        return "bg-green-100 text-green-800";
      case "INTERMEDIATE":
        return "bg-yellow-100 text-yellow-800";
      case "ADVANCED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Courses</h1>
        <p className="text-gray-600">
          Discover courses to help you achieve your goals
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Levels</option>
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl.charAt(0) + lvl.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setCategory("");
                setLevel("");
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 animate-pulse rounded-lg h-80"
            />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No courses found</h3>
          <p className="text-gray-600">
            Try adjusting your filters or search terms
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                      <span className="text-white text-4xl font-bold">
                        {course.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{course.category}</Badge>
                    <Badge className={getLevelColor(course.level)}>
                      {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    by {course.instructor.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {course.description}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {course._count.lessons} lessons • {course._count.enrollments}{" "}
                    students
                  </div>
                  <div className="font-bold text-blue-600">
                    {course.price === 0 ? "Free" : `$${course.price}`}
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
