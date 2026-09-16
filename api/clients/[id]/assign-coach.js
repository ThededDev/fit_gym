import { findUserById, findClientProfile, updateClientProfile, findCoachByInviteCode } from '../../_supabase.js';
import { corsJson, handlePreflight } from '../../_cors.js';

export async function OPTIONS(request) {
  return handlePreflight(request);
}

export async function POST(request, { params }) {
  try {
    const clientId = params.id;
    const body = await request.text();
    const payload = body ? JSON.parse(body) : {};
    const { coachId, inviteCode } = payload;

    if (!coachId && !inviteCode) {
      return corsJson({ error: 'Требуется ID тренера или инвайт код' }, { status: 400 });
    }

    let targetCoachId = coachId;

    if (inviteCode) {
      const coach = await findCoachByInviteCode(inviteCode);
      if (!coach) {
        return corsJson({ error: 'Инвайт код не найден' }, { status: 404 });
      }
      targetCoachId = coach.user_id;
    }

    const client = await findUserById(clientId);
    if (!client || client.role !== 'client') {
      return corsJson({ error: 'Клиент не найден' }, { status: 404 });
    }

    const coach = await findUserById(targetCoachId);
    if (!coach || coach.role !== 'coach') {
      return corsJson({ error: 'Тренер не найден' }, { status: 404 });
    }

    const profile = await findClientProfile(clientId);
    if (profile && profile.coach_id) {
      return corsJson({ error: 'Клиент уже работает с тренером' }, { status: 400 });
    }

    await updateClientProfile(clientId, { coach_id: targetCoachId });

    console.log('[ASSIGN] Coach', targetCoachId, 'assigned to client', clientId);
    return corsJson({ message: 'Тренер успешно назначен', clientId, coachId: targetCoachId });
  } catch (error) {
    console.error('[ASSIGN] Error:', error.message, error.stack);
    return corsJson({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const clientId = params.id;

    const client = await findUserById(clientId);
    if (!client) {
      return corsJson({ error: 'Клиент не найден' }, { status: 404 });
    }

    await updateClientProfile(clientId, { coach_id: null });

    console.log('[ASSIGN] Coach removed from client', clientId);
    return corsJson({ message: 'Привязка к тренеру удалена', clientId });
  } catch (error) {
    console.error('[ASSIGN] DELETE error:', error.message, error.stack);
    return corsJson({ error: 'Internal server error' }, { status: 500 });
  }
}
