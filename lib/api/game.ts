import  axios, {AxiosError} from 'axios';
// @ts-ignore
export async function getGame(id: string) {
    const options = {
        method: 'GET',
        url: process.env.BACKEND_URL + '/api/v1/game',
        headers: {
            'content-type': 'application/json',
        },
        data: {
            gameId: id
        },
    };


    try{
        const response = await axios.request(options);

        console.log(response.data);
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