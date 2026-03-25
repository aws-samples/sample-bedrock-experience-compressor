import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Container,
  Box,
  SpaceBetween,
  Grid,
} from '@cloudscape-design/components';
import { getIdToken, getUserRoleFromToken, isRoleAllowed, logout } from '../services/auth';

export default function RoleSelection() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  const userRole = getUserRoleFromToken();
  const isLoggedIn = !!getIdToken();

  // Decode user name from JWT
  let userName = '';
  try {
    const token = getIdToken();
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userName = payload.name || payload['cognito:username'] || '';
    }
  } catch { /* ignore */ }

  const roleLabel = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : '';

  const roleColors: Record<string, string> = {
    technician: '#0972D3',
    expert: '#8B5CF6',
    manager: '#FF9900',
    admin: '#16A34A',
  };
  const userColor = roleColors[userRole || ''] || '#0972D3';

  useEffect(() => {
    // Trigger animation on mount
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleRoleSelection = (role: 'technician' | 'manager' | 'expert', path: string) => {
    if (!isLoggedIn) {
      // Not logged in — go to login with target role
      navigate('/login', { state: { targetRole: role, targetPath: path } });
    } else if (isRoleAllowed(userRole, role)) {
      // Logged in and role matches — navigate directly
      localStorage.setItem('selectedRole', role);
      navigate(path);
    } else {
      // Logged in but wrong role — logout and re-login for the correct role
      logout();
      navigate('/login', { state: { targetRole: role, targetPath: path } });
    }
  };

  const isCardDisabled = (roleId: string) => {
    if (!isLoggedIn) return false; // show all when not logged in
    return !isRoleAllowed(userRole, roleId);
  };

  const roles = [
    {
      id: 'technician',
      title: 'Augmented Technician',
      subtitle: 'Field Operations',
      color: '#0972D3',
      icon: '🔧',
      features: [
        'View assigned work orders',
        'Follow runbook procedures',
        'Submit intervention reports',
        'Rate & review procedures',
      ],
      path: '/technician/calendar',
      delay: 0,
    },
    {
      id: 'expert',
      title: 'Augmented Expert',
      subtitle: 'Procedure Optimization',
      color: '#8B5CF6',
      icon: '🎓',
      features: [
        'Review AI-generated proposals',
        'Approve or reject changes',
        'Auto-update procedures',
        'Compliance & safety review',
      ],
      path: '/expert/proposals',
      delay: 100,
    },
    {
      id: 'manager',
      title: 'Augmented Manager',
      subtitle: 'Operations Intelligence',
      color: '#FF9900',
      icon: '📊',
      features: [
        'Operational insights & KPIs',
        'Time & cost savings tracking',
        'Team performance overview',
        'Procedure updates monitoring',
      ],
      path: '/manager',
      delay: 200,
    },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0F1B2D 0%, #1A2942 50%, #0F1B2D 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      animation: 'fadeIn 0.6s ease-out',
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes gradientBorder {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      
      <div style={{ 
        maxWidth: '1200px', 
        width: '100%',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out',
      }}>
        <Container>
          <SpaceBetween size="l">
            {/* User info bar */}
            {isLoggedIn && userName && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '16px',
                padding: '4px 0',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#5f6b7a',
                }}>
                  <span style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: userColor,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '14px',
                  }}>
                    {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                  <span style={{ fontWeight: '600', color: '#000716' }}>{userName}</span>
                  <span style={{
                    padding: '2px 10px',
                    background: userColor,
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}>
                    {roleLabel}
                  </span>
                </div>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  style={{
                    padding: '6px 16px',
                    background: 'transparent',
                    border: '1px solid #d5dbdb',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#5f6b7a',
                    cursor: 'pointer',
                  }}
                >
                  Logout
                </button>
              </div>
            )}

            {/* Centered Header with Animation */}
            <div style={{ textAlign: 'center' }}>
              <img
                src="/logo.png"
                alt="Experience Compressor"
                style={{
                  width: '96px',
                  height: '96px',
                  margin: '0 auto 20px',
                  borderRadius: '20px',
                  boxShadow: '0 8px 24px rgba(255, 153, 0, 0.3)',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              <h1 style={{ 
                fontSize: '48px', 
                fontWeight: '800', 
                margin: '0 0 28px 0',
                color: '#000716',
              }}>
                Experience Compressor
              </h1>
              <p style={{ 
                fontSize: '18px', 
                color: '#5f6b7a',
                margin: '0 0 16px 0',
                fontWeight: '500',
              }}>
                Maintenance Intelligence Platform
              </p>
              <div style={{
                display: 'inline-flex',
                gap: '12px',
                marginTop: '8px',
              }}>
                <span style={{
                  padding: '6px 16px',
                  background: 'rgba(9, 114, 211, 0.1)',
                  border: '1px solid rgba(9, 114, 211, 0.3)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#0972D3',
                }}>
                  Powered by AWS AI
                </span>
              </div>
            </div>

            {/* Knowledge Cycle Diagram */}
            <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '28px 24px', border: '1px solid #E2E8F0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 20px', color: '#000716', textAlign: 'center' }}>
                How It Works
              </h2>
              {/* Manager wrapper */}
              <div style={{ border: '2px solid #FCD34D', borderRadius: '14px', padding: '16px 16px 12px', background: 'linear-gradient(180deg, #FFFBEB 0%, #FFF7ED 100%)', position: 'relative' }}>
                {/* Manager badge top-right */}
                <div style={{ position: 'absolute', top: '-16px', right: '20px', display: 'flex', alignItems: 'center', gap: '8px', background: '#F59E0B', borderRadius: '20px', padding: '5px 16px 5px 8px', boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}>
                  <div style={{ width: '26px', height: '26px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>👔</div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>Manager Overview</span>
                </div>
                {/* Main flow */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {/* Maintenance Tasks */}
                  <div style={{ textAlign: 'center', width: '90px' }}>
                    <div style={{ width: '50px', height: '50px', background: '#E2E8F0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto' }}>📋</div>
                    <div style={{ fontWeight: 600, fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Maintenance<br/>Tasks</div>
                  </div>
                  <div style={{ color: '#64748B', fontSize: '22px', fontWeight: 700 }}>→</div>
                  {/* Technician */}
                  <div style={{ textAlign: 'center', width: '100px' }}>
                    <div style={{ width: '58px', height: '58px', background: '#0972D3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto', boxShadow: '0 3px 10px rgba(9,114,211,0.3)' }}>🔧</div>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: '#0972D3', marginTop: '5px' }}>Technician</div>
                    <div style={{ fontSize: '10px', color: '#5f6b7a', marginTop: '1px' }}>Executes &<br/>follows runbook</div>
                  </div>
                  <div style={{ color: '#0972D3', fontWeight: 600, fontSize: '10px', textAlign: 'center' }}>📝 Intervention<br/>Report<br/><span style={{ fontSize: '16px' }}>→</span></div>
                  {/* AI + Expert box */}
                  <div style={{ background: 'white', borderRadius: '12px', padding: '10px 14px', border: '2px solid #DDD6FE', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ textAlign: 'center', width: '94px' }}>
                      <div style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 3px 10px rgba(139,92,246,0.3)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '12px', color: '#7C3AED', marginTop: '4px' }}>AI Engine</div>
                      <div style={{ fontSize: '10px', color: '#5f6b7a', lineHeight: '1.3' }}>Finds patterns<br/>& generates<br/>proposals</div>
                    </div>
                    <div style={{ color: '#8B5CF6', fontSize: '22px', fontWeight: 700 }}>→</div>
                    <div style={{ textAlign: 'center', width: '84px' }}>
                      <div style={{ width: '50px', height: '50px', background: '#8B5CF6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto', boxShadow: '0 3px 10px rgba(139,92,246,0.3)' }}>🎓</div>
                      <div style={{ fontWeight: 700, fontSize: '12px', color: '#7C3AED', marginTop: '4px' }}>Expert</div>
                      <div style={{ fontSize: '10px', color: '#5f6b7a', lineHeight: '1.3' }}>Reviews &<br/>validates</div>
                    </div>
                  </div>
                  <div style={{ color: '#0972D3', fontWeight: 600, fontSize: '10px', textAlign: 'center' }}>📖 Runbook<br/>Updated<br/><span style={{ fontSize: '16px' }}>→</span></div>
                  {/* Runbooks */}
                  <div style={{ textAlign: 'center', width: '94px' }}>
                    <div style={{ width: '58px', height: '58px', background: '#0972D3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto', boxShadow: '0 3px 10px rgba(9,114,211,0.3)' }}>📖</div>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: '#0972D3', marginTop: '5px' }}>Runbooks</div>
                    <div style={{ fontSize: '10px', color: '#5f6b7a', marginTop: '1px' }}>Improved<br/>procedures</div>
                  </div>
                </div>
                {/* Return arrow */}
                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#0972D3', fontWeight: 600 }}>
                  🔄 <em>Continuous improvement cycle</em>
                </div>
                {/* Manager KPI indicators */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #FCD34D' }}>
                  {[
                    { icon: '📋', label: 'Assigns tasks', sub: 'to technicians' },
                    { icon: '✅', label: 'Tracks validations', sub: 'from experts' },
                    { icon: '⏱️', label: 'Time saved', sub: 'per procedure' },
                    { icon: '💰', label: 'Cost savings', sub: 'operational ROI' },
                  ].map((kpi, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px' }}>{kpi.icon}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', marginTop: '2px' }}>{kpi.label}</div>
                      <div style={{ fontSize: '10px', color: '#92400E' }}>{kpi.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                margin: '0 0 8px 0',
                color: '#000716'
              }}>
                Select Your Role
              </h2>
              <p style={{ 
                fontSize: '15px', 
                color: '#5f6b7a',
                margin: 0,
                maxWidth: '600px',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}>
                AI-powered personas that amplify your expertise and accelerate knowledge sharing across industrial operations
              </p>
            </div>

            {/* Cards with Glassmorphism */}
            <Grid gridDefinition={[
              { colspan: { default: 12, s: 4 } },
              { colspan: { default: 12, s: 4 } },
              { colspan: { default: 12, s: 4 } },
            ]}>
              {roles.map((role) => {
                const disabled = isCardDisabled(role.id);
                return (
                <div
                  key={role.id}
                  onClick={() => !disabled && handleRoleSelection(role.id as 'technician' | 'manager' | 'expert', role.path)}
                  style={{
                    background: disabled
                      ? 'rgba(243, 244, 246, 0.8)'
                      : `linear-gradient(135deg, ${role.color}08, ${role.color}15)`,
                    backdropFilter: 'blur(10px)',
                    border: `2px solid ${disabled ? '#D1D5DB' : role.color}`,
                    borderRadius: '16px',
                    padding: '28px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: isVisible ? (disabled ? 0.6 : 1) : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                    transition: `all 0.5s ease-out ${role.delay}ms`,
                    textAlign: 'center',
                    minHeight: '340px',
                    boxShadow: disabled
                      ? 'none'
                      : `0 4px 20px ${role.color}20`,
                    position: 'relative' as const,
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled) {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = `0 12px 32px ${role.color}30`;
                      e.currentTarget.style.borderColor = role.color;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = `0 4px 20px ${role.color}20`;
                    }
                  }}
                >
                  {/* Gradient overlay on hover */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: disabled
                      ? 'transparent'
                      : `linear-gradient(90deg, ${role.color}, ${role.color}80, ${role.color})`,
                    backgroundSize: '200% 100%',
                  }} />

                  <SpaceBetween size="m">
                    {/* Icon with glow */}
                    <div style={{
                      width: '64px',
                      height: '64px',
                      background: disabled ? '#9CA3AF' : role.color,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      fontSize: '32px',
                      boxShadow: disabled ? 'none' : `0 8px 24px ${role.color}40`,
                      transition: 'all 0.3s ease',
                    }}>
                      {role.icon}
                    </div>

                    <div>
                      <h3 style={{ 
                        fontSize: '20px', 
                        fontWeight: '700', 
                        margin: '0 0 4px 0',
                        color: '#000716'
                      }}>
                        {role.title}
                      </h3>
                      <p style={{ 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#5f6b7a',
                        margin: 0
                      }}>
                        {role.subtitle}
                      </p>
                    </div>

                    {/* Feature list with better icons */}
                    <div style={{ textAlign: 'left', fontSize: '13px', padding: '0 8px' }}>
                      {role.features.map((feature, idx) => (
                          <div key={idx} style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            marginBottom: '8px',
                            gap: '10px',
                            color: '#414D5C',
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: role.color, flexShrink: 0 }} />
                            <span style={{ fontWeight: '500' }}>{feature}</span>
                          </div>
                      ))}
                    </div>

                    {/* Enhanced button */}
                    <button
                      style={{
                        width: '100%',
                        padding: '12px 24px',
                        background: disabled
                          ? '#9CA3AF'
                          : `linear-gradient(135deg, ${role.color}, ${role.color}CC)`,
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '15px',
                        marginTop: '8px',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        boxShadow: disabled ? 'none' : `0 4px 12px ${role.color}40`,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!disabled) {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = `0 6px 20px ${role.color}50`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!disabled) {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = `0 4px 12px ${role.color}40`;
                        }
                      }}
                    >
                      {disabled ? 'Access Denied' : 'Open Dashboard →'}
                    </button>
                  </SpaceBetween>
                </div>
                );
              })}
            </Grid>

            <Box textAlign="center" padding={{ top: 's' }}>
              <div style={{
                display: 'inline-flex',
                gap: '16px',
                fontSize: '13px',
                color: '#5f6b7a',
                fontWeight: '500',
              }}>
                <span>Enterprise Secure</span>
                <span>•</span>
                <span>AI-Powered Intelligence</span>
                <span>•</span>
                <span>Real-time Insights</span>
              </div>
            </Box>
          </SpaceBetween>
        </Container>
      </div>
    </div>
  );
}
