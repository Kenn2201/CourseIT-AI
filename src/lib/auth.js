import { Account, ID, OAuthProvider } from 'appwrite';
import { client, isAppwriteConfigured } from './appwriteClient.js';

const runtimeEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const AUTH_STORAGE_KEY = 'courseit_auth_session';
export const ADMIN_EMAIL = runtimeEnv.VITE_ADMIN_EMAIL || runtimeEnv.ADMIN_EMAIL || '';

export let account = null;

export function ensureAccount() {
  if (!account && client) {
    try {
      account = new Account(client);
    } catch (err) {
      console.warn('Appwrite Account init error:', err);
    }
  }
  return account;
}

ensureAccount();

/**
 * Checks current stored auth state
 */
export function getAuthState() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { isAuthenticated: false, isAdmin: false, user: null, quota: null };
    const parsed = JSON.parse(raw);
    const isAdmin = Boolean(ADMIN_EMAIL && parsed?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    return {
      isAuthenticated: Boolean(parsed?.isAuthenticated),
      isAdmin,
      user: parsed?.user || null,
      quota: parsed?.quota || null
    };
  } catch {
    return { isAuthenticated: false, isAdmin: false, user: null, quota: null };
  }
}

/**
 * Formats authentication and network errors into clear actionable messages,
 * specifically identifying Appwrite Web Platform CORS allowlist restrictions.
 */
export function formatAuthError(err) {
  if (!err) return 'An unknown authentication error occurred.';
  const msg = err.message || String(err);
  if (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('Network request failed') ||
    msg.includes('CORS') ||
    msg.includes('blocked by CORS')
  ) {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'courseitai.kenncode.me';
    return `Appwrite CORS Restriction: Hostname "${hostname}" is not registered as an authorized Web Platform in Appwrite Cloud. In your Appwrite Console (syd.cloud.appwrite.io), open your project, go to Overview > Platforms > Add Platform > Web App, and enter "${hostname}".`;
  }
  return msg;
}

/**
 * Signup with Appwrite Email/Password.
 * Registers the user, creates quota with status 'pending', and DOES NOT log in.
 */
export async function signupWithEmail(name, email, password) {
  const acc = ensureAccount();
  if (!acc) {
    throw new Error('Appwrite Account service is not initialized. Please ensure VITE_APPWRITE_PROJECT_ID is set in your Netlify Environment Variables and re-deploy your site.');
  }

  const userId = ID.unique();
  
  // 1. Create Appwrite Auth user
  let newUser;
  try {
    newUser = await acc.create(userId, email, password, name);
  } catch (err) {
    throw new Error(formatAuthError(err));
  }

  // 2. Prove ownership of the new account before creating its quota record.
  let temporarySession = false;
  try {
    await acc.createEmailPasswordSession(email, password);
    temporarySession = true;
    const sessionUser = await acc.get();
    if (sessionUser.$id !== newUser.$id) throw new Error('New account session did not match the created account.');
    const { jwt } = await acc.createJWT();
    const response = await fetch('/api/user/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-appwrite-jwt': jwt },
      body: '{}'
    });
    if (!response.ok) throw new Error('Registration service rejected the access request.');
  } catch (err) {
    throw new Error('Account created, but the access request could not be registered. Sign in to check your account status.');
  } finally {
    if (temporarySession) {
      try { await acc.deleteSession('current'); } catch {}
    }
    cachedJwt = null;
    jwtExpiry = 0;
  }

  // 3. Return exact required success message without logging in
  return {
    success: true,
    message: 'Account created. Your access request is pending approval; watch your inbox for an update.',
    user: newUser
  };
}

/**
 * Log in via Appwrite Email and Password
 */
export async function loginWithEmail(email, password) {
  const acc = ensureAccount();
  if (!acc) {
    throw new Error('Appwrite Account service is not initialized. Please ensure VITE_APPWRITE_PROJECT_ID is set in your Netlify Environment Variables and re-deploy your site.');
  }

  try {
    // Clear any lingering active session to prevent session collision
    try {
      await acc.deleteSession('current');
    } catch (_) {}

    // 1. Create email password session
    await acc.createEmailPasswordSession(email, password);
    const user = await acc.get();
    const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    // 2. Check quota & approval status
    let quota = null;
    try {
      const quotaRes = await fetchSessionQuota();
      const quotaData = await quotaRes.json();
      if (quotaData.success) {
        quota = quotaData.quota;
      }
    } catch (qErr) {
      console.warn('Could not fetch user quota:', qErr.message);
    }

    // 3. Keep user authenticated with pending status (0 credits until approved)
    const authState = {
      isAuthenticated: true,
      isAdmin,
      user: {
        id: user.$id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        emailVerification: user.emailVerification === true
      },
      quota
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    return authState;
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}

/**
 * OAuth2 Token Flow for Google
 */
export async function signInWithGoogle() {
  const acc = ensureAccount();
  if (!acc) throw new Error('Appwrite client is not configured. Please check VITE_APPWRITE_PROJECT_ID.');
  const success = `${window.location.origin}/auth/success`;
  const failure = `${window.location.origin}/auth/failure`;

  await acc.createOAuth2Token(
    OAuthProvider.Google,
    success,
    failure
  );
}

/**
 * OAuth2 Token Flow for GitHub
 */
export async function signInWithGithub() {
  const acc = ensureAccount();
  if (!acc) throw new Error('Appwrite client is not configured. Please check VITE_APPWRITE_PROJECT_ID.');
  const success = `${window.location.origin}/auth/success`;
  const failure = `${window.location.origin}/auth/failure`;

  await acc.createOAuth2Token(
    OAuthProvider.Github,
    success,
    failure
  );
}

/**
 * Handles OAuth2 Success Callback (/auth/success)
 */
export async function handleOAuthSuccess(userId, secret) {
  const acc = ensureAccount();
  if (!acc) throw new Error('Appwrite client is not configured. Please check VITE_APPWRITE_PROJECT_ID.');

  let user = null;
  // 1. Check if session already exists
  try {
    user = await acc.get();
  } catch {
    // 2. No session yet, create session using token secret
    if (!userId || !secret) throw new Error('Missing OAuth credentials');
    try {
      await acc.createSession(userId, secret);
      user = await acc.get();
    } catch (err) {
      try {
        user = await acc.get();
      } catch {
        throw err;
      }
    }
  }

  if (!user) throw new Error('Failed to retrieve user profile after OAuth authentication');
  const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Register in quota system or fetch existing
  let quota = null;
  try {
    const qRes = await fetchSessionQuota();
    const qData = await qRes.json();
    if (qData.success) {
      quota = qData.quota;
    }
  } catch {}

  const authState = {
    isAuthenticated: true,
    isAdmin,
    user: {
      id: user.$id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      emailVerification: user.emailVerification === true
    },
    quota
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  return authState;
}

/** Request a real Appwrite recovery link to the site's registered origin. */
export async function requestPasswordReset(email) {
  const acc = ensureAccount();
  if (!acc) throw new Error('Authentication is unavailable. Please try again later.');
  await acc.createRecovery(email.trim(), `${window.location.origin}/auth/recover`);
  return { success: true };
}

export async function completePasswordReset(userId, secret, password) {
  const acc = ensureAccount();
  if (!acc) throw new Error('Authentication is unavailable. Please try again later.');
  await acc.updateRecovery(userId, secret, password);
  return { success: true };
}

export async function requestEmailVerification() {
  const acc = ensureAccount();
  if (!acc) throw new Error('Authentication is unavailable. Please try again later.');
  const current = await acc.get();
  if (current.emailVerification) return { alreadyVerified: true };
  await acc.createVerification(`${window.location.origin}/auth/verify`);
  return { alreadyVerified: false };
}

export async function completeEmailVerification(userId, secret) {
  const acc = ensureAccount();
  if (!acc) throw new Error('Authentication is unavailable. Please try again later.');
  await acc.updateVerification(userId, secret);
  return checkAppwriteSession();
}

/**
 * Check active Appwrite session upon redirect / page reload
 */
export async function checkAppwriteSession() {
  const acc = ensureAccount();
  if (!acc) return getAuthState();

  try {
    const user = await acc.get();
    if (user) {
      const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      // Fetch fresh quota
      let quota = null;
      try {
        const quotaRes = await fetchSessionQuota();
        const quotaData = await quotaRes.json();
        if (quotaData.success) {
          quota = quotaData.quota;
        }
      } catch {}

      // Keep user authenticated even if pending; pending state is handled via quota.status
      const authState = {
        isAuthenticated: true,
        isAdmin,
        user: {
          id: user.$id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          emailVerification: user.emailVerification === true,
          prefs: user.prefs || {}
        },
        quota
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
      return authState;
    }
  } catch (err) {
    // Verified unauthenticated: strictly purge stale cached session to prevent desync or identity leak
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('courseit_admin_mode');
    } catch {}
    cachedJwt = null;
    jwtExpiry = 0;
    return { isAuthenticated: false, isAdmin: false, user: null, quota: null };
  }

  return { isAuthenticated: false, isAdmin: false, user: null, quota: null };
}

let cachedJwt = null;
let jwtExpiry = 0;

/**
 * Creates or retrieves a valid Appwrite session JWT for server-side verification
 */
async function fetchSessionQuota() {
  const acc = ensureAccount();
  const { jwt } = await acc.createJWT();
  return fetch('/api/user/quota', { headers: { 'x-appwrite-jwt': jwt } });
}

export async function getAuthJwt() {
  const authState = getAuthState();
  const acc = ensureAccount();
  if (!authState.isAuthenticated || !authState.user?.id || !acc || !isAppwriteConfigured()) {
    return null;
  }

  const now = Date.now();
  // Return cached JWT if still fresh (Appwrite JWTs last 15 min; we cache for 10 min)
  if (cachedJwt && jwtExpiry > now) {
    return cachedJwt;
  }

  try {
    const res = await acc.createJWT();
    if (res && res.jwt) {
      cachedJwt = res.jwt;
      jwtExpiry = now + 10 * 60 * 1000;
      return cachedJwt;
    }
  } catch (err) {
    // Unauthenticated/guest session: clear cached JWT silently
    cachedJwt = null;
    jwtExpiry = 0;
  }
  return null;
}

/**
 * Universal authenticated fetch helper: automatically attaches verified session JWT only when authenticated
 */
export async function authenticatedFetch(url, options = {}) {
  const authState = getAuthState();
  const headers = { ...(options.headers || {}) };

  const normalizeAuthHeaderValue = (value) => {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    if (!text || ['null', 'undefined', 'Bearer', 'Bearer null', 'Bearer undefined'].includes(text)) {
      return null;
    }
    return text;
  };

  const rawJwt = normalizeAuthHeaderValue(headers['x-appwrite-jwt'] || headers['X-Appwrite-JWT']);
  if (!rawJwt || rawJwt === 'null' || rawJwt === 'undefined') {
    delete headers['x-appwrite-jwt'];
    delete headers['X-Appwrite-JWT'];
  }

  const rawAuth = normalizeAuthHeaderValue(headers.authorization || headers.Authorization);
  if (!rawAuth || rawAuth === 'null' || rawAuth === 'undefined') {
    delete headers.authorization;
    delete headers.Authorization;
  }

  // Strictly skip JWT creation for guests and unauthenticated visitors.
  if (authState.isAuthenticated && authState.user?.id) {
    const jwt = await getAuthJwt();
    if (!jwt) throw new Error('Your session expired. Sign in again.');
    headers['x-appwrite-jwt'] = jwt;
    headers.authorization = `Bearer ${jwt}`;
  } else {
    delete headers['x-appwrite-jwt'];
    delete headers['X-Appwrite-JWT'];
    delete headers.authorization;
    delete headers.Authorization;
  }

  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Log out current session
 */
export async function logoutUser() {
  cachedJwt = null;
  jwtExpiry = 0;

  const acc = ensureAccount();
  if (acc) {
    try {
      await acc.deleteSession('current');
    } catch (err) {
      console.warn('Session delete warning:', err.message);
    }
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem('courseit_guest_quota');
  localStorage.removeItem('courseit_admin_mode');
  
  // Notify listeners across app
  window.dispatchEvent(new Event('courseit_auth_changed'));
  window.dispatchEvent(new Event('courseit_quota_updated'));

  return { isAuthenticated: false, isAdmin: false, user: null, quota: null };
}

/**
 * Archive user account via backend and trigger Resend email
 */
export async function archiveAccount(reason, feedback) {
  const current = getAuthState();
  if (!current.user?.id) throw new Error('You must be logged in to archive your account');

  const res = await authenticatedFetch('/api/user/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: current.user.id,
      reason,
      feedback
    })
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to archive account');
  }

  // Once archived, log the user out cleanly
  await logoutUser();
  return data;
}

export const loginWithGoogle = signInWithGoogle;
export const loginWithGithub = signInWithGithub;
export const getAdminState = getAuthState;
export const logoutAdmin = logoutUser;

/**
 * Record user consent for Terms & Privacy directly on Appwrite account preferences
 */
export async function recordUserConsent(termsVersion = '1.8.0') {
  const timestamp = new Date().toISOString();
  if (account) {
    try {
      const current = await account.getPrefs();
      await account.updatePrefs({
        ...current,
        terms_consented_at: timestamp,
        terms_version: termsVersion
      });
    } catch (err) {
      console.warn('Could not update Appwrite account prefs for consent:', err.message);
    }
  }
  const auth = getAuthState();
  if (auth.user?.id) {
    localStorage.setItem(`courseit_consent_${auth.user.id}`, timestamp);
    if (!auth.user.prefs) auth.user.prefs = {};
    auth.user.prefs.terms_consented_at = timestamp;
    auth.user.prefs.terms_version = termsVersion;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }
  window.dispatchEvent(new Event('courseit_consent_updated'));
  return { success: true, timestamp };
}

/**
 * Check if the authenticated user has already consented to Terms & Privacy
 */
export function hasUserConsented(user) {
  if (!user || !user.id) return true; // Only applies to authenticated accounts
  if (user.prefs?.terms_consented_at) return true;
  if (localStorage.getItem(`courseit_consent_${user.id}`)) return true;
  return false;
}
