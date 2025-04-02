import { v4 as uuidv4 } from 'uuid';

export const generateUniqueId = () => {
    return uuidv4();
};

export const formatDate = (date: Date) => {
    return date.toISOString();
};

export const sanitizeInput = (input: string) => {
    return input.replace(/<[^>]*>/g, '');
};

export const logAction = (action: string, userId: string) => {
    console.log(`[${formatDate(new Date())}] User: ${userId}, Action: ${action}`);
};