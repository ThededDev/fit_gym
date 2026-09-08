import { query } from '../../_db.js';

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

    // If invite code is provided, find the coach
    if (inviteCode) {
      const coachResult = await query(
        'SELECT user_id FROM coach_profiles WHERE invite_code = $1',
        [inviteCode]
      );

      if (coachResult.rows.length === 0) {
        return Response.json({ error: 'Инвайт код не найден' }, { status: 404 });
      }

      targetCoachId = coachResult.rows[0].user_id;
    }

    // Check if client exists
    const clientResult = await query(
      'SELECT id, role FROM users WHERE id = $1',
      [clientId]
    );

    if (clientResult.rows.length === 0) {
      return Response.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    if (clientResult.rows[0].role !== 'client') {
      return Response.json({ error: 'Пользователь не является клиентом' }, { status: 400 });
    }

    // Check if coach exists and is actually a coach
    const coachResult = await query(
      'SELECT id, role FROM users WHERE id = $1',
      [targetCoachId]
    );

    if (coachResult.rows.length === 0) {
      return Response.json({ error: 'Тренер не найден' }, { status: 404 });
    }

    if (coachResult.rows[0].role !== 'coach') {
      return Response.json({ error: 'Пользователь не является тренером' }, { status: 400 });
    }

    // Check if client already has a coach
    const currentCoachResult = await query(
      'SELECT coach_id FROM client_profiles WHERE user_id = $1',
      [clientId]
    );

    if (currentCoachResult.rows.length > 0 && currentCoachResult.rows[0].coach_id) {
      return Response.json({ error: 'Клиент уже работает с тренером' }, { status: 400 });
    }

    // Assign coach to client
    await query(
      'UPDATE client_profiles SET coach_id = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [targetCoachId, clientId]
    );

    return Response.json({ 
      message: 'Тренер успешно назначен',
      clientId,
      coachId: targetCoachId
    });
  } catch (error) {
    console.error('Assign coach error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const clientId = params.id;

    // Check if client exists
    const clientResult = await query(
      'SELECT id FROM users WHERE id = $1',
      [clientId]
    );

    if (clientResult.rows.length === 0) {
      return Response.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    // Remove coach assignment
    await query(
      'UPDATE client_profiles SET coach_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [clientId]
    );

    return Response.json({ 
      message: 'Привязка к тренеру удалена',
      clientId
    });
  } catch (error) {
    console.error('Remove coach error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}