import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

type Role = 'technician' | 'manager' | 'expert';

const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_USER_POOL_ID,
  ClientId: import.meta.env.VITE_CLIENT_ID,
});

export const loginWithRole = (username: string, password: string, role: Role): Promise<string> => {
  return new Promise((resolve, reject) => {
    const authDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const idToken = session.getIdToken().getJwtToken();
        localStorage.setItem('authToken', idToken);
        localStorage.setItem('selectedRole', role);
        resolve(idToken);
      },
      onFailure: (err) => reject(err),
      newPasswordRequired: (userAttributes) => {
        delete userAttributes.email_verified;
        delete userAttributes.phone_number_verified;
        delete userAttributes.email;

        cognitoUser.completeNewPasswordChallenge(password, userAttributes, {
          onSuccess: (session) => {
            const idToken = session.getIdToken().getJwtToken();
            localStorage.setItem('authToken', idToken);
            localStorage.setItem('selectedRole', role);
            resolve(idToken);
          },
          onFailure: (err) => reject(err),
        });
      },
    });
  });
};

// Legacy login function (uses technician by default)
export const login = (username: string, password: string): Promise<string> => {
  return loginWithRole(username, password, 'technician');
};

export const logout = () => {
  const user = userPool.getCurrentUser();
  if (user) {
    user.signOut();
  }
  localStorage.removeItem('authToken');
  localStorage.removeItem('idToken');
  localStorage.removeItem('selectedRole');
};

export const getCurrentUser = () => {
  return userPool.getCurrentUser();
};

export const getIdToken = (): string | null => {
  return localStorage.getItem('authToken') || localStorage.getItem('idToken');
};

export const getSelectedRole = (): Role | null => {
  return localStorage.getItem('selectedRole') as Role | null;
};

/**
 * Decode JWT payload without verification (token already verified by Cognito).
 * Returns the custom:role claim from the current ID token.
 */
export const getUserRoleFromToken = (): string | null => {
  const token = getIdToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['custom:role'] || null;
  } catch {
    return null;
  }
};

/**
 * Check if a user's actual role (from JWT) is allowed to access a target role.
 * Admin can access all roles.
 */
export const isRoleAllowed = (userRole: string | null, targetRole: string): boolean => {
  if (!userRole) return true; // not logged in yet — allow (will be checked after login)
  if (userRole === 'admin') return true;
  return userRole === targetRole;
};

// Try to refresh the session silently. Returns fresh idToken or null.
export const refreshSession = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) { resolve(null); return; }
    user.getSession((err: Error | null, session: { isValid(): boolean; getIdToken(): { getJwtToken(): string } } | null) => {
      if (err || !session?.isValid()) { resolve(null); return; }
      const idToken = session.getIdToken().getJwtToken();
      localStorage.setItem('authToken', idToken);
      resolve(idToken);
    });
  });
};
