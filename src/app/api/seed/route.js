import { HOSPITAL_DATA } from '../../../lib/mockData';
import { db } from '../../../lib/firebase';
import { ref, set } from 'firebase/database';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await set(ref(db, '/hospitals'), HOSPITAL_DATA);
    return NextResponse.json({ success: true, message: 'Hospitals seeded successfully!' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
