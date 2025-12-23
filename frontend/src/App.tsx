import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import AdminDashboard from "./pages/AdminDashboard";
import AppointmentListPage from "./pages/AppointmentListPage";
import CreateAppointmentPage from "./pages/CreateAppointmentPage";
import EditProfilePage from "./pages/EditProfilePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import PatientListPage from "./pages/PatientListPage";
import PatientRecordDetailsPage from "./pages/PatientRecordDetailsPage";
import SignupPage from "./pages/SignupPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";

const App = () => {

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/admin" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AppointmentListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments/create"
            element={
              <ProtectedRoute roles={["admin"]}>
                <CreateAppointmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute roles={["admin"]}>
                <PatientListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <ProtectedRoute roles={["admin"]}>
                <PatientRecordDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute roles={["admin"]}>
                <EditProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute roles={["admin"]}>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
