'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import api, { errorStatus } from '@/lib/api';
import { useAuthGuard, logout } from '@/lib/auth';
import { getToken, getUser } from '@/lib/session';
import { FiMenu, FiX, FiBook, FiUser, FiUsers, FiAward, FiClipboard, FiEdit, FiTrash, FiSave } from 'react-icons/fi';

interface Lecturer {
  lecturer_id: string;
  name: string;
  NIP: string;
  department: string;
  email: string;
}

interface User {
  name: string;
}

const LecturersPage = () => {
  const router = useRouter();
  const authReady = useAuthGuard();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [currentLecturer, setCurrentLecturer] = useState<Lecturer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    NIP: '',
    department: '',
    email: ''
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
      const fetchLecturers = async () => {
        const token = getToken();
        if (token) {
          try {
            const response = await api.get(`/lecturers`);
            setLecturers(response.data);
          } catch (error) {
            console.error('Error fetching lecturers:', error);
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

      fetchLecturers();
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

    const lecturerData: Record<string, string | number> = {};

    if (formData.name !== currentLecturer?.name) lecturerData.name = formData.name;
    if (formData.NIP !== currentLecturer?.NIP) lecturerData.NIP = formData.NIP;
    if (formData.department !== currentLecturer?.department) lecturerData.department = formData.department;
    if (formData.email !== currentLecturer?.email) lecturerData.email = formData.email;

    if (Object.keys(lecturerData).length === 0) {
      alert('Tidak ada perubahan yang terdeteksi.');
      setLoading(false);
      return;
    }

    try {
      if (currentLecturer) {
        const response = await api.put(`/lecturers/${currentLecturer.lecturer_id}`,
          lecturerData
        );

        if (response.status === 200) {
          setLecturers((prev) =>
            prev.map((lecturer) =>
              lecturer.lecturer_id === currentLecturer.lecturer_id ? response.data.data : lecturer
            )
          );
          alert('Dosen berhasil diperbarui!');
        }
      } else {
        const response = await api.post(`/lecturers`,
          lecturerData
        );

        if (response.status === 201) {
          setLecturers((prev) => [...prev, response.data.data]);
          alert('Dosen berhasil ditambahkan!');
        }
      }

      setFormData({ name: '', NIP: '', department: '', email: '' });
      setCurrentLecturer(null);
    } catch (error: unknown) {
      console.error('Error saving lecturer:', error);
      if (errorStatus(error) === 422) {
        alert('Error validasi, harap periksa data input Anda.');
      } else {
        alert('Gagal menyimpan dosen.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditLecturer = (lecturer: Lecturer) => {
    setFormData({
      name: lecturer.name,
      NIP: lecturer.NIP,
      department: lecturer.department,
      email: lecturer.email
    });
    setCurrentLecturer(lecturer);
  };

  const handleDeleteLecturer = async (id: string) => {
    const token = getToken();
    if (!token) {
      alert('Anda harus login untuk menghapus dosen.');
      router.push('/login');
      return;
    }

    if (!id) {
      alert('ID dosen tidak valid');
      return;
    }

    try {
      const isConfirmed = window.confirm('Apakah Anda yakin ingin menghapus dosen ini?');
      if (!isConfirmed) return;

      const response = await api.delete(`/lecturers/${id}`);

      if (response.status === 200) {
        setLecturers((prev) => prev.filter((lecturer) => lecturer.lecturer_id !== id));
        alert('Dosen berhasil dihapus!');
      }
    } catch (error) {
      console.error('Error deleting lecturer:', error);
      alert('Gagal menghapus dosen.');
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
            <h1 className="text-2xl font-semibold text-gray-800">Manajemen Dosen</h1>
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
          {/* Statistik Dosen */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-500">Total Dosen</h3>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{lecturers.length}</p>
          </div>

          {/* Formulir Dosen */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {currentLecturer ? 'Edit Dosen' : 'Tambah Dosen Baru'}
              </h2>
              {currentLecturer && (
                <button
                  onClick={() => {
                    setFormData({ name: '', NIP: '', department: '', email: '' });
                    setCurrentLecturer(null);
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
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="NIP" className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
                  <input
                    type="text"
                    id="NIP"
                    value={formData.NIP}
                    onChange={(e) => setFormData({ ...formData, NIP: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="1234567890"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Departemen</label>
                  <input
                    type="text"
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ilmu Komputer"
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
                    placeholder="johndoe@example.com"
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
                      {currentLecturer ? 'Perbarui Dosen' : 'Tambah Dosen'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Daftar Dosen */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Daftar Dosen</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departemen</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lecturers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-gray-500">Tidak ada dosen tersedia.</td>
                    </tr>
                  ) : (
                    lecturers.map((lecturer) => (
                      <tr key={lecturer.lecturer_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lecturer.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lecturer.NIP}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lecturer.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lecturer.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditLecturer(lecturer)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center"
                            >
                              <FiEdit className="mr-1" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteLecturer(lecturer.lecturer_id)}
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

export default LecturersPage;
