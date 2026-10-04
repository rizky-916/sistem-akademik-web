'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import api, { errorStatus } from '@/lib/api';
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

interface User {
  name: string;
}

const CoursesPage = () => {
  const router = useRouter();
  const authReady = useAuthGuard();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: '',
    semester: ''
  });
  const [loading, setLoading] = useState(false);

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
      const fetchCourses = async () => {
        const token = getToken();
        if (token) {
          try {
            const response = await api.get(`/courses`);
            setCourses(response.data);
          } catch (error) {
            console.error('Error fetching courses:', error);
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

      fetchCourses();
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

    const courseData: Record<string, string | number> = {};

    if (formData.name !== currentCourse?.name) courseData.name = formData.name;
    if (formData.code !== currentCourse?.code) courseData.code = formData.code;
    if (formData.credits !== currentCourse?.credits) courseData.credits = formData.credits;
    if (formData.semester !== currentCourse?.semester) courseData.semester = formData.semester;

    if (Object.keys(courseData).length === 0) {
      alert('Tidak ada perubahan yang terdeteksi.');
      setLoading(false);
      return;
    }

    try {
      if (currentCourse) {
        const response = await api.put(`/courses/${currentCourse.course_id}`,
          courseData
        );

        if (response.status === 200) {
          setCourses((prev) =>
            prev.map((course) =>
              course.course_id === currentCourse.course_id ? response.data.data : course
            )
          );
          alert('Kursus berhasil diperbarui!');
        }
      } else {
        const response = await api.post(`/courses`,
          courseData
        );

        if (response.status === 201) {
          setCourses((prev) => [...prev, response.data.data]);
          alert('Kursus berhasil ditambahkan!');
        }
      }

      setFormData({ name: '', code: '', credits: '', semester: '' });
      setCurrentCourse(null);
    } catch (error: unknown) {
      console.error('Error saving course:', error);
      if (errorStatus(error) === 422) {
        alert('Error validasi, harap periksa data input Anda.');
      } else {
        alert('Gagal menyimpan kursus.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourse = (course: Course) => {
    setFormData({
      name: course.name,
      code: course.code,
      credits: course.credits,
      semester: course.semester
    });
    setCurrentCourse(course);
  };

  const handleDeleteCourse = async (id: string) => {
    const token = getToken();
    if (!token) {
      alert('Anda harus login untuk menghapus kursus.');
      router.push('/login');
      return;
    }

    if (!id) {
      alert('ID kursus tidak valid');
      return;
    }

    try {
      const isConfirmed = window.confirm('Apakah Anda yakin ingin menghapus kursus ini?');
      if (!isConfirmed) return;

      const response = await api.delete(`/courses/${id}`);

      if (response.status === 200) {
        setCourses((prev) => prev.filter((course) => course.course_id !== id));
        alert('Kursus berhasil dihapus!');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Gagal menghapus kursus.');
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
            <h1 className="text-2xl font-semibold text-gray-800">Manajemen Kursus</h1>
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
          {/* Course Stats */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-500">Total Kursus</h3>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{courses.length}</p>
          </div>

          {/* Course Form */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {currentCourse ? 'Edit Kursus' : 'Tambah Kursus Baru'}
              </h2>
              {currentCourse && (
                <button
                  onClick={() => {
                    setFormData({ name: '', code: '', credits: '', semester: '' });
                    setCurrentCourse(null);
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Masukkan nama kursus"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">Kode</label>
                  <input
                    type="text"
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Masukkan kode kursus"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="credits" className="block text-sm font-medium text-gray-700 mb-1">SKS</label>
                  <input
                    type="text"
                    id="credits"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Masukkan jumlah SKS"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <input
                    type="text"
                    id="semester"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Masukkan semester"
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
                      {currentCourse ? 'Perbarui Kursus' : 'Tambah Kursus'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Course List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Daftar Kursus</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-gray-500">Tidak ada kursus tersedia.</td>
                    </tr>
                  ) : (
                    courses.map((course) => (
                      <tr key={course.course_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.credits}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.semester}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditCourse(course)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center"
                            >
                              <FiEdit className="mr-1" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.course_id)}
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

export default CoursesPage;
