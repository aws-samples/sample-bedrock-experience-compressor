import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RoleSelection from './pages/RoleSelection';
import Login from './pages/Login';
import Calendar from './pages/technician/Calendar';
import TaskDetail from './pages/technician/TaskDetail';
import RunbookViewer from './pages/technician/RunbookViewer';
import ReportForm from './pages/technician/ReportForm';
import ViewReport from './pages/technician/ViewReport';
import ProposalsList from './pages/expert/ProposalsList';
import ProposalDetail from './pages/expert/ProposalDetail';
import Dashboard from './pages/manager/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/role-selection" 
          element={
            <ProtectedRoute>
              <RoleSelection />
            </ProtectedRoute>
          } 
        />
        
        {/* Technician Routes */}
        <Route
          path="/technician/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/technician/tasks/:id"
          element={
            <ProtectedRoute>
              <TaskDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/technician/tasks/:id/runbook"
          element={
            <ProtectedRoute>
              <RunbookViewer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/technician/tasks/:id/complete"
          element={
            <ProtectedRoute>
              <ReportForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/technician/tasks/:id/report"
          element={
            <ProtectedRoute>
              <ViewReport />
            </ProtectedRoute>
          }
        />

        {/* Expert Routes */}
        <Route
          path="/expert/proposals"
          element={
            <ProtectedRoute>
              <ProposalsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expert/proposals/:id"
          element={
            <ProtectedRoute>
              <ProposalDetail />
            </ProtectedRoute>
          }
        />

        {/* Manager Routes */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
