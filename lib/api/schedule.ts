import axios, {AxiosError} from 'axios';
// @ts-ignore
export async function fetchSchedule(date: string) {
    const params = date.split('-');

    const options = {
        method: 'GET',
        url: process.env.BACKEND_URL + '/api/v1/schedule',
        headers: {
            'content-type': 'application/json',
        },
        data: {
            year: params[0],
            month: params[1],
            day: params[2]
        },
    };


    try{
        const response = await axios.request(options);

        return response.data;

// @ts-ignore
    }catch (error: AxiosError) {
        if(error.response.status === 404){
            return (404);
        }
        if(error.response.status === 400){
            return (400);
        }
    }
}