import {
  processDocumentationUrl,
  processDocumentText,
  getUserQuota,
  registerUserSignup,
  listAllUsers,
  getAuthIdentityOverview,
  approveUserAndSendEmail,
  topUpUserCredits,
  deleteCourse,
  archiveUserAccount,
  clearUserLearningData,
  permanentDeleteUserAccount,
  setUserCreditBalance,
  createProfileFromAuthIdentity,
  submitUserFeedback,
  listAllFeedbacks,
  updateFeedbackStatus,
  testAllEmailsToAdmin,
  sendCustomTesterEmail,
  getTokenMetrics,
  getCreditHistory,
  verifyAppwriteSession,
  MODEL_CREDIT_COSTS
} from './handler.js';

import { handleTutorQuery, TUTOR_CREDIT_COSTS } from './tutor.js';
import { listCatalog, readCourse, publishCourse, readMaintenance, writeMaintenance } from './catalog.js';
import { apiError } from './errors.js';
import { captureUnexpectedError } from './observability.js';
import { discoverDocumentationSections } from './discover.js';
import { validateDocumentUrl } from './safeFetch.js';
import { getGenerationJob, runGenerationJob } from './generationJobs.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Appwrite-JWT, x-appwrite-jwt, x-admin-mode',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(body)
});

const extractJwt = (headers) => {
  const h = headers['x-appwrite-jwt'] || headers['X-Appwrite-JWT'] || headers['authorization'] || headers['Authorization'];
  if (!h) return null;
  if (h.startsWith('Bearer ')) return h.slice(7).trim();
  return h.trim();
};

const authenticate = async (headers) => {
  const jwt = extractJwt(headers);
  if (!jwt) return null;
  const session = await verifyAppwriteSession(jwt);
  if (!session) throw Object.assign(new Error('Your session expired. Sign in again.'), { status: 401 });
  return session;
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true });
  }
  if (Buffer.byteLength(event.body || '', 'utf8') > 128 * 1024) {
    return jsonResponse(413, { error: 'Request is too large (128 KB limit).' });
  }

  // Normalize subpath (e.g. /.netlify/functions/api/summarize -> /summarize, /api/summarize -> /summarize)
  let subpath = event.path || '';
  subpath = subpath.replace(/^\/\.netlify\/functions\/api/, '').replace(/^\/api/, '');
  if (!subpath.startsWith('/')) subpath = '/' + subpath;

  // Strip trailing slash if present
  if (subpath.length > 1 && subpath.endsWith('/')) {
    subpath = subpath.slice(0, -1);
  }

  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch {
      body = {};
    }
  }

  const query = event.queryStringParameters || {};
  const headers = event.headers || {};

  try {
    if (subpath.startsWith('/generation/jobs/')) {
      if (event.httpMethod !== 'GET') return jsonResponse(405, { error: 'Method not allowed' });
      const session = await authenticate(headers);
      const result = await getGenerationJob(subpath.slice('/generation/jobs/'.length), session?.userId || 'public_guest', session);
      return jsonResponse(result.status, result.body);
    }
    if (subpath === '/maintenance') {
      if (event.httpMethod === 'GET') return jsonResponse(200, { success: true, enabled: await readMaintenance() });
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const session = await authenticate(headers);
      if (!session?.isAdmin) return jsonResponse(403, { error: 'Admin access required.' });
      if (typeof body.enabled !== 'boolean') return jsonResponse(400, { error: 'enabled must be a boolean.' });
      return jsonResponse(200, { success: true, enabled: await writeMaintenance(body.enabled) });
    }
    if (subpath === '/courses' && event.httpMethod === 'GET') {
      const session = await authenticate(headers);
      return jsonResponse(200, { success: true, courses: await listCatalog(session, query.scope) });
    }
    if (subpath === '/courses/publish' && event.httpMethod === 'POST') {
      const session = await authenticate(headers);
      if (!session) return jsonResponse(401, { error: 'Sign in to publish a course.' });
      return jsonResponse(200, { success: true, course: await publishCourse(body.courseId, session) });
    }
    if (subpath.startsWith('/courses/') && event.httpMethod === 'GET') {
      const session = await authenticate(headers);
      return jsonResponse(200, { success: true, course: await readCourse(subpath.slice('/courses/'.length), session) });
    }
    if (subpath === '/user/history') {
      const session = await authenticate(headers);
      if (!session) return jsonResponse(401, { error: 'Sign in to view usage history.' });
      return jsonResponse(200, { success: true, history: await getCreditHistory(session.userId) });
    }
    // 1. Model costs
    if (subpath === '/models/costs') {
      return jsonResponse(200, { success: true, costs: MODEL_CREDIT_COSTS });
    }

    // 2. User quota
    if (subpath === '/user/quota') {
      const session = await authenticate(headers);
      const quota = await getUserQuota(session?.userId || 'public_guest', session?.userEmail || '', session?.userName || '', Boolean(session?.isAdmin));
      return jsonResponse(200, { success: true, quota, costs: MODEL_CREDIT_COSTS });
    }

    // 3. User signup
    if (subpath === '/user/signup') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const session = await authenticate(headers);
      if (!session) return jsonResponse(401, { error: 'Sign in to register your access request.' });
      await registerUserSignup(session.userId, session.userName, session.userEmail);
      return jsonResponse(200, { success: true });
    }

    // 4. Legacy password reset endpoint: never issue a nonfunctional code.
    if (subpath === '/user/reset-password') {
      return jsonResponse(410, { success: false, error: 'Update the app and request an Appwrite password recovery link.' });
    }

    // Bounded discovery: one SSRF-checked index page, no crawler or provider call.
    if (subpath === '/documentation/discover') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const { url, topic } = body;
      if (typeof url !== 'string' || url.length > 2048) return jsonResponse(400, { error: 'Enter a documentation URL under 2048 characters.' });
      return jsonResponse(200, { success: true, ...(await discoverDocumentationSections(url, topic)) });
    }

    // 5. Documentation summarization (URL)
    if (subpath === '/summarize') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const { url, model } = body;
      if (!url) return jsonResponse(400, { error: 'URL is required' });
      if (typeof url !== 'string' || url.length > 2048) return jsonResponse(400, { error: 'Enter a documentation URL under 2048 characters.' });

      const session = await authenticate(headers);
      if (body.userId && !session) return jsonResponse(401, { error: 'Sign in again before generating a course.' });
      if (session && body.visibility !== undefined && !['private', 'community', 'public'].includes(body.visibility)) {
        return jsonResponse(400, { error: 'Choose private, community, or public course visibility.' });
      }
      if (!session?.isAdmin && await readMaintenance()) return jsonResponse(503, { error: 'Course generation is paused for maintenance. Please try later.' });
      const effectiveUserId = session?.userId || 'public_guest';
      const effectiveUserEmail = session?.userEmail || '';
      const effectiveIsAdmin = Boolean(session?.isAdmin);

      let targetModel = model || 'gemini-flash-lite-latest';
      if (!session && !effectiveIsAdmin && targetModel !== 'gemini-flash-lite-latest') {
        targetModel = 'gemini-flash-lite-latest';
      }

      let inputUrl = url;
      if (body.inputUrl !== undefined) {
        if (typeof body.inputUrl !== 'string' || body.inputUrl.length > 2048 ||
            validateDocumentUrl(body.inputUrl).origin !== validateDocumentUrl(url).origin) {
          return jsonResponse(400, { error: 'Original documentation URL must use the selected section host.' });
        }
        inputUrl = body.inputUrl;
      }
      if (body.topic !== undefined && (typeof body.topic !== 'string' || body.topic.length > 120)) {
        return jsonResponse(400, { error: 'Learning topic must be under 120 characters.' });
      }
      const result = await runGenerationJob({ id: body.requestId, actor: effectiveUserId,
        payload: { type: 'url', url, inputUrl, topic: body.topic?.trim() || null,
          model: targetModel, visibility: session ? body.visibility || 'private' : 'public' }, session,
        work: (onStage, requestId) => processDocumentationUrl(url, targetModel, effectiveIsAdmin, false,
          effectiveUserId, effectiveUserEmail, body.visibility,
          { inputUrl, topic: body.topic?.trim() || null, userName: session?.userName || null, onStage, requestId }) });
      return jsonResponse(result.status, result.body);
    }

    // 6. Summarize document / OCR text (/summarize-text and /document)
    if (subpath === '/summarize-text' || subpath === '/document') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const { title, text, model } = body;
      if (typeof text !== 'string' || !text.trim()) return jsonResponse(400, { error: 'Text content is required' });
      if (text.length > 100000 || (typeof title === 'string' && title.length > 200)) {
        return jsonResponse(413, { error: 'Document text is too large (100,000 characters maximum).' });
      }

      const session = await authenticate(headers);
      if (body.userId && !session) return jsonResponse(401, { error: 'Sign in again before generating a course.' });
      if (session && body.visibility !== undefined && !['private', 'community', 'public'].includes(body.visibility)) {
        return jsonResponse(400, { error: 'Choose private, community, or public course visibility.' });
      }
      if (!session?.isAdmin && await readMaintenance()) return jsonResponse(503, { error: 'Course generation is paused for maintenance. Please try later.' });
      const effectiveUserId = session?.userId || 'public_guest';
      const effectiveUserEmail = session?.userEmail || '';
      const effectiveIsAdmin = Boolean(session?.isAdmin);

      let targetModel = model || 'gemini-flash-lite-latest';
      if (!session && !effectiveIsAdmin && targetModel !== 'gemini-flash-lite-latest') {
        targetModel = 'gemini-flash-lite-latest';
      }

      const result = await runGenerationJob({ id: body.requestId, actor: effectiveUserId,
        payload: { type: 'document', title, text, model: targetModel,
          visibility: session ? body.visibility || 'private' : 'public' }, session,
        work: (onStage, requestId) => processDocumentText({ title, text, customModel: targetModel,
          isAdmin: effectiveIsAdmin, userId: effectiveUserId, userEmail: effectiveUserEmail,
          userName: session?.userName || null, visibility: body.visibility, onStage, requestId }) });
      return jsonResponse(result.status, result.body);
    }

    // 6.5. Interactive Technical Course Tutor
    if (subpath === '/tutor') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const session = await authenticate(headers);
      const { courseId, stepIndex, question, mode, recentMessages, troubleCategory, errorMessage } = body;
      const result = await handleTutorQuery({
        courseId,
        stepIndex,
        question,
        mode,
        recentMessages,
        troubleCategory,
        errorMessage,
        session
      });
      return jsonResponse(200, result);
    }

    // 7. Course deletion
    if (subpath === '/courses/delete') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const session = await authenticate(headers);
      const { courseId, userId, userEmail } = body;
      if (typeof courseId !== 'string' || !/^[a-zA-Z0-9_.-]{1,64}$/.test(courseId)) {
        return jsonResponse(400, { error: 'A valid courseId is required.' });
      }

      if (!session) return jsonResponse(401, { error: 'Sign in to delete a course.' });
      const verifiedUserId = session.userId;
      const verifiedEmail = session.userEmail;
      const verifiedIsAdmin = Boolean(session?.isAdmin);

      const result = await deleteCourse(courseId, verifiedUserId, verifiedEmail, verifiedIsAdmin);
      return jsonResponse(200, result);
    }

    // 8. User archive account
    if (subpath === '/user/archive') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const { reason, feedback, userId } = body;
      const session = await authenticate(headers);
      const effectiveUserId = session?.userId;

      if (!effectiveUserId) {
        return jsonResponse(401, { error: 'Active user session or userId required.' });
      }

      const result = await archiveUserAccount(effectiveUserId, reason, feedback);
      return jsonResponse(200, result);
    }

    // 9. Feedback endpoints
    if (subpath === '/feedback') {
      if (event.httpMethod === 'POST') {
        const session = await authenticate(headers);
        if (!session) return jsonResponse(401, { error: 'Sign in to submit feedback.' });
        const { category, rating, message, pageUrl } = body;
        if (typeof message !== 'string' || !message.trim() || message.length > 4000 ||
            typeof category !== 'string' || category.length > 80 ||
            !Number.isInteger(rating) || rating < 1 || rating > 5) {
          return jsonResponse(400, { error: 'Provide a rating, category and feedback under 4000 characters.' });
        }
        const result = await submitUserFeedback({
          userId: session.userId,
          email: session.userEmail,
          name: session.userName,
          category,
          rating,
          message: message.trim(),
          pageUrl: typeof pageUrl === 'string' ? pageUrl.slice(0, 400) : ''
        });
        return jsonResponse(200, result);
      } else if (event.httpMethod === 'GET') {
        const session = await authenticate(headers);
        if (!session || !session.isAdmin) {
          return jsonResponse(403, { error: 'Forbidden: Admin access required.' });
        }
        const feedbacks = await listAllFeedbacks();
        return jsonResponse(200, { success: true, count: feedbacks.length, feedbacks });
      }
    }

    // 10. Admin users
    if (subpath === '/admin/users') {
      const session = await authenticate(headers);
      if (!session || !session.isAdmin) {
        return jsonResponse(403, { error: 'Forbidden: Admin access required.' });
      }
      const [users, auth] = await Promise.all([listAllUsers(), getAuthIdentityOverview()]);
      return jsonResponse(200, { success: true, count: users.length, users, auth });
    }

    // 11. Admin approve
    if (subpath === '/admin/approve') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const session = await authenticate(headers);
      if (!session || !session.isAdmin) {
        return jsonResponse(403, { error: 'Forbidden: Admin access required.' });
      }
      const { userId, email, credits } = body;
      const result = await approveUserAndSendEmail(userId, email, credits || 250);
      return jsonResponse(200, result);
    }

    // 12. Admin topup
    if (subpath === '/admin/topup') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const session = await authenticate(headers);
      if (!session || !session.isAdmin) {
        return jsonResponse(403, { error: 'Forbidden: Admin access required.' });
      }
      const { userId, amount, credits } = body;
      const result = await topUpUserCredits(userId, amount || credits || 250);
      return jsonResponse(200, { success: true, user: result });
    }

    // 13. Admin feedback status
    if (subpath === '/admin/feedbacks/status') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const session = await authenticate(headers);
      if (!session || !session.isAdmin) {
        return jsonResponse(403, { error: 'Forbidden: Admin access required.' });
      }
      const { feedbackId, status } = body;
      const result = await updateFeedbackStatus(feedbackId, status);
      return jsonResponse(200, result);
    }

    // 14. Admin test emails
    if (subpath === '/admin/test-all-emails') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const session = await authenticate(headers);
      if (!session || !session.isAdmin) {
        return jsonResponse(403, { error: 'Forbidden: Admin access required.' });
      }
      const { targetEmail } = body;
      const result = await testAllEmailsToAdmin(targetEmail);
      return jsonResponse(200, result);
    }

    // 15. Admin custom email
    if (subpath === '/admin/send-custom-email') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const session = await authenticate(headers);
      if (!session || !session.isAdmin) {
        return jsonResponse(403, { error: 'Forbidden: Admin access required.' });
      }
      const { to, subject, message, isBroadcast } = body;
      const result = await sendCustomTesterEmail({ to, subject, message, isBroadcast });
      return jsonResponse(200, result);
    }

    // 16. Admin token metrics
    if (subpath === '/admin/token-metrics') {
      const session = await authenticate(headers);
      if (!session || !session.isAdmin) {
        return jsonResponse(403, { error: 'Forbidden: Admin access required.' });
      }
      const metrics = await getTokenMetrics();
      return jsonResponse(200, { success: true, metrics });
    }

    return jsonResponse(404, { error: `Endpoint not found: ${subpath}` });
  } catch (err) {
    const failure = apiError(err);
    console.error('[CourseIT API error]', { route: subpath, status: failure.status,
      code: failure.body.code || 'API_ERROR' });
    if (failure.status === 500) await captureUnexpectedError(err, { route: subpath });
    return jsonResponse(failure.status, failure.body);
  }
}
