'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthGuard, logout } from '@/lib/auth';
import { getToken, getUser } from '@/lib/session';
import { FiMenu, FiX, FiBook, FiUser, FiUsers, FiAward, FiClipboard, FiEdit, FiTrash, FiSave } from 'react-icons/fi';

interface Course {
  course_id: string;
  name: string;
  code: string;
  credits: string;
  semester: string;
}

interface Lecturer {
  lecturer_id: string;
  name: string;
  email: string;
  department: string;
}

interface CoursesLecturers {
  id: string;
  course_id: string;
  lecturer_id: string;
  role: string;
  course?: Course;  // Tambahkan informasi kursus langsung
  lecturer?: Lecturer; // Tambahkan informasi dosen langsung
}

interface User {
  name: string;
}

const CoursesLecturersPage = () => {
  const router = useRouter();
  const authReady = useAuthGuard();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [coursesLecturers, setCoursesLecturers] = useState<CoursesLecturers[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    course_id: '',
    lecturer_id: '',
    role: ''
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // Melacak apakah kita sedang mengedit entri yang ada

  const menuItems = [
    { name: 'Dashboard', path: '', icon: <FiUsers className="mr-3" /> },
    { name: 'Kursus', path: 'courses', icon: <FiBook className="mr-3" /> },
    { name: 'Dosen Kursus', path: 'courseslecturers', icon: <FiAward className="mr-3" /> },
    { name: 'Pendaftaran', path: 'enrollment', icon: <FiClipboard className="mr-3" /> },
    { name: 'Dosen', path: 'lecturers', icon: <FiUser className="mr-3" /> },
    { name: 'Siswa', path: 'students', icon: <FiUsers className="mr-3" /> },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleNavigate = (page: string) => router.push(`/dashboard/${page}`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fetchData = async () => {
        const token = getToken();
        if (token) {
          try {
            const [coursesResponse, lecturersResponse, coursesLecturersResponse] = await Promise.all([
              api.get(`/courses`),
              api.get(`/lecturers`),
              api.get(`/courseslecturers`)
            ]);

            const courses = coursesResponse.data;
            const lecturers = lecturersResponse.data;
            const coursesLecturers = coursesLecturersResponse.data.map((cl: CoursesLecturers) => ({
              ...cl,
              course: courses.find((course: Course) => course.course_id === cl.course_id),
              lecturer: lecturers.find((lecturer: Lecturer) => lecturer.lecturer_id === cl.lecturer_id)
            }));

            setCourses(courses);
            setLecturers(lecturers);
            setCoursesLecturers(coursesLecturers);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        }
      };

      const fetchUserData = () => {
        try {
          const sessionUser = getUser();
          if (sessionUser) {
            setUser(sessionUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };

      fetchData();
      fetchUserData();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = getToken();
    if (!token) {
      alert('Anda harus login untuk melakukan tindakan ini.');
      router.push('/login');
      setLoading(false);
      return;
    }

    const courseLecturerData = {
      course_id: formData.course_id,
      lecturer_id: formData.lecturer_id,
      role: formData.role
    };

    try {
      if (editingId) {
        // Perbarui penugasan yang ada
        const response = await api.put(`/courseslecturers/${editingId}`,
          courseLecturerData
        );

        if (response.status === 200) {
          const updatedAssignment = response.data.data;
          setCoursesLecturers((prev) =>
            prev.map((assignment) =>
              assignment.id === editingId ? updatedAssignment : assignment
            )
          );
          alert('Penugasan berhasil diperbarui!');
        }
      } else {
        // Buat penugasan baru
        const response = await api.post(`/courseslecturers`,
          courseLecturerData
        );

        if (response.status === 201) {
          setCoursesLecturers((prev) => [...prev, response.data.data]);
          alert('Penugasan Dosen Kursus berhasil ditambahkan!');
        }
      }

      setFormData({ course_id: '', lecturer_id: '', role: '' });
      setEditingId(null); // Reset mode pengeditan
    } catch (error) {
      console.error('Error saving Course Lecturer:', error);
      alert('Gagal menyimpan Penugasan Dosen Kursus.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const assignmentToEdit = coursesLecturers.find((assignment) => assignment.id === id);
    if (assignmentToEdit) {
      setFormData({
        course_id: assignmentToEdit.course_id,
        lecturer_id: assignmentToEdit.lecturer_id,
        role: assignmentToEdit.role,
      });
      setEditingId(id); // Set ID penugasan yang sedang diedit
    }
  };

  const handleDeleteCourseLecturer = async (id: string) => {
    const token = getToken();
    if (!token) {
      alert('Anda harus login untuk menghapus penugasan dosen kursus.');
      router.push('/login');
      return;
    }

    if (!id) {
      alert('ID penugasan tidak valid');
      return;
    }

    try {
      const isConfirmed = window.confirm('Apakah Anda yakin ingin menghapus penugasan ini?');
      if (!isConfirmed) return;

      const response = await api.delete(`/courseslecturers/${id}`);

      if (response.status === 200) {
        setCoursesLecturers((prev) => prev.filter((assignment) => assignment.id !== id));
        alert('Penugasan berhasil dihapus!');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Gagal menghapus penugasan.');
    }
  };

  if (!authReady) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-indigo-700 text-white transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex items-center justify-between p-4 border-b border-indigo-600">
          {isSidebarOpen && <h1 className="text-xl font-bold">Dashboard</h1>}
          <button onClick={toggleSidebar} className="p-1 rounded-lg hover:bg-indigo-600">
            {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
        <nav className="mt-6">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path} className="mb-2">
                <button
                  onClick={() => handleNavigate(item.path)}
                  className={`flex items-center w-full p-3 hover:bg-indigo-600 ${isSidebarOpen ? 'px-4' : 'justify-center'}`}
                >
                  {item.icon}
                  {isSidebarOpen && item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-2xl font-semibold text-gray-800">Penugasan Dosen Kursus</h1>
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">Halo, {user.name}</span>
                <button
                  onClick={logout}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="p-6">
          {/* Total Assignments Box */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-500">Total Penugasan</h3>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{coursesLecturers.length}</p>
          </div>

          {/* Course Lecturer Form */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{editingId ? 'Edit Penugasan' : 'Tugaskan Dosen ke Kursus'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="course_id" className="block text-sm font-medium text-gray-700 mb-1">Pilih Kursus</label>
                  <select
                    id="course_id"
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">-- Pilih Kursus --</option>
                    {courses.map((course) => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="lecturer_id" className="block text-sm font-medium text-gray-700 mb-1">Pilih Dosen</label>
                  <select
                    id="lecturer_id"
                    value={formData.lecturer_id}
                    onChange={(e) => setFormData({ ...formData, lecturer_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">-- Pilih Dosen --</option>
                    {lecturers.map((lecturer) => (
                      <option key={lecturer.lecturer_id} value={lecturer.lecturer_id}>
                        {lecturer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Peran</label>
                  <input
                    type="text"
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="misalnya, Dosen, Asisten Dosen"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                >
                  {loading ? (
                    <span>Loading...</span>
                  ) : (
                    <>
                      <FiSave className="mr-2" />
                      {editingId ? 'Perbarui Penugasan' : 'Tambah Penugasan'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Course Lecturer List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Daftar Dosen Kursus</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kursus</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosen</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coursesLecturers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-500">Tidak ada penugasan tersedia.</td>
                    </tr>
                  ) : (
                    coursesLecturers.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assignment.course?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.lecturer?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(assignment.id)}
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                            >
                              <FiEdit className="mr-1" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCourseLecturer(assignment.id)}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <FiTrash className="mr-1" /> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CoursesLecturersPage;
