import axios from "axios";

export async function createTicket(userId: string, gameId: string, place: string, email: string) {
    const options = {
        method: 'POST',
        url: process.env.BACKEND_URL + '/api/v1/ticket',
        headers: {
            'content-type': 'application/json',
        },
        data: {
            userId: userId,
            gameId: gameId,
            place: place,
            email: email,
        },
    };
    try {
        const response = await axios.request(options);
        return response.data;
    }
    catch (error) {
        console.error(error)
    }
}

export async function getTickets(userId: string){
    const options = {
        method: 'GET',
        url: process.env.BACKEND_URL + '/api/v1/ticket',
        headers: {
            'content-type': 'application/json',
        },
        data: {
            userId: userId,
        },
    };
    try {
        const response = await axios.request(options);
        return response.data;
    }
    catch (error) {
        // @ts-ignore
        if(error.response.status == "404"){
            return (404);
        }
    }
}