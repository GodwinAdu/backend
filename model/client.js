
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config()


export const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset:'production',
    apiVersion: '2023-08-05',
    useCdn: true,
    token: process.env.SANITY_TOKEN_KEY
})