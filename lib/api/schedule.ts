import axios, {AxiosError} from 'axios';
// @ts-ignore
export async function fetchSchedule(date: string) {
    const options = {
        method: 'GET',
        url: process.env.BACKEND_URL + '/api/v1/schedule',
        headers: {
            'content-type': 'application/json',
        },
        data: {
            date: date,
        },
    };


    try{
        const response = await axios.request(options);
        console.log(response.data);
        return response.data;

// @ts-ignore
    }catch (error: AxiosError) {
        console.log(error.response)
        if(error.response.status == "404"){
            return (404);
        }
        if(error.response.status == "400"){
            return (400);
        }
        console.log(error)
    }
}