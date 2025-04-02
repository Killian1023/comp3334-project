import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser, deleteUser } from '../../../lib/auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('id');
  
  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }
  
  try {
    const user = await getUserById(userId);
    if (user) {
      return NextResponse.json(user);
    } else {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error retrieving user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const data = await request.json();
  const { id, ...userData } = data;
  
  if (!id) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }
  
  try {
    const updatedUser = await updateUser(id, userData);
    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const deleteId = searchParams.get('id');
  
  if (!deleteId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }
  
  try {
    await deleteUser(deleteId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to delete user' }, { status: 500 });
  }
}