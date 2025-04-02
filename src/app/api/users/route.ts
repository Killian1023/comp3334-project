import { NextApiRequest, NextApiResponse } from 'next';
import { getUserById, updateUser, deleteUser } from '../../../db/index';
import { authenticateUser } from '../../../lib/auth';
import { logAction } from '../../../lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    switch (method) {
        case 'GET':
            const userId = req.query.id;
            const user = await getUserById(userId);
            if (user) {
                res.status(200).json(user);
            } else {
                res.status(404).json({ message: 'User not found' });
            }
            break;

        case 'PUT':
            const { id, ...userData } = req.body;
            const updatedUser = await updateUser(id, userData);
            logAction(`User updated: ${id}`);
            res.status(200).json(updatedUser);
            break;

        case 'DELETE':
            const deleteId = req.query.id;
            await deleteUser(deleteId);
            logAction(`User deleted: ${deleteId}`);
            res.status(204).end();
            break;

        default:
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}