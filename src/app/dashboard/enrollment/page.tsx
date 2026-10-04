'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import api, { errorStatus } from '@/lib/api';
import { useAuthGuard, logout } from '@/lib/auth';
import { getToken, getUser } from '@/lib/session';
import { FiMenu, FiX, FiBook, FiUser, FiUsers, FiClipboard, FiEdit, FiTrash, FiSave ,FiAward} from 'react-icons/fi';

interface Course {
  course_id: string;
  name: string;
  code: string;
  credits: string;
  semester: string;
}

interface Student {
  student_id: string;
  name: string;
}

interface Enrollment {
  enrollment_id: string;
  student_id: string;
  course_id: string;
  student_name: string;
  course_name: string;
  status: string;
  grade: string | null;
  attendance: string | null;
}

interface User {
  name: string;
}

const EnrollmentPage = () => {
  const router = useRouter();
  const authReady = useAuthGuard();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    status: 'active',
    grade: '',
    attendance: ''
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  // Referensi ke fungsi pemuat data agar daftar bisa langsung diperbarui setelah simpan/hapus
  const fetchDataRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fetchData = async () => {
        if (getToken()) {
          try {
            const [studentsResponse, coursesResponse, enrollmentsResponse] = await Promise.all([
              api.get(`/student`),
              api.get(`/courses`),
              api.get(`/enrollment`)
            ]);

            const students = studentsResponse.data;
            const courses = coursesResponse.data;
            const newEnrollments = enrollmentsResponse.data.map((enrollment: Omit<Enrollment, 'student_name' | 'course_name'>) => ({
              ...enrollment,
              student_name: students.find((student: Student) => student.student_id === enrollment.student_id)?.name,
              course_name: courses.find((course: Course) => course.course_id === enrollment.course_id)?.name
            }));

            setStudents(students);
            setCourses(courses);
            setEnrollments(prevEnrollments => {
              const prevStr = JSON.stringify(prevEnrollments);
              const newStr = JSON.stringify(newEnrollments);
              return prevStr !== newStr ? newEnrollments : prevEnrollments;
            });
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

      fetchDataRef.current = fetchData;
      fetchData();
      fetchUserData();

      const intervalId = setInterval(fetchData, 5000); // auto-refresh tiap 5 detik
      return () => clearInterval(intervalId);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const grade = (formData.grade ?? '').trim().toUpperCase();
    const attendance = String(formData.attendance ?? '').trim();

    if (grade !== '' && !/^[A-F]$/.test(grade)) {
      alert('Harap masukkan nilai yang valid (A-F)');
      setLoading(false);
      return;
    }

    // Kehadiran boleh dikosongkan; jika diisi harus 0-100
    if (attendance !== '' && (isNaN(parseFloat(attendance)) || parseFloat(attendance) < 0 || parseFloat(attendance) > 100)) {
      alert('Harap masukkan persentase kehadiran yang valid (0-100)');
      setLoading(false);
      return;
    }

    const token = getToken();
    if (!token) {
      alert('Anda harus login untuk melakukan tindakan ini.');
      router.push('/login');
      setLoading(false);
      return;
    }

    const enrollmentData = {
      student_id: formData.student_id,
      course_id: formData.course_id,
      status: formData.status,
      grade: grade === '' ? null : grade,
      attendance: attendance === '' ? null : attendance
    };

    try {
      if (editingId) {
        const response = await api.put(`/enrollment/${editingId}`, enrollmentData);

        if (response.status === 200) {
          alert('Pendaftaran berhasil diperbarui!');
        }
      } else {
        const response = await api.post(`/enrollment`, enrollmentData);

        if (response.status === 201) {
          alert('Pendaftaran berhasil ditambahkan!');
        }
      }

      setFormData({ student_id: '', course_id: '', status: 'active', grade: '', attendance: '' });
      setEditingId(null);
      fetchDataRef.current?.();
    } catch (error: unknown) {
      console.error('Error saving enrollment:', error);
      if (errorStatus(error) === 409) {
        alert('Mahasiswa ini sudah terdaftar di mata kuliah tersebut.');
      } else if (errorStatus(error) === 422) {
        alert('Error validasi, harap periksa data input Anda.');
      } else {
        alert('Gagal menyimpan pendaftaran.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const enrollmentToEdit = enrollments.find((enrollment) => enrollment.enrollment_id === id);
    if (enrollmentToEdit) {
      setFormData({
        student_id: enrollmentToEdit.student_id,
        course_id: enrollmentToEdit.course_id,
        status: enrollmentToEdit.status,
        grade: enrollmentToEdit.grade ?? '',
        attendance: enrollmentToEdit.attendance ?? '',
      });
      setEditingId(id);
    }
  };

  const handleDeleteEnrollment = async (id: string) => {
    const token = getToken();
    if (!token) {
      alert('Anda harus login untuk menghapus pendaftaran.');
      router.push('/login');
      return;
    }

    try {
      const isConfirmed = window.confirm('Apakah Anda yakin ingin menghapus pendaftaran ini?');
      if (!isConfirmed) return;

      const response = await api.delete(`/enrollment/${id}`);

      if (response.status === 200) {
        setEnrollments((prev) => prev.filter((enrollment) => enrollment.enrollment_id !== id));
        alert('Pendaftaran berhasil dihapus!');
      }
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      alert('Gagal menghapus pendaftaran.');
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
            <h1 className="text-2xl font-semibold text-gray-800">Manajemen Pendaftaran</h1>
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
          {/* Total Enrollment */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-500">Total Pendaftaran</h3>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{enrollments.length}</p>
          </div>

          {/* Enrollment Form */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingId ? 'Edit Pendaftaran' : 'Tambah Pendaftaran Baru'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="student_id" className="block text-sm font-medium text-gray-700 mb-1">Siswa</label>
                  <select
                    id="student_id"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Pilih Siswa</option>
                    {students.map((student) => (
                      <option key={student.student_id} value={student.student_id}>{student.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="course_id" className="block text-sm font-medium text-gray-700 mb-1">Kursus</label>
                  <select
                    id="course_id"
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Pilih Kursus</option>
                    {courses.map((course) => (
                      <option key={course.course_id} value={course.course_id}>{course.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="active">Aktif</option>
                    <option value="completed">Selesai</option>
                    <option value="dropped">Dibatalkan</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">Nilai</label>
                  <input
                    type="text"
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="attendance" className="block text-sm font-medium text-gray-700 mb-1">Kehadiran</label>
                  <input
                    type="text"
                    id="attendance"
                    value={formData.attendance}
                    onChange={(e) => setFormData({ ...formData, attendance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                >
                  {loading ? <span>Loading...</span> : <><FiSave className="mr-2" />{editingId ? 'Perbarui Pendaftaran' : 'Tambah Pendaftaran'}</>}
                </button>
              </div>
            </form>
          </div>

          {/* Enrollment List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Daftar Pendaftaran</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Siswa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kursus</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enrollments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-gray-500">Tidak ada pendaftaran tersedia.</td>
                    </tr>
                  ) : (
                    enrollments.map((enrollment) => (
                      <tr key={enrollment.enrollment_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{enrollment.student_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{enrollment.course_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{enrollment.status}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{enrollment.grade}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(enrollment.enrollment_id)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center"
                            >
                              <FiEdit className="mr-1" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEnrollment(enrollment.enrollment_id)}
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

export default EnrollmentPage;
