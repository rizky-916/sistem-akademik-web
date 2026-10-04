'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthGuard, logout } from '@/lib/auth';
import { getToken, getUser, type SessionUser } from '@/lib/session';
import { FiMenu, FiX, FiBook, FiUsers, FiUser, FiAward, FiClipboard } from 'react-icons/fi';

const Dashboard = () => {
  const router = useRouter();
  const authReady = useAuthGuard();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [totalCourses, setTotalCourses] = useState(0); // State untuk menyimpan total kursus
  const [activeStudents, setActiveStudents] = useState(0); // State untuk menyimpan jumlah siswa aktif
  const [lecturers, setLecturers] = useState(0); // State untuk menyimpan jumlah dosen
  const [user, setUser] = useState<SessionUser | null>(null); // State untuk menyimpan data pengguna

  const menuItems = [
    { name: 'Dashboard', path: '', icon: <FiUsers className="mr-3" /> },  // Item Dashboard baru
    { name: 'Kursus', path: 'courses', icon: <FiBook className="mr-3" /> },
    { name: 'Dosen Kursus', path: 'courseslecturers', icon: <FiAward className="mr-3" /> },
    { name: 'Pendaftaran', path: 'enrollment', icon: <FiClipboard className="mr-3" /> },
    { name: 'Dosen', path: 'lecturers', icon: <FiUser className="mr-3" /> },
    { name: 'Siswa', path: 'students', icon: <FiUsers className="mr-3" /> },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavigate = (page: string) => {
    router.push(`/dashboard/${page}`);
  };

  // Mengambil data jumlah kursus, siswa aktif, dosen, dan data pengguna saat komponen dimuat
  useEffect(() => {
    const fetchData = async () => {
      const token = getToken(); // Mengambil token dari localStorage

      if (token) { // Hanya melakukan permintaan jika token ada
        try {
          // Mengambil jumlah Kursus
          const coursesResponse = await api.get('/courses');
          setTotalCourses(coursesResponse.data.length); // Menetapkan jumlah kursus

          // Mengambil jumlah Siswa Aktif
          const studentsResponse = await api.get('/student');
          setActiveStudents(studentsResponse.data.length); // Menetapkan siswa aktif

          // Mengambil jumlah Dosen
          const lecturersResponse = await api.get('/lecturers');
          setLecturers(lecturersResponse.data.length); // Menetapkan dosen
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      } else {
        console.log('Token tidak ditemukan, harap login');
      }
    };

    // Mengambil data pengguna dari localStorage
    const fetchUserData = () => {
      const sessionUser = getUser();
      if (sessionUser) {
        setUser(sessionUser);
      }
    };

    // Mengambil data saat komponen dimuat
    fetchData();
    fetchUserData();

    // Mengatur interval untuk memperbarui data setiap 30 detik (30000 ms)
    const intervalId = setInterval(() => {
      fetchData();
    }, 30000); // 30 detik

    // Membersihkan interval saat komponen dibongkar
    return () => clearInterval(intervalId);
  }, []); // Array kosong memastikan ini hanya dijalankan sekali saat pemuatan komponen

  if (!authReady) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div 
        className={`bg-indigo-700 text-white transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-indigo-600">
          {isSidebarOpen && (
            <h1 className="text-xl font-bold">Dashboard</h1>
          )}
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-lg hover:bg-indigo-600"
          >
            {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        <nav className="mt-6">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path} className="mb-2">
                <button
                  onClick={() => handleNavigate(item.path)}
                  className={`flex items-center w-full p-3 transition-colors duration-200 hover:bg-indigo-600 ${isSidebarOpen ? 'px-4' : 'justify-center'}`}
                >
                  {item.icon}
                  {isSidebarOpen && item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Konten Utama */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-2xl font-semibold text-gray-800">Selamat datang di Dashboard</h1>
            {/* Menampilkan nama pengguna */}
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">Halo, {user.name}</span> {/* Mengasumsikan 'name' tersedia di data pengguna */}
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Ikhtisar Cepat</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Kartu dashboard */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-medium text-blue-800">Total Kursus</h3>
                <p className="text-2xl font-bold mt-2">{totalCourses}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="font-medium text-green-800">Siswa Aktif</h3>
                <p className="text-2xl font-bold mt-2">{activeStudents}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="font-medium text-purple-800">Dosen</h3>
                <p className="text-2xl font-bold mt-2">{lecturers}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
