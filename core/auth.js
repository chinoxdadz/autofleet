/**
 * core/auth.js — AuthManager (Supabase Auth)
 *
 * Thin wrapper around Supabase Auth for email + password authentication.
 * The Supabase client automatically persists the session in localStorage
 * so the user stays logged in across page reloads.
 */

export class AuthManager {
  /** @param {import('@supabase/supabase-js').SupabaseClient} sb */
  constructor(sb) {
    this.sb = sb;
  }

  /**
   * Check whether there is a valid active session.
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    const { data } = await this.sb.auth.getSession();
    return !!data.session;
  }

  /**
   * Sign in with email and password.
   * @returns {{ ok: boolean, message?: string }}
   */
  async login(email, password) {
    const { error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  }

  /**
   * Create a new account (first-time setup).
   * @returns {{ ok: boolean, message?: string }}
   */
  async signUp(email, password) {
    const { error } = await this.sb.auth.signUp({ email, password });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  }

  /**
   * Sign out and clear the session.
   */
  async logout() {
    await this.sb.auth.signOut();
  }

  /**
   * Update the password for the currently signed-in user.
   * @returns {{ ok: boolean, message?: string }}
   */
  async changePassword(newPassword) {
    const { error } = await this.sb.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  }
}

