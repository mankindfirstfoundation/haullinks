(() => {
  'use strict';

  const config = window.HAULLINKS_AUTH_CONFIG || {};
  const LOGIN_PAGE = config.loginPage || 'login.html';
  const DASHBOARD_PAGE = config.dashboardPage || 'index.html';
  const ALLOWED_DASHBOARDS = new Set(['index.html', 'haullinks-dashboard.html']);
  const currentPage = (location.pathname.split('/').pop() || DASHBOARD_PAGE).toLowerCase();
  const isLoginPage = currentPage === LOGIN_PAGE.toLowerCase();

  function authError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function validateConfiguration() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw authError('library', 'The local Supabase authentication library could not be loaded.');
    }
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.supabaseUrl || '')) {
      throw authError('configuration', 'The Supabase Project URL is missing or invalid.');
    }
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey || '')) {
      throw authError('configuration', 'The Supabase publishable key is missing or invalid.');
    }
  }

  let client;
  try {
    validateConfiguration();
    client = window.supabase.createClient(config.supabaseUrl, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'haullinks_supabase_auth_v1'
      }
    });
  } catch (error) {
    window.HaulLinksAuth = {
      configurationError: error,
      client: null,
      requireUser: () => Promise.reject(error),
      signIn: () => Promise.reject(error)
    };
    return;
  }

  function safeDashboardPage(value) {
    const page = String(value || '').split(/[?#]/)[0].split('/').pop().toLowerCase();
    return ALLOWED_DASHBOARDS.has(page) ? page : DASHBOARD_PAGE;
  }

  function loginUrl(reason) {
    const next = safeDashboardPage(currentPage);
    const query = new URLSearchParams({ next });
    if (reason) query.set('reason', reason);
    return `${LOGIN_PAGE}?${query.toString()}`;
  }

  function redirectToLogin(reason) {
    if (!isLoginPage) location.replace(loginUrl(reason));
  }

  function redirectToDashboard(requestedPage) {
    location.replace(safeDashboardPage(requestedPage));
  }

  async function verifiedUser() {
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) throw authError('authentication', 'Your session is missing or has expired.');
    return data.user;
  }

  async function accessStatus(userId) {
    const { data, error } = await client
      .from('haullinks_user_access')
      .select('active')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      const setupCodes = new Set(['42P01', 'PGRST116', 'PGRST205']);
      if (setupCodes.has(error.code)) {
        throw authError('access_setup', 'The HaulLinks access-control table has not been configured.');
      }
      throw authError('access_check', 'HaulLinks could not verify account access.');
    }
    return data?.active === true;
  }

  async function requireUser() {
    const user = await verifiedUser();
    const allowed = await accessStatus(user.id);
    if (!allowed) {
      pendingSignOutReason = 'disabled';
      await client.auth.signOut({ scope: 'local' }).catch(() => {});
      throw authError('disabled', 'This HaulLinks account is disabled.');
    }
    return user;
  }

  async function signIn(email, password) {
    const { data, error } = await client.auth.signInWithPassword({
      email: String(email || '').trim().toLowerCase(),
      password: String(password || '')
    });
    if (error || !data?.user) throw authError('credentials', 'The email or password is incorrect.');

    let allowed = false;
    try {
      allowed = await accessStatus(data.user.id);
    } catch (accessError) {
      await client.auth.signOut({ scope: 'local' }).catch(() => {});
      throw accessError;
    }
    if (!allowed) {
      await client.auth.signOut({ scope: 'local' }).catch(() => {});
      throw authError('disabled', 'This HaulLinks account is disabled.');
    }
    return data.user;
  }

  let pendingSignOutReason = '';
  async function logoutLocal() {
    pendingSignOutReason = 'signed_out';
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw error;
  }

  async function updatePassword(password) {
    const { data, error } = await client.auth.updateUser({ password });
    if (error) throw error;
    return data.user;
  }

  let monitorTimer = 0;
  let monitorRunning = false;
  async function monitorAccess(userId) {
    if (monitorRunning) return;
    monitorRunning = true;
    try {
      if (!(await accessStatus(userId))) {
        clearInterval(monitorTimer);
        pendingSignOutReason = 'disabled';
        await client.auth.signOut({ scope: 'local' }).catch(() => {});
        redirectToLogin('disabled');
      }
    } catch (error) {
      // Keep a valid session during a temporary network outage and try again later.
      console.warn('HaulLinks access check deferred:', error.message);
    } finally {
      monitorRunning = false;
    }
  }

  function startAccessMonitor(userId) {
    clearInterval(monitorTimer);
    const seconds = Math.max(15, Number(config.accessCheckSeconds) || 30);
    monitorTimer = setInterval(() => monitorAccess(userId), seconds * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') monitorAccess(userId);
    });
    window.addEventListener('focus', () => monitorAccess(userId));
  }

  client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT' && !isLoginPage) redirectToLogin(pendingSignOutReason || 'expired');
  });

  window.HaulLinksAuth = Object.freeze({
    client,
    requireUser,
    signIn,
    logoutLocal,
    updatePassword,
    accessStatus,
    startAccessMonitor,
    redirectToLogin,
    redirectToDashboard,
    safeDashboardPage,
    configurationError: null
  });
})();
