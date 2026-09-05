import React, { useState, useEffect } from 'react';
import Onboarding from './components/onboarding/Onboarding';
import Dashboard from './components/dashboard/Dashboard';
import MissionIDE from './components/mission/MissionIDE';
import Passport from './components/passport/Passport';
import LogicPractice from './components/practice/LogicPractice';
import CareerVault from './components/career/CareerVault';
import AdminCenter from './components/admin/AdminCenter';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import VerifyEmail from './components/auth/VerifyEmail';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import AuthSuccess from './components/auth/AuthSuccess';
import OnboardingWizard from './components/auth/OnboardingWizard';
import AccountSettings from './components/settings/AccountSettings';
import Sidebar from './components/layout/Sidebar';

import { 
  ShieldAlert
} from 'lucide-react';

import LearnHub from './components/learn/LearnHub';
import LessonViewer from './components/learn/LessonViewer';
import { apiFetch } from './api/client';

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [sessionId, setSessionId] = useState('');

  const [activeTab, setActiveTab] = useState('overview');
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [missionCompleted, setMissionCompleted] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [hashPath, setHashPath] = useState('');

  // URL Hash routing listener
  useEffect(() => {
    const handleHashChange = () => {
      const fullHash = window.location.hash || '#';
      const cleanHash = fullHash.split('?')[0];
      setHashPath(cleanHash);
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch users list (RBAC authorized)
  const fetchUsers = async () => {
    const token = accessToken || localStorage.getItem('atlas_access_token');
    if (!token) return;
    try {
      const res = await apiFetch('/users', { token });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Failed to fetch users directory:', err);
    }
  };

  // Check localStorage and restore session on boot
  useEffect(() => {
    const restoreSession = async () => {
      const savedRefreshToken = localStorage.getItem('atlas_refresh_token');
      const savedSessionId = localStorage.getItem('atlas_session_id');
      const savedMission = localStorage.getItem('atlas_mission_completed');

      if (savedMission === 'true') {
        setMissionCompleted(true);
      }

      if (!savedRefreshToken) {
        const currentHash = window.location.hash.split('?')[0];
        if (!['#register', '#forgot-password', '#reset-password', '#verify-email', '#keypad', '#auth-success'].includes(currentHash)) {
          window.location.hash = '#login';
        }
        return;
      }

      try {
        const res = await apiFetch('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: savedRefreshToken })
        });

        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.accessToken);
          setRefreshToken(savedRefreshToken);
          setSessionId(savedSessionId);
          localStorage.setItem('atlas_access_token', data.accessToken);

          // Get User data
          const meRes = await apiFetch('/auth/me', {
            token: data.accessToken
          });

          if (meRes.ok) {
            const meData = await meRes.json();
            setUser(meData.user);
            setProfile(meData.profile);
            
            if (meData.user.code_quality === 94) {
              setMissionCompleted(true);
            }
          } else {
            handleResetSession();
          }
        } else {
          handleResetSession();
        }
      } catch (err) {
        console.error('Session restoration failed:', err);
      }
    };

    restoreSession();
  }, []);

  // Sync users list if admin route loaded
  useEffect(() => {
    if ((hashPath === '#admin' || window.location.pathname === '/admin') && accessToken) {
      fetchUsers();
    }
  }, [hashPath, accessToken]);

  const handleLoginSuccess = (data) => {
    setUser(data.user);
    setProfile(data.profile);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setSessionId(data.sessionId);

    localStorage.setItem('atlas_refresh_token', data.refreshToken);
    localStorage.setItem('atlas_access_token', data.accessToken);
    localStorage.setItem('atlas_session_id', data.sessionId);

    if (data.user.code_quality === 94) {
      setMissionCompleted(true);
    } else {
      setMissionCompleted(false);
    }

    // Determine onboarding redirect
    const isNew = !data.profile || !data.profile.experience || !data.profile.tech_stack;
    if (isNew) {
      window.location.hash = '#onboarding-wizard';
    } else {
      const isStaff = ['admin', 'super admin', 'mentor', 'guider'].includes(data.user.role?.toLowerCase());
      if (isStaff) {
        window.location.hash = '#admin';
      } else {
        window.location.hash = '';
      }
    }
  };

  const handleOnboardingComplete = async (userData) => {
    // Student keypad onboarding: registers temporary password and verifies email automatically
    try {
      const randomId = Math.random().toString(36).substr(2, 9);
      const email = `${userData.callsign.toLowerCase()}_${randomId}@atlas.dev`;
      const username = userData.callsign.toLowerCase() + '_' + randomId.substr(0, 3);
      const password = 'PassWord123!_keypad';

      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          username,
          password,
          full_name: userData.callsign,
          career_goal: 'Keypad Bypass Student',
          learning_track: userData.path
        })
      });

      if (res.ok) {
        const regData = await res.json();
        // Invalidate email verification automatically
        await apiFetch('/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token: regData.verifyToken })
        });

        // Log in
        const logRes = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ loginId: username, password })
        });

        if (logRes.ok) {
          const logData = await logRes.json();
          handleLoginSuccess(logData);
        }
      }
    } catch (err) {
      console.error('Keypad Onboarding failed:', err);
    }
  };

  const handleOnboardingWizardComplete = (updatedProfile) => {
    setProfile(updatedProfile);
    window.location.hash = ''; // Return to dashboard
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const res = await apiFetch(`/users/${userId}/role`, {
        method: 'PUT',
        token: accessToken,
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        fetchUsers();
        // If we updated ourselves, reload profile
        if (userId === user.id) {
          const selfRes = await apiFetch('/auth/me', {
            token: accessToken
          });
          if (selfRes.ok) {
            const selfData = await selfRes.json();
            setUser(selfData.user);
          }
        }
      } else {
        const err = await res.json();
        alert(`Update rejected: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteMission = (updatedUser) => {
    setMissionCompleted(true);
    setUser(updatedUser);
    localStorage.setItem('atlas_mission_completed', 'true');
  };

  const handleResetSession = async () => {
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ sessionId, refreshToken })
      });
    } catch (err) {
      console.error(err);
    }

    setUser(null);
    setProfile(null);
    setAccessToken('');
    setRefreshToken('');
    setSessionId('');
    setMissionCompleted(false);
    setActiveTab('overview');
    setActiveLessonId(null);
    window.location.hash = '#login';

    localStorage.removeItem('atlas_refresh_token');
    localStorage.removeItem('atlas_access_token');
    localStorage.removeItem('atlas_session_id');
    localStorage.removeItem('atlas_mission_completed');
  };

  // -------------------------------------------------------------
  // Unauthenticated Hash Router Routing
  // -------------------------------------------------------------
  if (!user) {
    if (hashPath === '#register') {
      return (
        <div className="onboarding-root">
          <div className="subtle-grid"></div>
          <Register onNavigateToLogin={() => window.location.hash = '#login'} />
        </div>
      );
    }
    if (hashPath === '#auth-success') {
      return (
        <AuthSuccess 
          onLoginSuccess={(data) => {
            handleLoginSuccess(data);
            window.location.hash = ''; // clear hash to force dashboard view
          }} 
        />
      );
    }
    if (hashPath === '#forgot-password') {
      return (
        <div className="onboarding-root">
          <div className="subtle-grid"></div>
          <ForgotPassword onNavigateToLogin={() => window.location.hash = '#login'} />
        </div>
      );
    }
    if (hashPath === '#reset-password') {
      return (
        <div className="onboarding-root">
          <div className="subtle-grid"></div>
          <ResetPassword onNavigateToLogin={() => window.location.hash = '#login'} />
        </div>
      );
    }
    if (hashPath === '#verify-email') {
      return (
        <div className="onboarding-root">
          <div className="subtle-grid"></div>
          <VerifyEmail onNavigateToLogin={() => window.location.hash = '#login'} />
        </div>
      );
    }
    if (hashPath === '#keypad') {
      return (
        <Onboarding 
          onComplete={handleOnboardingComplete} 
          onLogin={handleLoginSuccess} 
        />
      );
    }
    // Default Login
    return (
      <div className="onboarding-root">
        <div className="subtle-grid"></div>
        <Login 
          onLoginSuccess={handleLoginSuccess}
          onNavigateToRegister={() => window.location.hash = '#register'}
          onNavigateToForgot={() => window.location.hash = '#forgot-password'}
          onNavigateToStudentKeypad={() => window.location.hash = '#keypad'}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // Authenticated Views Routing
  // -------------------------------------------------------------
  if (hashPath === '#onboarding-wizard') {
    return (
      <div className="onboarding-root">
        <div className="subtle-grid"></div>
        <OnboardingWizard 
          user={user} 
          accessToken={accessToken} 
          onComplete={handleOnboardingWizardComplete} 
        />
      </div>
    );
  }

  if (hashPath === '#admin' || window.location.pathname === '/admin') {
    const isStaff = ['admin', 'super admin', 'mentor', 'guider'].includes(user.role?.toLowerCase());
    if (!isStaff) {
      return (
        <div className="onboarding-root">
          <div className="onboarding-panel glass-panel text-center">
            <ShieldAlert className="neon-red" size={48} style={{ margin: '0 auto 16px' }} />
            <h2>403 Forbidden</h2>
            <p className="font-mono" style={{ margin: '16px 0 24px' }}>ACCESS DENIED: Administrative security clearance required.</p>
            <button onClick={() => window.location.hash = ''} className="neon-btn secondary font-sans w-full">Return to Dashboard</button>
          </div>
        </div>
      );
    }

    return (
      <AdminCenter 
        user={user} 
        usersList={usersList} 
        onUpdateUserRole={handleUpdateUserRole}
        onResetSession={handleResetSession}
        onBackToPortal={() => {
          if (window.location.pathname === '/admin') {
            window.location.href = '/';
          } else {
            window.location.hash = '';
          }
        }}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onNavigate={(tab) => { setActiveTab(tab); setActiveLessonId(null); }}
        user={user}
        profile={profile}
        onAdmin={() => { window.location.hash = '#admin'; }}
        onResetSession={handleResetSession}
      />

      {/* Primary Workspaces Content */}
      <main className="content-wrapper">
        {activeTab === 'overview' && (
          <Dashboard
            accessToken={accessToken}
            missionCompleted={missionCompleted}
            onNavigateToIDE={() => setActiveTab('ide')}
            onNavigateToPractice={() => setActiveTab('practice')}
            onNavigateToPassport={() => setActiveTab('passport')}
            onNavigateToCareer={() => setActiveTab('career')}
            onNavigateToSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'learn' && !activeLessonId && (
          <LearnHub 
            accessToken={accessToken}
            onNavigateToLesson={(lessonId) => setActiveLessonId(lessonId)}
          />
        )}

        {activeTab === 'learn' && activeLessonId && (
          <LessonViewer 
            lessonId={activeLessonId}
            accessToken={accessToken}
            onBack={() => setActiveLessonId(null)}
          />
        )}

        {activeTab === 'ide' && (
          <MissionIDE 
            user={user}
            accessToken={accessToken}
            missionCompleted={missionCompleted} 
            onCompleteMission={handleCompleteMission} 
          />
        )}

        {activeTab === 'practice' && (
          <LogicPractice />
        )}

        {activeTab === 'passport' && (
          <Passport 
            user={user} 
            profile={profile}
            accessToken={accessToken}
            missionCompleted={missionCompleted} 
          />
        )}

        {activeTab === 'career' && (
          <CareerVault 
            user={user} 
            profile={profile}
            accessToken={accessToken}
            missionCompleted={missionCompleted}
            onNavigateToLearn={() => setActiveTab('learn')}
            onNavigateToIDE={() => setActiveTab('ide')}
            onNavigateToPassport={() => setActiveTab('passport')}
            onNavigateToSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'settings' && (
          <AccountSettings 
            user={user}
            profile={profile}
            accessToken={accessToken}
            onLogout={handleResetSession}
            onUpdateProfile={setProfile}
          />
        )}
      </main>
    </div>
  );
}

export default App;
