'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import api, { errorStatus } from '@/lib/api';
import { useAuthGuard, logout } from '@/lib/auth';
import { getToken, getUser } from '@/lib/session';
import { FiMenu, FiX, FiBook, FiUser, FiUsers, FiAward, FiClipboard, FiEdit, FiTrash, FiSave } from 'react-icons/fi';

interface Student {
  student_id: string;
  name: string;
  email: string;
  NIM: string;
  major: string;
  enrollment_year: string; // Tetap tipe string, akan dikonversi saat pengiriman data
}

interface User {
  name: string;
}

const StudentsPage = () => {
  const router = useRouter();
  const authReady = useAuthGuard();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    NIM: '',
    major: '',
    enrollment_year: '' // Keep this as a string for easier handling
  });
  const [loading, setLoading] = useState(false);

  const menuItems = [
    { name: 'Dasbor', path: '', icon: <FiUsers className="mr-3" /> },
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
      const fetchStudents = async () => {
        const token = getToken();
        if (token) {
          try {
            const response = await api.get(`/student`);
            setStudents(response.data);
          } catch (error) {
            console.error('Error fetching students:', error);
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

      fetchStudents();
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

    const studentData: Record<string, string | number> = {};

    if (formData.name !== currentStudent?.name) studentData.name = formData.name;
    if (formData.email !== currentStudent?.email) studentData.email = formData.email;
    if (formData.NIM !== currentStudent?.NIM) studentData.NIM = formData.NIM;
    if (formData.major !== currentStudent?.major) studentData.major = formData.major;
    
    // Pastikan enrollment_year dikonversi menjadi number saat dikirim
    if (formData.enrollment_year !== currentStudent?.enrollment_year) {
      studentData.enrollment_year = Number(formData.enrollment_year);
    }

    if (Object.keys(studentData).length === 0) {
      alert('Tidak ada perubahan yang terdeteksi.');
      setLoading(false);
      return;
    }

    try {
      if (currentStudent) {
        const response = await api.put(`/student/${currentStudent.student_id}`,
          studentData
        );

        if (response.status === 200) {
          setStudents((prev) =>
            prev.map((student) =>
              student.student_id === currentStudent.student_id ? response.data.data : student
            )
          );
          alert('Siswa berhasil diperbarui!');
        }
      } else {
        const response = await api.post(`/student`,
          studentData
        );

        if (response.status === 201) {
          setStudents((prev) => [...prev, response.data.data]);
          alert('Siswa berhasil ditambahkan!');
        }
      }

      setFormData({ name: '', email: '', NIM: '', major: '', enrollment_year: '' });
      setCurrentStudent(null);
    } catch (error: unknown) {
      console.error('Error saving student:', error);
      if (errorStatus(error) === 422) {
        alert('Error validasi, harap periksa data input Anda.');
      } else {
        alert('Gagal menyimpan siswa.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    setFormData({
      name: student.name,
      email: student.email,
      NIM: student.NIM,
      major: student.major,
      enrollment_year: student.enrollment_year // Ensure enrollment year is set when editing
    });
    setCurrentStudent(student);
  };

  const handleDeleteStudent = async (id: string) => {
    const token = getToken();
    if (!token) {
      alert('Anda harus login untuk menghapus siswa.');
      router.push('/login');
      return;
    }

    if (!id) {
      alert('ID siswa tidak valid');
      return;
    }

    try {
      const isConfirmed = window.confirm('Apakah Anda yakin ingin menghapus siswa ini?');
      if (!isConfirmed) return;

      const response = await api.delete(`/student/${id}`);
      

      if (response.status === 200) {
        setStudents((prev) => prev.filter((student) => student.student_id !== id));
        alert('Siswa berhasil dihapus!');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Gagal menghapus siswa.');
    }
  };

  if (!authReady) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-indigo-700 text-white transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex items-center justify-between p-4 border-b border-indigo-600">
          {isSidebarOpen && <h1 className="text-xl font-bold">Dasbor</h1>}
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
            <h1 className="text-2xl font-semibold text-gray-800">Manajemen Siswa</h1>
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
          {/* Statistik Siswa */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-500">Total Siswa</h3>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{students.length}</p>
          </div>

          {/* Formulir Siswa */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {currentStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}
              </h2>
              {currentStudent && (
                <button
                  onClick={() => {
                    setFormData({ name: '', email: '', NIM: '', major: '', enrollment_year: '' });
                    setCurrentStudent(null);
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
                    placeholder="nama siswa"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="email siswa"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="NIM" className="block text-sm font-medium text-gray-700 mb-1">NIM</label>
                  <input
                    type="text"
                    id="NIM"
                    value={formData.NIM}
                    onChange={(e) => setFormData({ ...formData, NIM: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="NIM siswa(min 9)"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1">Jurusan</label>
                  <input
                    type="text"
                    id="major"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="jurusan siswa"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="enrollment_year" className="block text-sm font-medium text-gray-700 mb-1">Tahun Masuk</label>
                  <input
                    type="number"
                    id="enrollment_year"
                    value={formData.enrollment_year}
                    onChange={(e) => setFormData({ ...formData, enrollment_year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="tahun masuk"
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
                    <FiSave className="mr-2" />
                  )}
                  {currentStudent ? 'Perbarui Siswa' : 'Tambah Siswa'}
                </button>
              </div>
            </form>
          </div>

          {/* Daftar Siswa */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Daftar Siswa</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIM</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jurusan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahun Masuk</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-gray-500">Tidak ada siswa tersedia.</td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.student_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.NIM}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.major}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.enrollment_year}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center"
                            >
                              <FiEdit className="mr-1" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.student_id)}
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

export default StudentsPage;
