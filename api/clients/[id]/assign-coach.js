import { findUserById, findClientProfile, updateClientProfile, findCoachByInviteCode, selectAll } from '../../_supabase.js';

export async function POST(request, { params }) {
  try {
    const clientId = params.id;
    const body = await request.text();
    const payload = body ? JSON.parse(body) : {};
    const { coachId, inviteCode } = payload;

    if (!coachId && !inviteCode) {
      return Response.json({ error: 'Требуется ID тренера или инвайт код' }, { status: 400 });
    }

    let targetCoachId = coachId;

    if (inviteCode) {
      const coach = await findCoachByInviteCode(inviteCode);
      if (!coach) {
        return Response.json({ error: 'Инвайт код не найден' }, { status: 404 });
      }
      targetCoachId = coach.user_id;
    }

    const client = await findUserById(clientId);
    if (!client || client.role !== 'client') {
      return Response.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    const coach = await findUserById(targetCoachId);
    if (!coach || coach.role !== 'coach') {
      return Response.json({ error: 'Тренер не найден' }, { status: 404 });
    }

    const profile = await findClientProfile(clientId);
    if (profile && profile.coach_id) {
      return Response.json({ error: 'Клиент уже работает с тренером' }, { status: 400 });
    }

    await updateClientProfile(clientId, { coach_id: targetCoachId });

    return Response.json({ message: 'Тренер успешно назначен', clientId, coachId: targetCoachId });
  } catch (error) {
    console.error('Assign coach error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const clientId = params.id;

    const client = await findUserById(clientId);
    if (!client) {
      return Response.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    await updateClientProfile(clientId, { coach_id: null });

    return Response.json({ message: 'Привязка к тренеру удалена', clientId });
  } catch (error) {
    console.error('Remove coach error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
