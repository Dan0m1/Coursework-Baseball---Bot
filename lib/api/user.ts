import axios from 'axios';

export async function upsertUser(userId: number, name: string) {
    const options = {
        method: 'PUT',
        url: process.env.BACKEND_URL + '/api/v1/user',
        headers: {
            'content-type': 'application/json',
        },
        data: {
            id: userId,
            name: name
        },
    };
    try {
        const response = await axios.request(options);
        console.log(response.data);
    }
    catch (error) {
        console.error(error)
    }
}