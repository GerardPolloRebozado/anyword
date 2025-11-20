
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import {NextResponse} from "next/server";

export async function POST(req: Request) {
  try {
    const { playerName } = await req.json();

    if (!playerName) {
      return new Response(JSON.stringify({ error: 'Player name is required' }), { status: 400 });
    }

    const userId = uuidv4();

    cookies().set('userId', userId, { path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    cookies().set('playerName', playerName, { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });

    return NextResponse.json({ success: true, userId, playerName });
  } catch (error) {
    console.error('Error setting user:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
