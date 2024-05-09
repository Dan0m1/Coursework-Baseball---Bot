import axios from 'axios';

export async function upsertUser(userId: number, name: string) {
    const options = {
        method: 'PUT',
        url: process.env.BACKEND_URL + '/api/v1/user',
        headers: {
            'content-type': 'application/json',
        },
        data: {
            userId: userId,
            name: name
        },
    };
    try {
        const result = await axios.request(options);
    }
    catch (error) {
        console.error(error)
    }
}